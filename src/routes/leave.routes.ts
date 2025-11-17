import { Router } from 'express'
import { createLeaves } from '../controllers/leave.controller'

const router = Router()

// POST endpoint to create multiple leave requests
router.post('/', createLeaves)

export default router
