import { GraphQLContext } from '../context'
import { GraphQLError } from 'graphql'
import { requireAuth } from '@/utils/auth'

export const leaveTypeResolvers = {
  Query: {
    /**
     * Get all leave types
     */
    leaveTypes: async (_: any, __: any, { prisma, user }: GraphQLContext) => {
      requireAuth(user)
      
      return prisma.leaveType.findMany({
        orderBy: { name: 'asc' }
      })
    },

    /**
     * Get a single leave type by ID
     */
    leaveType: async (_: any, { id }: { id: string }, { prisma, user }: GraphQLContext) => {
      requireAuth(user)
      
      const leaveType = await prisma.leaveType.findUnique({
        where: { id }
      })

      if (!leaveType) {
        throw new GraphQLError('Leave type not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      return leaveType
    }
  },

  Mutation: {
    /**
     * Create a new leave type
     */
    createLeaveType: async (
      _: any,
      { input }: { input: { name: string; description?: string; color?: string; active?: boolean } },
      { prisma, user }: GraphQLContext
    ) => {
      requireAuth(user)
      
      // Only HR can create leave types
      if (user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to create leave types', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Check if name already exists
      const existingLeaveType = await prisma.leaveType.findUnique({
        where: { name: input.name }
      })
      
      if (existingLeaveType) {
        throw new GraphQLError('Leave type with this name already exists', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
      
      // Set default color if not provided
      const color = input.color || '#3498db'
      
      // Create leave type
      const newLeaveType = await prisma.leaveType.create({
        data: {
          name: input.name,
          description: input.description,
          color,
          active: input.active !== undefined ? input.active : true
        }
      })
      
      return newLeaveType
    },

    /**
     * Update an existing leave type
     */
    updateLeaveType: async (
      _: any,
      { id, input }: { id: string; input: { name?: string; description?: string; color?: string; active?: boolean } },
      { prisma, user }: GraphQLContext
    ) => {
      requireAuth(user)
      
      // Only HR can update leave types
      if (user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to update leave types', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Find the leave type to update
      const leaveType = await prisma.leaveType.findUnique({
        where: { id }
      })
      
      if (!leaveType) {
        throw new GraphQLError('Leave type not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }
      
      // Check if name already exists (if name is being updated)
      if (input.name && input.name !== leaveType.name) {
        const existingLeaveType = await prisma.leaveType.findUnique({
          where: { name: input.name }
        })
        
        if (existingLeaveType) {
          throw new GraphQLError('Leave type with this name already exists', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
      }
      
      // Update leave type
      const updatedLeaveType = await prisma.leaveType.update({
        where: { id },
        data: input
      })
      
      return updatedLeaveType
    }
  },

  // Type resolvers
  LeaveType: {
    leaveRequests: async (parent: any, _: any, { prisma }: GraphQLContext) => {
      return prisma.leaveRequest.findMany({
        where: { leaveTypeId: parent.id },
        orderBy: { createdAt: 'desc' }
      })
    },
    
    leaveBalances: async (parent: any, _: any, { prisma }: GraphQLContext) => {
      return prisma.leaveBalance.findMany({
        where: { leaveTypeId: parent.id },
        include: { user: true }
      })
    }
  }
}
