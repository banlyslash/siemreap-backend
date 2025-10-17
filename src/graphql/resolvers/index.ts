import { authResolvers } from './auth.resolver'
import { leaveRequestResolvers } from './leave-request.resolver'

// Merge all resolvers
const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...leaveRequestResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...leaveRequestResolvers.Mutation,
  },
}

export default resolvers
