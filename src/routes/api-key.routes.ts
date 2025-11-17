import { Router } from 'express'
import { 
  createApiKey, 
  getAllApiKeys, 
  getApiKeyById, 
  updateApiKey, 
  deleteApiKey, 
  rotateApiKey 
} from '@/controllers/api-key.controller'
import { requireAuth } from '@/utils/auth'

const router = Router()

// All API key management routes require authentication
// Only admin/HR users should be able to manage API keys
router.use(requireAuth)

// Create a new API key
router.post('/', createApiKey)

// Get all API keys
router.get('/', getAllApiKeys)

// Get an API key by ID
router.get('/:id', getApiKeyById)

// Update an API key
router.put('/:id', updateApiKey)

// Delete an API key
router.delete('/:id', deleteApiKey)

// Rotate an API key (generate a new key)
router.post('/:id/rotate', rotateApiKey)

export default router
