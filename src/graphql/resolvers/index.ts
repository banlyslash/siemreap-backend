import { authResolvers } from './auth.resolver'
import { leaveRequestResolvers } from './leave-request.resolver'
import { leaveRequestCompatibilityResolvers } from './leave-request-compatibility.resolver'
import { leaveHistoryResolvers } from './leave-history.resolver'
import { userResolvers } from './user.resolver'
import { leaveTypeResolvers } from './leave-type.resolver'
import { leaveBalanceResolvers } from './leave-balance.resolver'
import { holidayResolvers } from './holiday.resolver'
import { statisticsResolvers } from './statistics.resolver'

// Merge all resolvers
const resolvers = {
  // Type resolvers
  LeaveRequest: {
    ...leaveRequestCompatibilityResolvers.LeaveRequest,
  },
  LeaveBalance: {
    ...leaveRequestCompatibilityResolvers.LeaveBalance,
    ...leaveBalanceResolvers.LeaveBalance,
  },
  User: {
    ...userResolvers.User,
  },
  LeaveType: {
    ...leaveTypeResolvers.LeaveType,
  },
  
  // Query resolvers
  Query: {
    ...authResolvers.Query,
    ...leaveRequestResolvers.Query,
    ...leaveRequestCompatibilityResolvers.Query,
    ...leaveHistoryResolvers.Query,
    ...userResolvers.Query,
    ...leaveTypeResolvers.Query,
    ...leaveBalanceResolvers.Query,
    ...holidayResolvers.Query,
    ...statisticsResolvers.Query,
  },
  
  // Mutation resolvers
  Mutation: {
    ...authResolvers.Mutation,
    ...leaveRequestResolvers.Mutation,
    ...leaveRequestCompatibilityResolvers.Mutation,
    ...userResolvers.Mutation,
    ...leaveTypeResolvers.Mutation,
    ...leaveBalanceResolvers.Mutation,
    ...holidayResolvers.Mutation,
  },
}

export default resolvers
