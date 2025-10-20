import { leaveRequestResolvers } from '../leave-request.resolver'
import { GraphQLError } from 'graphql'
import { LeaveRequestStatus } from '@/generated/client'

// Mock the notification service
jest.mock('@/services/notification.service', () => ({
  NotificationService: {
    sendLeaveRequestSubmittedNotification: jest.fn(),
    sendManagerApprovalNotification: jest.fn(),
    sendManagerRejectionNotification: jest.fn(),
    sendHRApprovalNotification: jest.fn(),
    sendHRRejectionNotification: jest.fn(),
    sendCancellationNotification: jest.fn()
  }
}))

// Mock data
const mockEmployee = {
  id: 'employee-1',
  email: 'employee@example.com',
  password: 'hashed-password',
  firstName: 'John',
  lastName: 'Doe',
  role: 'employee',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockManager = {
  id: 'manager-1',
  email: 'manager@example.com',
  password: 'hashed-password',
  firstName: 'Jane',
  lastName: 'Smith',
  role: 'manager',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockHR = {
  id: 'hr-1',
  email: 'hr@example.com',
  password: 'hashed-password',
  firstName: 'Alex',
  lastName: 'Johnson',
  role: 'hr',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockLeaveType = {
  id: 'leave-type-1',
  name: 'Annual Leave',
  description: 'Regular annual leave',
  color: '#3498db',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockLeaveRequest = {
  id: 'leave-request-1',
  userId: 'employee-1',
  leaveTypeId: 'leave-type-1',
  startDate: new Date('2025-10-20'),
  endDate: new Date('2025-10-22'),
  halfDay: false,
  reason: 'Vacation',
  status: LeaveRequestStatus.pending,
  createdAt: new Date(),
  updatedAt: new Date()
}

// Mock context with different user roles
const createMockContext = (user: any) => ({
  prisma: {
    leaveRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    leaveBalance: {
      updateMany: jest.fn()
    }
  },
  user
})

describe('Leave Approval Process', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Manager Approval', () => {
    it('should allow a manager to approve a pending leave request', async () => {
      const mockContext = createMockContext(mockManager)
      mockContext.prisma.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest)
      mockContext.prisma.leaveRequest.update.mockResolvedValue({
        ...mockLeaveRequest,
        status: LeaveRequestStatus.manager_approved,
        managerId: 'manager-1',
        managerComment: 'Approved',
        managerActionAt: expect.any(Date),
        user: mockEmployee,
        manager: mockManager
      })
      
      const result = await leaveRequestResolvers.Mutation.approveLeaveRequest(
        null,
        { id: 'leave-request-1', comment: 'Approved' },
        mockContext
      )
      
      expect(mockContext.prisma.leaveRequest.update).toHaveBeenCalledWith({
        where: { id: 'leave-request-1' },
        data: {
          status: LeaveRequestStatus.manager_approved,
          managerId: 'manager-1',
          managerComment: 'Approved',
          managerActionAt: expect.any(Date)
        },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })
      expect(result.status).toEqual(LeaveRequestStatus.manager_approved)
    })

    it('should not allow a manager to approve a non-pending leave request', async () => {
      const mockContext = createMockContext(mockManager)
      mockContext.prisma.leaveRequest.findUnique.mockResolvedValue({
        ...mockLeaveRequest,
        status: LeaveRequestStatus.manager_approved
      })
      
      await expect(
        leaveRequestResolvers.Mutation.approveLeaveRequest(
          null,
          { id: 'leave-request-1', comment: 'Approved' },
          mockContext
        )
      ).rejects.toThrow('Can only approve pending leave requests')
    })
  })

  describe('HR Approval', () => {
    it('should allow HR to approve a manager-approved leave request', async () => {
      const mockContext = createMockContext(mockHR)
      mockContext.prisma.leaveRequest.findUnique.mockResolvedValue({
        ...mockLeaveRequest,
        status: LeaveRequestStatus.manager_approved,
        managerId: 'manager-1'
      })
      mockContext.prisma.leaveRequest.update.mockResolvedValue({
        ...mockLeaveRequest,
        status: LeaveRequestStatus.hr_approved,
        managerId: 'manager-1',
        hrId: 'hr-1',
        hrComment: 'Approved by HR',
        hrActionAt: expect.any(Date),
        user: mockEmployee,
        manager: mockManager,
        hr: mockHR
      })
      
      const result = await leaveRequestResolvers.Mutation.approveLeaveRequest(
        null,
        { id: 'leave-request-1', comment: 'Approved by HR' },
        mockContext
      )
      
      expect(mockContext.prisma.leaveBalance.updateMany).toHaveBeenCalled()
      expect(result.status).toEqual(LeaveRequestStatus.hr_approved)
    })

    it('should not allow HR to approve a leave request that is not manager-approved', async () => {
      const mockContext = createMockContext(mockHR)
      mockContext.prisma.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest)
      
      await expect(
        leaveRequestResolvers.Mutation.approveLeaveRequest(
          null,
          { id: 'leave-request-1', comment: 'Approved by HR' },
          mockContext
        )
      ).rejects.toThrow('Can only approve manager-approved leave requests')
    })
  })

  describe('Rejection Process', () => {
    it('should allow a manager to reject a pending leave request', async () => {
      const mockContext = createMockContext(mockManager)
      mockContext.prisma.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest)
      mockContext.prisma.leaveRequest.update.mockResolvedValue({
        ...mockLeaveRequest,
        status: LeaveRequestStatus.manager_rejected,
        managerId: 'manager-1',
        managerComment: 'Rejected due to team coverage',
        managerActionAt: expect.any(Date),
        user: mockEmployee,
        manager: mockManager
      })
      
      const result = await leaveRequestResolvers.Mutation.rejectLeaveRequest(
        null,
        { id: 'leave-request-1', comment: 'Rejected due to team coverage' },
        mockContext
      )
      
      expect(result.status).toEqual(LeaveRequestStatus.manager_rejected)
    })

    it('should require a comment when rejecting a leave request', async () => {
      const mockContext = createMockContext(mockManager)
      
      await expect(
        leaveRequestResolvers.Mutation.rejectLeaveRequest(
          null,
          { id: 'leave-request-1', comment: '' },
          mockContext
        )
      ).rejects.toThrow('Comment is required when rejecting a leave request')
    })
  })

  describe('Approval Dashboard Queries', () => {
    it('should allow managers to view pending approvals', async () => {
      const mockContext = createMockContext(mockManager)
      mockContext.prisma.leaveRequest.findMany.mockResolvedValue([mockLeaveRequest])
      
      const result = await leaveRequestResolvers.Query.pendingApprovals(
        null,
        {},
        mockContext
      )
      
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
      expect(result).toEqual([mockLeaveRequest])
    })

    it('should allow HR to view manager-approved requests', async () => {
      const mockContext = createMockContext(mockHR)
      mockContext.prisma.leaveRequest.findMany.mockResolvedValue([{
        ...mockLeaveRequest,
        status: LeaveRequestStatus.manager_approved
      }])
      
      const result = await leaveRequestResolvers.Query.managerApprovedRequests(
        null,
        {},
        mockContext
      )
      
      expect(mockContext.prisma.leaveRequest.findMany).toHaveBeenCalledWith({
        where: {
          status: LeaveRequestStatus.manager_approved
        },
        orderBy: { managerActionAt: 'desc' },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })
      expect(result[0].status).toEqual(LeaveRequestStatus.manager_approved)
    })
  })
})
