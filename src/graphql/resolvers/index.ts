import { authResolvers } from './auth.resolver'

// Merge all resolvers
const resolvers = {
  Query: {
    ...authResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
  },
}

export default resolvers
