import { GraphQLContext } from '../context'
import { GraphQLError } from 'graphql'
import { requireAuth } from '@/utils/auth'
import { LeaveRequestStatus } from '@/generated/client'
import { NotificationService } from '@/services/notification.service'

/**
 * Compatibility resolvers for frontend integration
 * These resolvers provide role-specific approval mutations and handle field mapping
 */
export const leaveRequestCompatibilityResolvers = {
  LeaveRequest: {
    // Map user to employee for backward compatibility
    employee: (parent: any) => parent.user,
    employeeId: (parent: any) => parent.userId,

    // Compute halfDayStart and halfDayEnd from halfDay
    halfDayStart: (parent: any) => parent.halfDay,
    halfDayEnd: (_parent: any) => false, // Default to false, frontend can specify which one they want

    // Create managerApproval object for backward compatibility
    managerApproval: (parent: any) => {
      if (!parent.managerId) return null
      
      return {
        approved: parent.status === LeaveRequestStatus.manager_approved || 
                 parent.status === LeaveRequestStatus.hr_approved || 
                 parent.status === LeaveRequestStatus.hr_rejected,
        comment: parent.managerComment,
        timestamp: parent.managerActionAt,
        by: parent.manager
      }
    },

    // Create hrApproval object for backward compatibility
    hrApproval: (parent: any) => {
      if (!parent.hrId) return null
      
      return {
        approved: parent.status === LeaveRequestStatus.hr_approved,
        comment: parent.hrComment,
        timestamp: parent.hrActionAt,
        by: parent.hr
      }
    }
  },

  LeaveBalance: {
    // Map allocated to entitled for backward compatibility
    entitled: (parent: any) => parent.allocated,
    
    // Calculate pending leave
    pending: async (parent: any, _: any, context: GraphQLContext) => {
      const { prisma } = context
      
      // Find all pending leave requests for this user, leave type, and year
      const pendingRequests = await prisma.leaveRequest.findMany({
        where: {
          userId: parent.userId,
          leaveTypeId: parent.leaveTypeId,
          status: {
            in: [LeaveRequestStatus.pending, LeaveRequestStatus.manager_approved]
          },
          startDate: {
            gte: new Date(parent.year, 0, 1)
          },
          endDate: {
            lte: new Date(parent.year, 11, 31)
          }
        }
      })
      
      // Calculate working days for each request
      let pendingDays = 0
      
      for (const request of pendingRequests) {
        const startDate = new Date(request.startDate)
        const endDate = new Date(request.endDate)
        
        // Calculate working days (excluding weekends)
        let workingDays = 0
        const currentDate = new Date(startDate)
        
        while (currentDate <= endDate) {
          // Skip weekends (0 = Sunday, 6 = Saturday)
          const dayOfWeek = currentDate.getDay()
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }
        
        // Adjust for half day if applicable
        if (request.halfDay && workingDays > 0) {
          workingDays -= 0.5
        }
        
        pendingDays += workingDays
      }
      
      return pendingDays
    }
  },

  Mutation: {
    // Manager-specific approval mutation
    managerApproveLeaveRequest: async (
      _: any,
      args: { id: string, comment?: string },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Only managers can use this mutation
      if (user?.role !== 'manager') {
        throw new GraphQLError('Not authorized. Only managers can use this mutation.', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      const { id, comment } = args
      
      // Find the leave request
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id }
      })

      if (!leaveRequest) {
        throw new GraphQLError('Leave request not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Validate status
      if (leaveRequest.status !== LeaveRequestStatus.pending) {
        throw new GraphQLError('Can only approve pending leave requests', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
      
      // Update the leave request
      const updatedLeaveRequest = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveRequestStatus.manager_approved,
          managerId: user.id,
          managerComment: comment,
          managerActionAt: new Date()
        },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })

      // Send notification
      await NotificationService.sendManagerApprovalNotification(
        updatedLeaveRequest,
        updatedLeaveRequest.user,
        user
      )

      return updatedLeaveRequest
    },

    // Manager-specific rejection mutation
    managerRejectLeaveRequest: async (
      _: any,
      args: { id: string, comment: string },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Only managers can use this mutation
      if (user?.role !== 'manager') {
        throw new GraphQLError('Not authorized. Only managers can use this mutation.', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      const { id, comment } = args
      
      if (!comment || comment.trim() === '') {
        throw new GraphQLError('Comment is required when rejecting a leave request', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
      
      // Find the leave request
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id }
      })

      if (!leaveRequest) {
        throw new GraphQLError('Leave request not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Validate status
      if (leaveRequest.status !== LeaveRequestStatus.pending) {
        throw new GraphQLError('Can only reject pending leave requests', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
      
      // Update the leave request
      const updatedLeaveRequest = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveRequestStatus.manager_rejected,
          managerId: user.id,
          managerComment: comment,
          managerActionAt: new Date()
        },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })

      // Send notification
      await NotificationService.sendManagerRejectionNotification(
        updatedLeaveRequest,
        updatedLeaveRequest.user,
        user
      )

      return updatedLeaveRequest
    },

    // HR-specific approval mutation
    hrApproveLeaveRequest: async (
      _: any,
      args: { id: string, comment?: string },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Only HR can use this mutation
      if (user?.role !== 'hr') {
        throw new GraphQLError('Not authorized. Only HR can use this mutation.', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      const { id, comment } = args
      
      // Find the leave request
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id }
      })

      if (!leaveRequest) {
        throw new GraphQLError('Leave request not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Validate status
      if (leaveRequest.status !== LeaveRequestStatus.manager_approved) {
        throw new GraphQLError('Can only approve manager-approved leave requests', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
      
      // Calculate working days for leave balance update
      const startDate = new Date(leaveRequest.startDate)
      const endDate = new Date(leaveRequest.endDate)
      
      // Calculate working days (excluding weekends)
      let workingDays = 0
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        // Skip weekends (0 = Sunday, 6 = Saturday)
        const dayOfWeek = currentDate.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDays++
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // Adjust for half day if applicable
      if (leaveRequest.halfDay && workingDays > 0) {
        workingDays -= 0.5
      }
      
      // Update leave balance
      const currentYear = new Date().getFullYear()
      await prisma.leaveBalance.updateMany({
        where: {
          userId: leaveRequest.userId,
          leaveTypeId: leaveRequest.leaveTypeId,
          year: currentYear
        },
        data: {
          used: {
            increment: workingDays
          }
        }
      })
      
      // Update the leave request
      const updatedLeaveRequest = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveRequestStatus.hr_approved,
          hrId: user.id,
          hrComment: comment,
          hrActionAt: new Date()
        },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })

      // Send notification
      await NotificationService.sendHRApprovalNotification(
        updatedLeaveRequest,
        updatedLeaveRequest.user,
        user
      )

      return updatedLeaveRequest
    },

    // HR-specific rejection mutation
    hrRejectLeaveRequest: async (
      _: any,
      args: { id: string, comment: string },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Only HR can use this mutation
      if (user?.role !== 'hr') {
        throw new GraphQLError('Not authorized. Only HR can use this mutation.', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      const { id, comment } = args
      
      if (!comment || comment.trim() === '') {
        throw new GraphQLError('Comment is required when rejecting a leave request', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
      
      // Find the leave request
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id }
      })

      if (!leaveRequest) {
        throw new GraphQLError('Leave request not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Validate status
      if (leaveRequest.status !== LeaveRequestStatus.manager_approved) {
        throw new GraphQLError('Can only reject manager-approved leave requests', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
      
      // Update the leave request
      const updatedLeaveRequest = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveRequestStatus.hr_rejected,
          hrId: user.id,
          hrComment: comment,
          hrActionAt: new Date()
        },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })

      // Send notification
      await NotificationService.sendHRRejectionNotification(
        updatedLeaveRequest,
        updatedLeaveRequest.user,
        user
      )

      return updatedLeaveRequest
    }
  },

  Query: {
    // Aggregated leave balances for a user
    userLeaveBalances: async (
      _: any,
      args: { userId: string, year?: number },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      const { userId, year = new Date().getFullYear() } = args
      
      // Check permissions
      if (
        user?.role === 'employee' &&
        user.id !== userId
      ) {
        throw new GraphQLError('Not authorized to view other users\' leave balances', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Get all leave balances for the user and year
      const balances = await prisma.leaveBalance.findMany({
        where: {
          userId,
          year
        },
        include: {
          user: true,
          leaveType: true
        }
      })
      
      return {
        userId,
        year,
        balances
      }
    }
  }
}
