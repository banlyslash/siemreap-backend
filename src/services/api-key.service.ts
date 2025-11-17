import crypto from 'crypto'
import { logger } from '@/utils/logger'
import prisma from '@/lib/prisma'

/**
 * Service for managing API keys
 */
export class ApiKeyService {
  /**
   * Generate a secure random API key
   * @returns string The generated API key
   */
  static generateApiKey(): string {
    // Generate a random 32-byte hex string
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Create a new API key
   * @param name Descriptive name for the API key
   * @param serviceName Name of the service that will use this key
   * @param permissions Array of permissions to grant to this key
   * @param description Optional description of the API key
   * @param expiresAt Optional expiration date for the API key
   * @returns The created API key object
   */
  static async createApiKey(
    name: string,
    serviceName: string,
    permissions: string[],
    description?: string,
    expiresAt?: Date
  ) {
    try {
      const key = this.generateApiKey()

      const apiKey = await (prisma as any).apiKey.create({
        data: {
          key,
          name,
          serviceName,
          permissions,
          description,
          expiresAt,
          active: true
        }
      })

      logger.info(`API key created: ${name} for service ${serviceName}`)
      return apiKey
    } catch (error) {
      logger.error('Error creating API key:', error)
      throw error
    }
  }

  /**
   * Get all API keys
   * @param includeInactive Whether to include inactive API keys
   * @returns Array of API keys
   */
  static async getAllApiKeys(includeInactive = false) {
    try {
      const where = includeInactive ? {} : { active: true }
      return await (prisma as any).apiKey.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      logger.error('Error getting API keys:', error)
      throw error
    }
  }

  /**
   * Get an API key by ID
   * @param id The ID of the API key to get
   * @returns The API key or null if not found
   */
  static async getApiKeyById(id: string) {
    try {
      return await (prisma as any).apiKey.findUnique({
        where: { id }
      })
    } catch (error) {
      logger.error(`Error getting API key with ID ${id}:`, error)
      throw error
    }
  }

  /**
   * Update an API key
   * @param id The ID of the API key to update
   * @param data The data to update
   * @returns The updated API key
   */
  static async updateApiKey(id: string, data: {
    name?: string
    description?: string
    serviceName?: string
    permissions?: string[]
    active?: boolean
    expiresAt?: Date | null
  }) {
    try {
      return await (prisma as any).apiKey.update({
        where: { id },
        data
      })
    } catch (error) {
      logger.error(`Error updating API key with ID ${id}:`, error)
      throw error
    }
  }

  /**
   * Delete an API key
   * @param id The ID of the API key to delete
   * @returns The deleted API key
   */
  static async deleteApiKey(id: string) {
    try {
      return await (prisma as any).apiKey.delete({
        where: { id }
      })
    } catch (error) {
      logger.error(`Error deleting API key with ID ${id}:`, error)
      throw error
    }
  }

  /**
   * Deactivate an API key
   * @param id The ID of the API key to deactivate
   * @returns The updated API key
   */
  static async deactivateApiKey(id: string) {
    try {
      return await (prisma as any).apiKey.update({
        where: { id },
        data: { active: false }
      })
    } catch (error) {
      logger.error(`Error deactivating API key with ID ${id}:`, error)
      throw error
    }
  }

  /**
   * Rotate an API key (generate a new key while preserving other properties)
   * @param id The ID of the API key to rotate
   * @returns The updated API key with a new key value
   */
  static async rotateApiKey(id: string) {
    try {
      const newKey = this.generateApiKey()
      
      return await (prisma as any).apiKey.update({
        where: { id },
        data: { 
          key: newKey,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      logger.error(`Error rotating API key with ID ${id}:`, error)
      throw error
    }
  }
}
