import { leaveRequestResolvers } from '../leave-request.resolver'
import { LeaveRequestStatus } from '@/generated/client'
import { describe, it, expect, jest } from '@jest/globals'

describe('HR Pending Approvals', () => {
  it('should return pending leave requests for HR users', async () => {
    // Mock data
    const mockPendingRequests = [
      { id: '1', status: LeaveRequestStatus.pending },
      { id: '2', status: LeaveRequestStatus.pending }
    ]
    
    // Mock context
    const mockContext = {
      prisma: {
        leaveRequest: {
          findMany: jest.fn().mockResolvedValue(mockPendingRequests)
        }
      },
      user: {
        id: 'hr-user-id',
        role: 'hr'
      }
    }
    
    // Call the resolver
    const result = await leaveRequestResolvers.Query.hrPendingApprovals(null, {}, mockContext as any)
    
    // Assertions
    expect(result).toEqual(mockPendingRequests)
    expect(mockContext.prisma.leaveRequest.findMany).toHaveBeenCalledWith({
      where: {
        status: LeaveRequestStatus.pending
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        leaveType: true,
        manager: true,
        hr: true
      }
    })
  })
  
  it('should throw error if user is not HR', async () => {
    // Mock context with non-HR user
    const mockContext = {
      prisma: {
        leaveRequest: {
          findMany: jest.fn()
        }
      },
      user: {
        id: 'employee-user-id',
        role: 'employee'
      }
    }
    
    // Call the resolver and expect it to throw
    await expect(
      leaveRequestResolvers.Query.hrPendingApprovals(null, {}, mockContext as any)
    ).rejects.toThrow('Not authorized to view pending approvals')
    
    // Ensure findMany was not called
    expect(mockContext.prisma.leaveRequest.findMany).not.toHaveBeenCalled()
  })
})
