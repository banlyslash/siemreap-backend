import { GraphQLContext } from '../context'
import { GraphQLError } from 'graphql'
import { requireServiceAuth } from '@/utils/service-auth'
import { LeaveRequestStatus } from '@/generated/client'
import { NotificationService } from '@/services/notification.service'
import { createLeaveAudit } from './leave-history.resolver'

export const leaveBatchResolvers = {
  Mutation: {
    /**
     * Create multiple leave requests in a single operation
     */
    createLeaveBatch: async (
      _: any,
      args: { 
        input: { 
          leaves: Array<{ leaveOn: Date; isHalfDay: boolean }>;
          leaveTypeName?: string;
          userEmail?: string; // Added for service requests
        } 
      },
      context: GraphQLContext
    ) => {
      const { prisma, user, isServiceRequest } = context
      
      // Allow authentication via user token OR API key with 'create:leaves' permission
      requireServiceAuth(context, ['create:leaves'])
      
      // Determine the user ID to use for the leave request
      // If authenticated via API key, we need to specify a user ID in the request
      let authenticatedUser: any
      
      if (isServiceRequest) {
        // For service requests, we need to get the user email from the input
        if (!args.input.userEmail) {
          throw new GraphQLError('userEmail is required for service requests', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
        
        // Find the user by email
        authenticatedUser = await prisma.user.findUnique({
          where: { email: args.input.userEmail }
        })
        
        if (!authenticatedUser) {
          throw new GraphQLError(`User with email ${args.input.userEmail} not found`, {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
      } else {
        // For user token authentication, use the authenticated user
        authenticatedUser = user!
      }
      
      const { leaves, leaveTypeName } = args.input
      
      // Validate request
      if (!leaves || !Array.isArray(leaves) || leaves.length === 0) {
        throw new GraphQLError('Invalid request: leaves array is required', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }

      // Get the current year for leave balance check
      const currentYear = new Date().getFullYear()
      
      // Find the leave type
      let leaveType;
      
      if (!leaveTypeName) {
        // If no leave type provided, find the default leave type (assuming there's an "Annual Leave" type)
        leaveType = await prisma.leaveType.findFirst({
          where: { 
            active: true,
            name: { contains: 'Annual', mode: 'insensitive' }
          }
        })
        
        if (!leaveType) {
          throw new GraphQLError('No active leave type found', {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
      } else {
        // Find the leave type by name
        leaveType = await prisma.leaveType.findFirst({
          where: { 
            name: { contains: leaveTypeName, mode: 'insensitive' },
            active: true
          }
        })
        
        if (!leaveType) {
          throw new GraphQLError(`Leave type "${leaveTypeName}" not found or not active`, {
            extensions: { code: 'BAD_USER_INPUT' }
          })
        }
      }
      
      const targetLeaveTypeId = leaveType.id

      // Check leave balance
      const leaveBalance = await prisma.leaveBalance.findFirst({
        where: {
          userId: authenticatedUser.id,
          leaveTypeId: targetLeaveTypeId,
          year: currentYear
        }
      })

      if (!leaveBalance) {
        throw new GraphQLError('No leave balance found for this leave type', {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }

      // Calculate the number of days being requested
      const numberOfDays = leaves.reduce((total, leave) => {
        return total + (leave.isHalfDay ? 0.5 : 1)
      }, 0)

      // Calculate current remaining balance
      const currentRemainingBalance = leaveBalance.allocated - leaveBalance.used
      
      // Calculate what the new remaining balance will be after these leaves
      const newRemainingBalance = currentRemainingBalance - numberOfDays
      
      if (numberOfDays > currentRemainingBalance) {
        throw new GraphQLError(`Insufficient leave balance. Available: ${currentRemainingBalance}, Requested: ${numberOfDays}`, {
          extensions: { code: 'BAD_USER_INPUT' }
        })
      }

      // Create leave requests for each date
      try {
        const createdLeaves = await Promise.all(
          leaves.map(async (leave) => {
            const leaveDate = new Date(leave.leaveOn)
            
            // Validate the date
            if (isNaN(leaveDate.getTime())) {
              throw new GraphQLError(`Invalid date format: ${leave.leaveOn}`, {
                extensions: { code: 'BAD_USER_INPUT' }
              })
            }
            
            // Create the leave request
            const leaveRequest = await prisma.leaveRequest.create({
              data: {
                userId: authenticatedUser.id,
                leaveTypeId: targetLeaveTypeId,
                startDate: leaveDate,
                endDate: leaveDate, // Same day for single-day leave
                halfDay: leave.isHalfDay,
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
            await createLeaveAudit(
              prisma,
              leaveRequest.id,
              'created' as any,
              authenticatedUser.id,
              'Leave request created',
              undefined,
              LeaveRequestStatus.pending
            )

            return leaveRequest
          })
        )

        // Update the leave balance in the database
        await prisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: { used: leaveBalance.used + numberOfDays }
        })

        return {
          success: true,
          message: `Successfully created ${createdLeaves.length} leave requests`,
          leaveRequests: createdLeaves,
          numberOfDays,
          remainingBalance: newRemainingBalance
        }
      } catch (error) {
        throw new GraphQLError(error instanceof Error ? error.message : 'An unknown error occurred', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        })
      }
    }
  }
}
