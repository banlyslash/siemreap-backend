import { GraphQLContext } from '../context'
import { GraphQLError } from 'graphql'
import { requireAuth } from '@/utils/auth'
import { UserRole } from '@/generated/client'
import * as bcrypt from 'bcryptjs'

export const userResolvers = {
  Query: {
    /**
     * Get all users
     */
    users: async (_: any, __: any, { prisma, user }: GraphQLContext) => {
      requireAuth(user)
      
      return prisma.user.findMany({
        orderBy: { firstName: 'asc' }
      })
    },

    /**
     * Get a single user by ID
     */
    user: async (_: any, { id }: { id: string }, { prisma, user }: GraphQLContext) => {
      requireAuth(user)
      
      const foundUser = await prisma.user.findUnique({
        where: { id }
      })

      if (!foundUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      return foundUser
    },

    /**
     * Get team members for a manager
     */
    teamMembers: async (_: any, { managerId }: { managerId: string }, { prisma, user }: GraphQLContext) => {
      requireAuth(user)
      
      // Only managers and HR can access this query
      if (user?.role !== 'manager' && user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to view team members', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Check if the manager exists
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      })
      
      if (!manager) {
        throw new GraphQLError('Manager not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }
      
      // In a real application, you would have a relation between managers and employees
      // For now, we'll just return all employees as team members
      return prisma.user.findMany({
        where: {
          role: 'employee'
        },
        orderBy: { firstName: 'asc' }
      })
    },

    /**
     * Get team members on leave today
     */
    teamOnLeaveToday: async (_: any, { managerId }: { managerId: string }, { prisma, user }: GraphQLContext) => {
      requireAuth(user)
      
      // Only managers and HR can access this query
      if (user?.role !== 'manager' && user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to view team leave status', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Check if the manager exists
      const manager = await prisma.user.findUnique({
        where: { id: managerId }
      })
      
      if (!manager) {
        throw new GraphQLError('Manager not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }
      
      // Get current date at midnight for date comparisons
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      // Find all approved leave requests that include today
      return prisma.leaveRequest.findMany({
        where: {
          status: 'hr_approved',
          startDate: { lte: tomorrow },
          endDate: { gte: today },
          user: {
            role: 'employee'
          }
        },
        include: {
          user: true,
          leaveType: true
        },
        orderBy: { startDate: 'asc' }
      })
    }
  },

  Mutation: {
    /**
     * Create a new user
     */
    createUser: async (
      _: any,
      { input }: { input: { email: string; password: string; firstName: string; lastName: string; role: UserRole } },
      { prisma, user }: GraphQLContext
    ) => {
      requireAuth(user)
      
      // Only HR and managers can create users
      if (user?.role !== 'hr' && user?.role !== 'manager') {
        throw new GraphQLError('Not authorized to create users', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email }
      })
      
      if (existingUser) {
        throw new GraphQLError('Email already in use', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10)
      
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role
        }
      })
      
      return newUser
    },

    /**
     * Update an existing user
     */
    updateUser: async (
      _: any,
      { id, input }: { id: string; input: { email?: string; password?: string; firstName?: string; lastName?: string; role?: UserRole } },
      { prisma, user }: GraphQLContext
    ) => {
      requireAuth(user)
      
      // Find the user to update
      const userToUpdate = await prisma.user.findUnique({
        where: { id }
      })
      
      if (!userToUpdate) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }
      
      // Check permissions
      // Only HR can update any user
      // Managers can update employees but not other managers or HR
      // Employees can only update their own profile
      if (
        user?.role === 'employee' && id !== user.id ||
        user?.role === 'manager' && userToUpdate.role !== 'employee' && id !== user.id
      ) {
        throw new GraphQLError('Not authorized to update this user', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Prepare update data
      const updateData: any = {}
      
      if (input.email) {
        // Check if email is already in use by another user
        if (input.email !== userToUpdate.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: input.email }
          })
          
          if (existingUser) {
            throw new GraphQLError('Email already in use', {
              extensions: { code: 'BAD_USER_INPUT' }
            })
          }
        }
        
        updateData.email = input.email
      }
      
      if (input.password) {
        updateData.password = await bcrypt.hash(input.password, 10)
      }
      
      if (input.firstName) {
        updateData.firstName = input.firstName
      }
      
      if (input.lastName) {
        updateData.lastName = input.lastName
      }
      
      // Only HR can change roles
      if (input.role && user?.role === 'hr') {
        updateData.role = input.role
      }
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData
      })
      
      return updatedUser
    }
  },

  // Type resolvers
  User: {
    leaveRequests: async (parent: any, _: any, { prisma }: GraphQLContext) => {
      return prisma.leaveRequest.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'desc' }
      })
    },
    
    managedRequests: async (parent: any, _: any, { prisma }: GraphQLContext) => {
      return prisma.leaveRequest.findMany({
        where: { managerId: parent.id },
        orderBy: { createdAt: 'desc' }
      })
    },
    
    leaveBalances: async (parent: any, _: any, { prisma }: GraphQLContext) => {
      return prisma.leaveBalance.findMany({
        where: { userId: parent.id },
        include: { leaveType: true }
      })
    }
  }
}
