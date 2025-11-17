import { GraphQLContext } from '../context'
import { GraphQLError } from 'graphql'
import { requireAuth } from '@/utils/auth'
import { requireServiceAuth } from '@/utils/service-auth'

export const leaveBalanceResolvers = {
  Query: {
    /**
     * Get leave balances with optional filters
     */
    leaveBalances: async (
      _: any,
      args: { userId?: string; year?: number },
      { prisma, user }: GraphQLContext
    ) => {
      requireAuth(user)
      
      // Build filters
      const filters: any = {}
      
      if (args.userId) {
        filters.userId = args.userId
      }
      
      if (args.year) {
        filters.year = args.year
      } else {
        // Default to current year if not specified
        filters.year = new Date().getFullYear()
      }
      
      // If user is an employee, only show their own balances
      if (user?.role === 'employee') {
        filters.userId = user.id
      }
      
      return prisma.leaveBalance.findMany({
        where: filters,
        include: {
          user: true,
          leaveType: true
        },
        orderBy: [
          { userId: 'asc' },
          { leaveType: { name: 'asc' } }
        ]
      })
    },

    /**
     * Get a single leave balance by ID
     */
    leaveBalance: async (_: any, { id }: { id: string }, { prisma, user }: GraphQLContext) => {
      requireAuth(user)
      
      const leaveBalance = await prisma.leaveBalance.findUnique({
        where: { id },
        include: {
          user: true,
          leaveType: true
        }
      })

      if (!leaveBalance) {
        throw new GraphQLError('Leave balance not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Check if user has permission to view this leave balance
      if (
        user?.role === 'employee' &&
        leaveBalance.userId !== user.id
      ) {
        throw new GraphQLError('Not authorized to view this leave balance', {
          extensions: { code: 'FORBIDDEN' }
        })
      }

      return leaveBalance
    },

    /**
     * Get leave balances for a user by email (API key authentication)
     * Requires API key with 'read:leaves' permission
     */
    leaveBalancesByEmail: async (
      _: any,
      args: { email: string; year?: number },
      context: GraphQLContext
    ) => {
      const { prisma } = context
      
      // Require API key authentication with read:leaves permission
      requireServiceAuth(context, ['read:leaves'])
      
      const { email, year = new Date().getFullYear() } = args
      
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email }
      })
      
      if (!user) {
        throw new GraphQLError(`User with email ${email} not found`, {
          extensions: { code: 'NOT_FOUND' }
        })
      }
      
      // Get all leave balances for the user and year
      const balances = await prisma.leaveBalance.findMany({
        where: {
          userId: user.id,
          year
        },
        include: {
          user: true,
          leaveType: true
        }
      })
      
      return {
        userId: user.id,
        year,
        balances
      }
    }
  },

  Mutation: {
    /**
     * Update an existing leave balance
     */
    updateLeaveBalance: async (
      _: any,
      { id, input }: { id: string; input: { allocated?: number; used?: number } },
      { prisma, user }: GraphQLContext
    ) => {
      requireAuth(user)
      
      // Only HR can update leave balances
      if (user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to update leave balances', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Find the leave balance to update
      const leaveBalance = await prisma.leaveBalance.findUnique({
        where: { id }
      })
      
      if (!leaveBalance) {
        throw new GraphQLError('Leave balance not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }
      
      // Update leave balance
      const updatedLeaveBalance = await prisma.leaveBalance.update({
        where: { id },
        data: input,
        include: {
          user: true,
          leaveType: true
        }
      })
      
      return updatedLeaveBalance
    },

    /**
     * Initialize leave balances for an employee
     * This will create leave balances for all active leave types for the specified employee
     */
    initializeLeaveBalance: async (
      _: any,
      { input }: { input: { userId: string; year?: number; defaultAllocation: number } },
      { prisma, user }: GraphQLContext
    ) => {
      requireAuth(user)
      
      // Only HR can initialize leave balances
      if (user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to initialize leave balances', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      const { userId, year = new Date().getFullYear(), defaultAllocation } = input
      
      // Check if user exists
      const employeeExists = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!employeeExists) {
        throw new GraphQLError('Employee not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }
      
      // Get all active leave types
      const activeLeaveTypes = await prisma.leaveType.findMany({
        where: { active: true }
      })
      
      if (activeLeaveTypes.length === 0) {
        return {
          success: false,
          message: 'No active leave types found',
          balances: []
        }
      }
      
      // Check for existing leave balances for this user and year
      const existingBalances = await prisma.leaveBalance.findMany({
        where: {
          userId,
          year
        }
      })
      
      // Create a map of existing balances by leave type ID
      const existingBalanceMap = new Map()
      existingBalances.forEach(balance => {
        existingBalanceMap.set(balance.leaveTypeId, balance)
      })
      
      // Create or update leave balances for each leave type
      const balancePromises = activeLeaveTypes.map(async leaveType => {
        const existingBalance = existingBalanceMap.get(leaveType.id)
        
        if (existingBalance) {
          // Balance already exists, update it
          return prisma.leaveBalance.update({
            where: { id: existingBalance.id },
            data: {
              allocated: defaultAllocation
            },
            include: {
              user: true,
              leaveType: true
            }
          })
        } else {
          // Create new balance
          return prisma.leaveBalance.create({
            data: {
              userId,
              leaveTypeId: leaveType.id,
              year,
              allocated: defaultAllocation,
              used: 0,
              pending: 0
            },
            include: {
              user: true,
              leaveType: true
            }
          })
        }
      })
      
      try {
        const createdBalances = await Promise.all(balancePromises)
        
        return {
          success: true,
          message: `Successfully initialized ${createdBalances.length} leave balances for employee`,
          balances: createdBalances
        }
      } catch (error) {
        return {
          success: false,
          message: `Failed to initialize leave balances: ${error instanceof Error ? error.message : 'Unknown error'}`,
          balances: []
        }
      }
    }
  },

  // Type resolvers
  LeaveBalance: {
    // Calculate remaining balance
    remaining: (parent: any) => {
      return parent.allocated - parent.used
    }
  }
}
