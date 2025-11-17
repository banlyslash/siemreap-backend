import { Request, Response, NextFunction } from 'express'
import { logger } from './logger'
import prisma from '@/lib/prisma'

/**
 * Interface for API key authentication result
 */
export interface ApiKeyAuthResult {
  authenticated: boolean
  apiKey?: any // The API key object if authentication was successful
  serviceName?: string // The name of the service that the API key belongs to
  permissions?: string[] // The permissions granted to the API key
}

/**
 * Verify an API key
 * @param apiKey The API key to verify
 * @returns Promise<ApiKeyAuthResult> The authentication result
 */
export async function verifyApiKey(apiKey: string): Promise<ApiKeyAuthResult> {
  try {
    // If no API key provided, return unauthenticated
    if (!apiKey) {
      return { authenticated: false }
    }

    // Find the API key in the database
    // Note: We need to run a migration after adding the ApiKey model to Prisma schema
    // For now, we'll use a type assertion to avoid TypeScript errors
    const foundApiKey = await (prisma as any).apiKey.findUnique({
      where: { key: apiKey }
    })

    // If API key not found, return unauthenticated
    if (!foundApiKey) {
      logger.warn(`API key authentication failed: Key not found`)
      return { authenticated: false }
    }

    // Check if API key is active
    if (!foundApiKey.active) {
      logger.warn(`API key authentication failed: Key inactive - ${foundApiKey.name}`)
      return { authenticated: false }
    }

    // Check if API key has expired
    if (foundApiKey.expiresAt && foundApiKey.expiresAt < new Date()) {
      logger.warn(`API key authentication failed: Key expired - ${foundApiKey.name}`)
      return { authenticated: false }
    }

    // Update last used timestamp
    await (prisma as any).apiKey.update({
      where: { id: foundApiKey.id },
      data: { lastUsedAt: new Date() }
    })

    // Return successful authentication result
    return {
      authenticated: true,
      apiKey: foundApiKey,
      serviceName: foundApiKey.serviceName,
      permissions: foundApiKey.permissions
    }
  } catch (error) {
    logger.error('Error verifying API key:', error)
    return { authenticated: false }
  }
}

/**
 * Express middleware to authenticate requests using API key
 * @param requiredPermissions Optional array of permissions that the API key must have
 */
export function requireApiKey(requiredPermissions?: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get API key from header
      const apiKey = req.headers['x-api-key'] as string

      // Verify the API key
      const authResult = await verifyApiKey(apiKey)

      if (!authResult.authenticated) {
        res.status(401).json({
          status: 'error',
          message: 'Unauthorized: Invalid API key'
        })
        return
      }

      // Check permissions if required
      if (requiredPermissions && requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => 
          authResult.permissions?.includes(permission)
        )

        if (!hasAllPermissions) {
          res.status(403).json({
            status: 'error',
            message: 'Forbidden: Insufficient permissions'
          })
          return
        }
      }

      // Add API key info to request object for use in route handlers
      // Use a simple type assertion to avoid TypeScript errors
      const reqWithApiKey = req as any
      reqWithApiKey.apiKey = authResult.apiKey
      reqWithApiKey.serviceName = authResult.serviceName
      reqWithApiKey.apiKeyPermissions = authResult.permissions

      next()
    } catch (error) {
      logger.error('API key authentication error:', error)
      res.status(500).json({
        status: 'error',
        message: 'Internal server error during authentication'
      })
    }
  }
}
