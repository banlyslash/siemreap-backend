import { GraphQLError } from 'graphql'
import { comparePasswords, generateToken } from '@utils/auth'
import { GraphQLContext } from '@graphql/context'

export const authResolvers = {
  Query: {
    /**
     * Get the currently authenticated user
     */
    me: (_: any, __: any, { user }: GraphQLContext) => {
      if (!user) {
        return null
      }
      return user
    },
  },
  Mutation: {
    /**
     * Login with email and password
     */
    login: async (
      _: any,
      { email, password }: { email: string; password: string },
      { prisma }: GraphQLContext
    ) => {
      // Find user by email
      const user = await prisma.user.findUnique({ where: { email } })
      
      // If user not found or password doesn't match
      if (!user) {
        throw new GraphQLError('Invalid email or password', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        })
      }
      
      // Check password
      const isValid = await comparePasswords(password, user.password)
      
      if (!isValid) {
        throw new GraphQLError('Invalid email or password', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        })
      }
      
      // Generate JWT token
      const token = generateToken(user)
      
      return {
        token,
        user,
      }
    },
  },
}
