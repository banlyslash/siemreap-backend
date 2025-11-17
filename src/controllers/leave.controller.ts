import { Request, Response } from 'express'
import { LeaveRequestStatus } from '@/generated/client'
import { NotificationService } from '@/services/notification.service'
import { verifyToken } from '@/utils/auth'
import prisma from '@/lib/prisma'

/**
 * Create multiple leave requests in a single API call
 */
export const createLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get the user token from the headers
    const token = req.headers.authorization?.replace('Bearer ', '') || ''
    
    // Try to retrieve a user with the token
    const user = token ? await verifyToken(token, prisma) : null
    
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized: You must be logged in to create leave requests'
      })
      return
    }

    // Get request body
    const { leaves, number_of_days } = req.body

    // Validate request body
    if (!leaves || !Array.isArray(leaves) || leaves.length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid request: leaves array is required'
      })
      return
    }

    // Verify number_of_days matches the actual number of days in the leaves array
    if (number_of_days !== leaves.length) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid request: number_of_days does not match the number of leave entries'
      })
      return
    }

    // Get the current year for leave balance check
    const currentYear = new Date().getFullYear()
    
    // Find the default leave type (assuming there's a "Annual Leave" type)
    // In a real application, you might want to make this configurable
    const leaveType = await prisma.leaveType.findFirst({
      where: { 
        active: true,
        name: { contains: 'Annual', mode: 'insensitive' }
      }
    })

    if (!leaveType) {
      res.status(500).json({
        status: 'error',
        message: 'No active leave type found'
      })
      return
    }

    // Check leave balance
    const leaveBalance = await prisma.leaveBalance.findFirst({
      where: {
        userId: user.id,
        leaveTypeId: leaveType.id,
        year: currentYear
      }
    })

    if (!leaveBalance) {
      res.status(400).json({
        status: 'error',
        message: 'No leave balance found for this leave type'
      })
      return
    }

    const remainingBalance = leaveBalance.allocated - leaveBalance.used
    
    if (number_of_days > remainingBalance) {
      res.status(400).json({
        status: 'error',
        message: `Insufficient leave balance. Available: ${remainingBalance}, Requested: ${number_of_days}`
      })
      return
    }

    // Create leave requests for each date
    const createdLeaves = await Promise.all(
      leaves.map(async (leave: { leave_on: string; is_half_day: boolean }) => {
        const leaveDate = new Date(leave.leave_on)
        
        // Validate the date
        if (isNaN(leaveDate.getTime())) {
          throw new Error(`Invalid date format: ${leave.leave_on}`)
        }
        
        // Create the leave request
        return prisma.leaveRequest.create({
          data: {
            userId: user.id,
            leaveTypeId: leaveType.id,
            startDate: leaveDate,
            endDate: leaveDate, // Same day for single-day leave
            halfDay: leave.is_half_day,
            status: LeaveRequestStatus.pending
          },
          include: {
            user: true,
            leaveType: true
          }
        })
      })
    )

    // Send notification for each created leave request
    for (const leaveRequest of createdLeaves) {
      await NotificationService.sendLeaveRequestSubmittedNotification(
        leaveRequest,
        leaveRequest.user
      )
    }

    res.status(201).json({
      status: 'success',
      message: `Successfully created ${createdLeaves.length} leave requests`,
      data: createdLeaves
    })
  } catch (error) {
    console.error('Error creating leaves:', error)
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    })
  }
}
