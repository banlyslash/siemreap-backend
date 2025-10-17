import { leaveRequestResolvers } from '../leave-request.resolver'
import { GraphQLError } from 'graphql'
import { LeaveRequestStatus } from '@/generated/client'

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'user@example.com',
  password: 'hashed-password',
  firstName: 'John',
  lastName: 'Doe',
  role: 'employee',
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

const mockLeaveBalance = {
  id: 'leave-balance-1',
  userId: 'user-1',
  leaveTypeId: 'leave-type-1',
  year: 2025,
  allocated: 20,
  used: 5,
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockLeaveRequest = {
  id: 'leave-request-1',
  userId: 'user-1',
  leaveTypeId: 'leave-type-1',
  startDate: new Date('2025-10-20'),
  endDate: new Date('2025-10-22'),
  halfDay: false,
  reason: 'Vacation',
  status: LeaveRequestStatus.pending,
  createdAt: new Date(),
  updatedAt: new Date()
}

// Mock context
const mockContext = {
  prisma: {
    leaveRequest: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    leaveType: {
      findUnique: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    },
    leaveBalance: {
      findFirst: jest.fn(),
      updateMany: jest.fn()
    }
  },
  user: mockUser
}

describe('Leave Request Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Query', () => {
    describe('leaveRequests', () => {
      it('should return leave requests for an employee (only their own)', async () => {
        mockContext.prisma.leaveRequest.findMany.mockResolvedValue([mockLeaveRequest])
        
        const result = await leaveRequestResolvers.Query.leaveRequests(
          null,
          {},
          { ...mockContext, user: { ...mockUser, role: 'employee' } }
        )
        
        expect(mockContext.prisma.leaveRequest.findMany).toHaveBeenCalledWith({
          where: { userId: 'user-1' },
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

      it('should return leave requests with filters', async () => {
        mockContext.prisma.leaveRequest.findMany.mockResolvedValue([mockLeaveRequest])
        
        const args = {
          status: LeaveRequestStatus.pending,
          startDate: new Date('2025-10-01'),
          endDate: new Date('2025-10-31')
        }
        
        await leaveRequestResolvers.Query.leaveRequests(
          null,
          args,
          { ...mockContext, user: { ...mockUser, role: 'hr' } }
        )
        
        expect(mockContext.prisma.leaveRequest.findMany).toHaveBeenCalledWith({
          where: {
            status: LeaveRequestStatus.pending,
            OR: [{
              AND: [
                { startDate: { lte: expect.any(Date) } },
                { endDate: { gte: expect.any(Date) } }
              ]
            }]
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
    })

    describe('leaveRequest', () => {
      it('should return a single leave request by ID', async () => {
        mockContext.prisma.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequest)
        
        const result = await leaveRequestResolvers.Query.leaveRequest(
          null,
          { id: 'leave-request-1' },
          mockContext
        )
        
        expect(mockContext.prisma.leaveRequest.findUnique).toHaveBeenCalledWith({
          where: { id: 'leave-request-1' },
          include: {
            user: true,
            leaveType: true,
            manager: true,
            hr: true
          }
        })
        expect(result).toEqual(mockLeaveRequest)
      })

      it('should throw an error if leave request not found', async () => {
        mockContext.prisma.leaveRequest.findUnique.mockResolvedValue(null)
        
        await expect(
          leaveRequestResolvers.Query.leaveRequest(
            null,
            { id: 'non-existent-id' },
            mockContext
          )
        ).rejects.toThrow(GraphQLError)
      })
    })
  })

  describe('Mutation', () => {
    describe('createLeaveRequest', () => {
      it('should create a new leave request', async () => {
        mockContext.prisma.leaveType.findUnique.mockResolvedValue(mockLeaveType)
        mockContext.prisma.user.findUnique.mockResolvedValue(mockUser)
        mockContext.prisma.leaveBalance.findFirst.mockResolvedValue(mockLeaveBalance)
        mockContext.prisma.leaveRequest.create.mockResolvedValue(mockLeaveRequest)
        
        const input = {
          userId: 'user-1',
          leaveTypeId: 'leave-type-1',
          startDate: new Date('2025-10-20'),
          endDate: new Date('2025-10-22'),
          halfDay: false,
          reason: 'Vacation'
        }
        
        const result = await leaveRequestResolvers.Mutation.createLeaveRequest(
          null,
          { input },
          mockContext
        )
        
        expect(mockContext.prisma.leaveRequest.create).toHaveBeenCalledWith({
          data: {
            userId: 'user-1',
            leaveTypeId: 'leave-type-1',
            startDate: expect.any(Date),
            endDate: expect.any(Date),
            halfDay: false,
            reason: 'Vacation',
            status: LeaveRequestStatus.pending
          },
          include: {
            user: true,
            leaveType: true
          }
        })
        expect(result).toEqual(mockLeaveRequest)
      })

      it('should throw an error if start date is after end date', async () => {
        const input = {
          userId: 'user-1',
          leaveTypeId: 'leave-type-1',
          startDate: new Date('2025-10-25'),
          endDate: new Date('2025-10-20'),
          reason: 'Vacation'
        }
        
        await expect(
          leaveRequestResolvers.Mutation.createLeaveRequest(
            null,
            { input },
            mockContext
          )
        ).rejects.toThrow('Start date must be before end date')
      })
    })

    describe('approveLeaveRequest', () => {
      it('should allow a manager to approve a pending leave request', async () => {
        const managerUser = { ...mockUser, id: 'manager-1', role: 'manager' }
        const pendingLeaveRequest = { ...mockLeaveRequest, status: LeaveRequestStatus.pending }
        
        mockContext.prisma.leaveRequest.findUnique.mockResolvedValue(pendingLeaveRequest)
        mockContext.prisma.leaveRequest.update.mockResolvedValue({
          ...pendingLeaveRequest,
          status: LeaveRequestStatus.manager_approved,
          managerId: 'manager-1'
        })
        
        const result = await leaveRequestResolvers.Mutation.approveLeaveRequest(
          null,
          { id: 'leave-request-1', comment: 'Approved' },
          { ...mockContext, user: managerUser }
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
    })
  })
})
