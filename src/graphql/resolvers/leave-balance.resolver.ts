import { GraphQLContext } from '../context'
import { GraphQLError } from 'graphql'
import { requireAuth } from '@/utils/auth'

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
