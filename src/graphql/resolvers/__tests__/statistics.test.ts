import { statisticsResolvers } from '../statistics.resolver'
import { LeaveRequestStatus } from '@/generated/client'
import { GraphQLContext } from '@/graphql/context'
import { GraphQLError } from 'graphql'

// Mock data
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

const mockLeaveType1 = {
  id: 'leave-type-1',
  name: 'Annual Leave',
  description: 'Regular annual leave',
  color: '#3498db',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockLeaveType2 = {
  id: 'leave-type-2',
  name: 'Sick Leave',
  description: 'Medical leave',
  color: '#e74c3c',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

// Mock context with different user roles
const createMockContext = (user: any) => ({
  prisma: {
    leaveRequest: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    user: {
      count: jest.fn()
    },
    leaveType: {
      findMany: jest.fn()
    }
  },
  user,
  req: {} as any,
  res: {} as any
}) as unknown as GraphQLContext

describe('Leave Statistics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return leave statistics for managers', async () => {
    const mockContext = createMockContext(mockManager)
    
    // Mock prisma responses
    mockContext.prisma.leaveRequest.count
      .mockImplementation((args: any) => {
        if (args.where.status === LeaveRequestStatus.pending) {
          return Promise.resolve(5) // 5 pending approvals
        } else if (args.where.status === LeaveRequestStatus.hr_approved) {
          return Promise.resolve(3) // 3 on leave today
        } else if (args.where.leaveTypeId === 'leave-type-1') {
          return Promise.resolve(10) // 10 annual leave requests
        } else if (args.where.leaveTypeId === 'leave-type-2') {
          return Promise.resolve(5) // 5 sick leave requests
        }
        return Promise.resolve(0)
      })
    
    mockContext.prisma.user.count.mockResolvedValue(20) // 20 employees
    
    mockContext.prisma.leaveType.findMany.mockResolvedValue([
      mockLeaveType1,
      mockLeaveType2
    ])
    
    const result = await statisticsResolvers.Query.leaveStatistics(
      null,
      {},
      mockContext
    )
    
    expect(result).toEqual({
      pendingApprovals: 5,
      totalEmployees: 20,
      onLeaveToday: 3,
      leaveReports: [
        {
          leaveType: mockLeaveType1,
          count: 10,
          percentage: (10 / 15) * 100 // 66.67%
        },
        {
          leaveType: mockLeaveType2,
          count: 5,
          percentage: (5 / 15) * 100 // 33.33%
        }
      ]
    })
  })

  it('should return leave statistics for HR', async () => {
    const mockContext = createMockContext(mockHR)
    
    // Mock prisma responses
    mockContext.prisma.leaveRequest.count
      .mockImplementation((args: any) => {
        if (args.where.status === LeaveRequestStatus.pending) {
          return Promise.resolve(5) // 5 pending approvals
        } else if (args.where.status === LeaveRequestStatus.hr_approved) {
          return Promise.resolve(3) // 3 on leave today
        } else if (args.where.leaveTypeId === 'leave-type-1') {
          return Promise.resolve(10) // 10 annual leave requests
        } else if (args.where.leaveTypeId === 'leave-type-2') {
          return Promise.resolve(5) // 5 sick leave requests
        }
        return Promise.resolve(0)
      })
    
    mockContext.prisma.user.count.mockResolvedValue(20) // 20 employees
    
    mockContext.prisma.leaveType.findMany.mockResolvedValue([
      mockLeaveType1,
      mockLeaveType2
    ])
    
    const result = await statisticsResolvers.Query.leaveStatistics(
      null,
      {},
      mockContext
    )
    
    expect(result).toEqual({
      pendingApprovals: 5,
      totalEmployees: 20,
      onLeaveToday: 3,
      leaveReports: [
        {
          leaveType: mockLeaveType1,
          count: 10,
          percentage: (10 / 15) * 100 // 66.67%
        },
        {
          leaveType: mockLeaveType2,
          count: 5,
          percentage: (5 / 15) * 100 // 33.33%
        }
      ]
    })
  })

  it('should not allow employees to view leave statistics', async () => {
    const mockContext = createMockContext(mockEmployee)
    
    await expect(
      statisticsResolvers.Query.leaveStatistics(
        null,
        {},
        mockContext
      )
    ).rejects.toThrow('Not authorized to view leave statistics')
    
    expect(mockContext.prisma.leaveRequest.count).not.toHaveBeenCalled()
    expect(mockContext.prisma.user.count).not.toHaveBeenCalled()
    expect(mockContext.prisma.leaveType.findMany).not.toHaveBeenCalled()
  })
})
