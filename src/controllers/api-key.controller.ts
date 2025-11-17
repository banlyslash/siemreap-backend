import { Request, Response } from 'express'
import { ApiKeyService } from '@/services/api-key.service'
import { logger } from '@/utils/logger'

/**
 * Create a new API key
 */
export const createApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, serviceName, permissions, description, expiresAt } = req.body

    // Validate required fields
    if (!name || !serviceName || !permissions || !Array.isArray(permissions)) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required fields: name, serviceName, and permissions array'
      })
      return
    }

    // Create the API key
    const apiKey = await ApiKeyService.createApiKey(
      name,
      serviceName,
      permissions,
      description,
      expiresAt ? new Date(expiresAt) : undefined
    )

    // Return the API key (including the key value)
    // Note: This is the only time the key will be visible in full
    res.status(201).json({
      status: 'success',
      message: 'API key created successfully',
      data: apiKey
    })
  } catch (error) {
    logger.error('Error creating API key:', error)
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    })
  }
}

/**
 * Get all API keys
 */
export const getAllApiKeys = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true'
    const apiKeys = await ApiKeyService.getAllApiKeys(includeInactive)

    // Return the API keys (with masked key values for security)
    const maskedApiKeys = apiKeys.map((key: any) => ({
      ...key,
      key: `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`
    }))

    res.status(200).json({
      status: 'success',
      data: maskedApiKeys
    })
  } catch (error) {
    logger.error('Error getting API keys:', error)
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    })
  }
}

/**
 * Get an API key by ID
 */
export const getApiKeyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const apiKey = await ApiKeyService.getApiKeyById(id)

    if (!apiKey) {
      res.status(404).json({
        status: 'error',
        message: 'API key not found'
      })
      return
    }

    // Return the API key (with masked key value for security)
    const maskedApiKey = {
      ...apiKey,
      key: `${apiKey.key.substring(0, 8)}...${apiKey.key.substring(apiKey.key.length - 4)}`
    }

    res.status(200).json({
      status: 'success',
      data: maskedApiKey
    })
  } catch (error) {
    logger.error(`Error getting API key with ID ${req.params.id || 'unknown'}:`, error)
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    })
  }
}

/**
 * Update an API key
 */
export const updateApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const { name, serviceName, permissions, description, active, expiresAt } = req.body

    // Check if API key exists
    const existingApiKey = await ApiKeyService.getApiKeyById(id)
    if (!existingApiKey) {
      res.status(404).json({
        status: 'error',
        message: 'API key not found'
      })
      return
    }

    // Update the API key
    const updatedApiKey = await ApiKeyService.updateApiKey(id, {
      name,
      serviceName,
      permissions,
      description,
      active,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    })

    // Return the updated API key (with masked key value)
    const maskedApiKey = {
      ...updatedApiKey,
      key: `${updatedApiKey.key.substring(0, 8)}...${updatedApiKey.key.substring(updatedApiKey.key.length - 4)}`
    }

    res.status(200).json({
      status: 'success',
      message: 'API key updated successfully',
      data: maskedApiKey
    })
  } catch (error) {
    logger.error(`Error updating API key with ID ${req.params.id || 'unknown'}:`, error)
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    })
  }
}

/**
 * Delete an API key
 */
export const deleteApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    // Check if API key exists
    const existingApiKey = await ApiKeyService.getApiKeyById(id)
    if (!existingApiKey) {
      res.status(404).json({
        status: 'error',
        message: 'API key not found'
      })
      return
    }

    // Delete the API key
    await ApiKeyService.deleteApiKey(id)

    res.status(200).json({
      status: 'success',
      message: 'API key deleted successfully'
    })
  } catch (error) {
    logger.error(`Error deleting API key with ID ${req.params.id || 'unknown'}:`, error)
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    })
  }
}

/**
 * Rotate an API key (generate a new key while preserving other properties)
 */
export const rotateApiKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    // Check if API key exists
    const existingApiKey = await ApiKeyService.getApiKeyById(id)
    if (!existingApiKey) {
      res.status(404).json({
        status: 'error',
        message: 'API key not found'
      })
      return
    }

    // Rotate the API key
    const rotatedApiKey = await ApiKeyService.rotateApiKey(id)

    res.status(200).json({
      status: 'success',
      message: 'API key rotated successfully',
      data: rotatedApiKey // Return the full key since this is a rotation
    })
  } catch (error) {
    logger.error(`Error rotating API key with ID ${req.params.id || 'unknown'}:`, error)
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    })
  }
}
