import { GraphQLContext } from '../context'
import { GraphQLError } from 'graphql'
import { requireAuth } from '@/utils/auth'
import { LeaveRequestStatus } from '@/generated/client'

export const statisticsResolvers = {
  Query: {
    // Get leave statistics for dashboard
    leaveStatistics: async (_: any, _args: {}, context: GraphQLContext) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Only managers and HR can access this query
      if (user?.role !== 'manager' && user?.role !== 'hr') {
        throw new GraphQLError('Not authorized to view leave statistics', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Get current date at midnight for date comparisons
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      // Get pending approvals count
      const pendingApprovals = await prisma.leaveRequest.count({
        where: {
          status: LeaveRequestStatus.pending
        }
      })
      
      // Get total employees count
      const totalEmployees = await prisma.user.count({
        where: {
          role: 'employee'
        }
      })
      
      // Get employees on leave today
      const onLeaveToday = await prisma.leaveRequest.count({
        where: {
          status: LeaveRequestStatus.hr_approved,
          startDate: { lte: tomorrow },
          endDate: { gte: today }
        }
      })
      
      // Get leave reports by type
      const leaveTypes = await prisma.leaveType.findMany({
        where: {
          active: true
        }
      })
      
      // Get count of approved leave requests for each type
      const leaveReports = await Promise.all(
        leaveTypes.map(async (leaveType) => {
          const count = await prisma.leaveRequest.count({
            where: {
              leaveTypeId: leaveType.id,
              status: LeaveRequestStatus.hr_approved
            }
          })
          
          return {
            leaveType,
            count,
            percentage: 0 // Will calculate after getting total
          }
        })
      )
      
      // Calculate total approved leave requests
      const totalApproved = leaveReports.reduce((sum, report) => sum + report.count, 0)
      
      // Calculate percentages
      const leaveReportsWithPercentages = leaveReports.map(report => ({
        ...report,
        percentage: totalApproved > 0 ? (report.count / totalApproved) * 100 : 0
      }))
      
      return {
        pendingApprovals,
        totalEmployees,
        onLeaveToday,
        leaveReports: leaveReportsWithPercentages
      }
    }
  }
}
