import { GraphQLContext } from '../context'
import { GraphQLError } from 'graphql'
import { requireAuth } from '@/utils/auth'
import { LeaveRequestStatus } from '@/generated/client'
import { NotificationService } from '@/services/notification.service'
import { createLeaveAudit } from './leave-history.resolver'

export const leaveRequestResolvers = {
  Query: {
    // Get all leave requests with optional filters
    leaveRequests: async (
      _: any,
      args: {
        status?: LeaveRequestStatus
        userId?: string
        startDate?: Date
        endDate?: Date
      },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)

      // Build filters
      const filters: any = {}
      
      if (args.status) {
        filters.status = args.status
      }
      
      if (args.userId) {
        filters.userId = args.userId
      }
      
      // Date range filter
      if (args.startDate || args.endDate) {
        filters.OR = []
        
        if (args.startDate && args.endDate) {
          // Find requests that overlap with the given date range
          filters.OR.push({
            AND: [
              { startDate: { lte: new Date(args.endDate) } },
              { endDate: { gte: new Date(args.startDate) } }
            ]
          })
        } else if (args.startDate) {
          filters.startDate = { gte: new Date(args.startDate) }
        } else if (args.endDate) {
          filters.endDate = { lte: new Date(args.endDate) }
        }
      }

      // If user is an employee, only show their own requests
      if (user?.role === 'employee') {
        filters.userId = user.id
      }
      
      // If user is a manager, show their team's requests and their own
      if (user?.role === 'manager') {
        if (!filters.userId) {
          filters.OR = filters.OR || []
          filters.OR.push(
            { userId: user.id },
            { managerId: user.id }
          )
        }
      }

      return prisma.leaveRequest.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })
    },

    // Get a single leave request by ID
    leaveRequest: async (_: any, args: { id: string }, context: GraphQLContext) => {
      const { prisma, user } = context
      requireAuth(user)

      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: args.id },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })

      if (!leaveRequest) {
        throw new GraphQLError('Leave request not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Check if user has permission to view this leave request
      if (
        user?.role === 'employee' &&
        leaveRequest.userId !== user.id
      ) {
        throw new GraphQLError('Not authorized to view this leave request', {
          extensions: { code: 'FORBIDDEN' }
        })
      }

      return leaveRequest
    },

    // For managers to see pending requests they need to approve
    pendingApprovals: async (_: any, _args: {}, context: GraphQLContext) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Only managers can access this query
      if (user?.role !== 'manager') {
        throw new GraphQLError('Not authorized to view pending approvals', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Find all pending leave requests that need manager approval
      return prisma.leaveRequest.findMany({
        where: {
          status: LeaveRequestStatus.pending,
          // In a real application, you would have a relation between managers and employees
          // For now, we'll just fetch all pending requests
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })
    },

    // For HR to see requests approved by managers
    managerApprovedRequests: async (_: any, _args: {}, context: GraphQLContext) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Only HR can access this query
      if (user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to view manager approved requests', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Find all leave requests approved by managers that need HR approval
      return prisma.leaveRequest.findMany({
        where: {
          status: LeaveRequestStatus.manager_approved
        },
        orderBy: { managerActionAt: 'desc' },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })
    },

    // For HR to see all pending leave requests that need follow-up
    hrPendingApprovals: async (_: any, _args: {}, context: GraphQLContext) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Only HR can access this query
      if (user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to view pending approvals', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Find all pending leave requests for HR to follow up
      return prisma.leaveRequest.findMany({
        where: {
          status: LeaveRequestStatus.pending
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })
    }
  },

  Mutation: {
    // Create a new leave request
    createLeaveRequest: async (
      _: any,
      args: { input: { 
        userId: string
        employeeId?: string // For backward compatibility
        leaveTypeId: string
        startDate: Date
        endDate: Date
        halfDay?: boolean
        halfDayStart?: boolean
        halfDayEnd?: boolean
        reason?: string
      } },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      const { input } = args
      
      // Validate dates
      const startDate = new Date(input.startDate)
      const endDate = new Date(input.endDate)
      
      if (startDate > endDate) {
        throw new GraphQLError('Start date must be before end date', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }

      // Check if user is requesting leave for themselves or has admin/HR permissions
      if (input.userId !== user?.id && user?.role === 'employee') {
        throw new GraphQLError('You can only create leave requests for yourself', {
          extensions: { code: 'FORBIDDEN' }
        })
      }

      // Check if leave type exists
      const leaveType = await prisma.leaveType.findUnique({
        where: { id: input.leaveTypeId }
      })

      if (!leaveType) {
        throw new GraphQLError('Leave type not found', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }

      // Check if user exists
      const requestUser = await prisma.user.findUnique({
        where: { id: input.userId }
      })

      if (!requestUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }

      // Calculate working days (excluding weekends)
      // This is a simplified version - a more complete implementation would also exclude holidays
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
      if (input.halfDay && workingDays > 0) {
        workingDays -= 0.5
      }

      // Check leave balance
      const currentYear = new Date().getFullYear()
      const leaveBalance = await prisma.leaveBalance.findFirst({
        where: {
          userId: input.userId,
          leaveTypeId: input.leaveTypeId,
          year: currentYear
        }
      })

      if (!leaveBalance) {
        throw new GraphQLError('No leave balance found for this leave type', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }

      const remainingBalance = leaveBalance.allocated - leaveBalance.used
      
      if (workingDays > remainingBalance) {
        throw new GraphQLError(`Insufficient leave balance. Available: ${remainingBalance}, Requested: ${workingDays}`, {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }

      // Handle employeeId for backward compatibility
      const userId = input.userId || input.employeeId
      
      if (!userId) {
        throw new GraphQLError('Either userId or employeeId must be provided', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }
      
      // Handle half day logic
      // If halfDayStart or halfDayEnd is provided, set halfDay to true
      const halfDay = input.halfDay || input.halfDayStart || input.halfDayEnd || false
      
      // Create the leave request
      const leaveRequest = await prisma.leaveRequest.create({
        data: {
          userId,
          leaveTypeId: input.leaveTypeId,
          startDate,
          endDate,
          halfDay,
          reason: input.reason,
          status: LeaveRequestStatus.pending
        },
        include: {
          user: true,
          leaveType: true
        }
      })

      // Send notification
      await NotificationService.sendLeaveRequestSubmittedNotification(
        leaveRequest,
        leaveRequest.user
      )

      // Create audit entry
      if (user) {
        await createLeaveAudit(
          prisma,
          leaveRequest.id,
          'created' as any, // Type assertion as a temporary fix
          user.id,
          'Leave request created',
          undefined,
          LeaveRequestStatus.pending
        )
      }

      return leaveRequest
    },

    // Update an existing leave request
    updateLeaveRequest: async (
      _: any,
      args: { 
        id: string,
        input: {
          leaveTypeId?: string
          startDate?: Date
          endDate?: Date
          halfDay?: boolean
          reason?: string
          status?: LeaveRequestStatus
          managerId?: string
          managerComment?: string
          managerActionAt?: Date
          hrId?: string
          hrComment?: string
          hrActionAt?: Date
        }
      },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      const { id, input } = args
      
      // Find the leave request
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id }
      })

      if (!leaveRequest) {
        throw new GraphQLError('Leave request not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Check permissions
      if (
        user?.role === 'employee' &&
        leaveRequest.userId !== user.id
      ) {
        throw new GraphQLError('Not authorized to update this leave request', {
          extensions: { code: 'FORBIDDEN' }
        })
      }

      // Employees can only update their own pending requests
      if (
        user?.role === 'employee' &&
        leaveRequest.status !== LeaveRequestStatus.pending
      ) {
        throw new GraphQLError('Cannot update a leave request that is not pending', {
          extensions: { code: 'FORBIDDEN' }
        })
      }

      // Validate dates if provided
      if (input.startDate && input.endDate) {
        const startDate = new Date(input.startDate)
        const endDate = new Date(input.endDate)
        
        if (startDate > endDate) {
          throw new GraphQLError('Start date must be before end date', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
      }

      // Update the leave request
      const updatedLeaveRequest = await prisma.leaveRequest.update({
        where: { id },
        data: input,
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })

      return updatedLeaveRequest
    },

    // Approve a leave request (by manager or HR)
    approveLeaveRequest: async (
      _: any,
      args: { id: string, comment?: string },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Only managers and HR can approve requests
      if (user?.role !== 'manager' && user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to approve leave requests', {
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

      let updateData: any = {}
      
      // Manager approval
      if (user.role === 'manager') {
        if (leaveRequest.status !== LeaveRequestStatus.pending) {
          throw new GraphQLError('Can only approve pending leave requests', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        updateData = {
          status: LeaveRequestStatus.manager_approved,
          managerId: user.id,
          managerComment: comment,
          managerActionAt: new Date()
        }
      }
      
      // HR approval
      if (user.role === 'hr') {
        if (leaveRequest.status !== LeaveRequestStatus.manager_approved) {
          throw new GraphQLError('Can only approve manager-approved leave requests', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        updateData = {
          status: LeaveRequestStatus.hr_approved,
          hrId: user.id,
          hrComment: comment,
          hrActionAt: new Date()
        }
        
        // Update leave balance when HR approves
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
      }

      // Update the leave request
      const updatedLeaveRequest = await prisma.leaveRequest.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })

      // Send appropriate notifications
      if (user.role === 'manager') {
        await NotificationService.sendManagerApprovalNotification(
          updatedLeaveRequest,
          updatedLeaveRequest.user,
          user
        )
        
        // Create audit entry for manager approval
        await createLeaveAudit(
          prisma,
          id,
          'approved_by_manager' as any,
          user.id,
          comment || 'Approved by manager',
          LeaveRequestStatus.pending,
          LeaveRequestStatus.manager_approved
        )
      } else if (user.role === 'hr') {
        await NotificationService.sendHRApprovalNotification(
          updatedLeaveRequest,
          updatedLeaveRequest.user,
          user
        )
        
        // Create audit entry for HR approval
        await createLeaveAudit(
          prisma,
          id,
          'approved_by_hr' as any,
          user.id,
          comment || 'Approved by HR',
          LeaveRequestStatus.manager_approved,
          LeaveRequestStatus.hr_approved
        )
      }

      return updatedLeaveRequest
    },

    // Reject a leave request (by manager or HR)
    rejectLeaveRequest: async (
      _: any,
      args: { id: string, comment: string },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Only managers and HR can reject requests
      if (user?.role !== 'manager' && user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to reject leave requests', {
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

      let updateData: any = {}
      
      // Manager rejection
      if (user.role === 'manager') {
        if (leaveRequest.status !== LeaveRequestStatus.pending) {
          throw new GraphQLError('Can only reject pending leave requests', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        updateData = {
          status: LeaveRequestStatus.manager_rejected,
          managerId: user.id,
          managerComment: comment,
          managerActionAt: new Date()
        }
      }
      
      // HR rejection
      if (user.role === 'hr') {
        if (leaveRequest.status !== LeaveRequestStatus.manager_approved) {
          throw new GraphQLError('Can only reject manager-approved leave requests', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        updateData = {
          status: LeaveRequestStatus.hr_rejected,
          hrId: user.id,
          hrComment: comment,
          hrActionAt: new Date()
        }
      }

      // Update the leave request
      const updatedLeaveRequest = await prisma.leaveRequest.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })

      // Send appropriate notifications
      if (user.role === 'manager') {
        await NotificationService.sendManagerRejectionNotification(
          updatedLeaveRequest,
          updatedLeaveRequest.user,
          user
        )
        
        // Create audit entry for manager rejection
        await createLeaveAudit(
          prisma,
          id,
          'rejected_by_manager' as any,
          user.id,
          comment,
          LeaveRequestStatus.pending,
          LeaveRequestStatus.manager_rejected
        )
      } else if (user.role === 'hr') {
        await NotificationService.sendHRRejectionNotification(
          updatedLeaveRequest,
          updatedLeaveRequest.user,
          user
        )
        
        // Create audit entry for HR rejection
        await createLeaveAudit(
          prisma,
          id,
          'rejected_by_hr' as any,
          user.id,
          comment,
          LeaveRequestStatus.manager_approved,
          LeaveRequestStatus.hr_rejected
        )
      }

      return updatedLeaveRequest
    },

    // Cancel a leave request (by the employee who created it)
    cancelLeaveRequest: async (
      _: any,
      args: { id: string },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      const { id } = args
      
      // Find the leave request
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id }
      })

      if (!leaveRequest) {
        throw new GraphQLError('Leave request not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Check if user is the owner of the leave request or has admin/HR permissions
      if (
        leaveRequest.userId !== user?.id &&
        user?.role === 'employee'
      ) {
        throw new GraphQLError('Not authorized to cancel this leave request', {
          extensions: { code: 'FORBIDDEN' }
        })
      }

      // Can only cancel pending or manager_approved requests
      if (
        leaveRequest.status !== LeaveRequestStatus.pending &&
        leaveRequest.status !== LeaveRequestStatus.manager_approved
      ) {
        throw new GraphQLError('Cannot cancel a leave request that has been fully processed', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }

      // Update the leave request
      const updatedLeaveRequest = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveRequestStatus.cancelled
        },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })

      // Send cancellation notification
      await NotificationService.sendCancellationNotification(
        updatedLeaveRequest,
        updatedLeaveRequest.user
      )
      
      // Create audit entry for cancellation
      if (user) {
        await createLeaveAudit(
          prisma,
          id,
          'cancelled' as any,
          user.id,
          'Leave request cancelled',
          leaveRequest.status,
          LeaveRequestStatus.cancelled
        )
      }

      return updatedLeaveRequest
    }
  }
}
