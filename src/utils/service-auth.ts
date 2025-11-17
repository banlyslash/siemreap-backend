import { GraphQLContext } from '@/graphql/context'
import { GraphQLError } from 'graphql'

/**
 * Check if the request is authenticated via API key or user token
 * @param context GraphQL context
 * @param requiredPermissions Optional array of permissions required for API key authentication
 */
export function requireServiceAuth(
  context: GraphQLContext,
  requiredPermissions?: string[]
): void {
  const { user, apiKeyAuth, isServiceRequest } = context

  // If authenticated via user token, we're good
  if (user) {
    return
  }

  // If not authenticated via API key, throw error
  if (!isServiceRequest || !apiKeyAuth?.authenticated) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    })
  }

  // If permissions are required, check them
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      apiKeyAuth.permissions?.includes(permission)
    )

    if (!hasAllPermissions) {
      throw new GraphQLError('Insufficient permissions', {
        extensions: { code: 'FORBIDDEN' }
      })
    }
  }
}
