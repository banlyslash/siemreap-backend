import { Router } from 'express'
import healthRoutes from './health.routes'
import leaveRoutes from './leave.routes'
import apiKeyRoutes from './api-key.routes'
import schemaRoutes from './schema.routes'

const router = Router()

// Health check routes
router.use('/health', healthRoutes)

// Leave management routes
router.use('/leaves', leaveRoutes)

// API key management routes
router.use('/api-keys', apiKeyRoutes)

// GraphQL schema routes
router.use('/schema', schemaRoutes)

export default router
