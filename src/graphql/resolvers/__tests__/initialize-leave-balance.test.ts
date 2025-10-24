import { leaveBalanceResolvers } from '../leave-balance.resolver'
import { GraphQLContext } from '@/graphql/context'
import { GraphQLError } from 'graphql'

// Mock data
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

const mockLeaveTypes = [
  {
    id: 'leave-type-1',
    name: 'Annual Leave',
    description: 'Regular annual leave',
    color: '#3498db',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'leave-type-2',
    name: 'Sick Leave',
    description: 'Medical leave',
    color: '#e74c3c',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Mock context with different user roles
const createMockContext = (user: any) => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    leaveType: {
      findMany: jest.fn()
    },
    leaveBalance: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  },
  user,
  req: {} as any,
  res: {} as any
}) as unknown as GraphQLContext

describe('Initialize Leave Balance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize leave balances for an employee when called by HR', async () => {
    const mockContext = createMockContext(mockHR)
    
    // Mock prisma responses
    mockContext.prisma.user.findUnique.mockResolvedValue(mockEmployee)
    mockContext.prisma.leaveType.findMany.mockResolvedValue(mockLeaveTypes)
    mockContext.prisma.leaveBalance.findMany.mockResolvedValue([])
    
    // Mock create function to return a balance with the input data
    mockContext.prisma.leaveBalance.create.mockImplementation((args: any) => {
      return Promise.resolve({
        id: `balance-${args.data.leaveTypeId}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockEmployee,
        leaveType: mockLeaveTypes.find(lt => lt.id === args.data.leaveTypeId)
      })
    })
    
    const input = {
      userId: 'employee-1',
      defaultAllocation: 20
    }
    
    const result = await leaveBalanceResolvers.Mutation.initializeLeaveBalance(
      null,
      { input },
      mockContext
    )
    
    expect(result.success).toBe(true)
    expect(result.balances).toHaveLength(2)
    expect(mockContext.prisma.leaveBalance.create).toHaveBeenCalledTimes(2)
    expect(result.balances[0].allocated).toBe(20)
    expect(result.balances[1].allocated).toBe(20)
  })

  it('should update existing leave balances if they already exist', async () => {
    const mockContext = createMockContext(mockHR)
    
    const existingBalances = [
      {
        id: 'balance-1',
        userId: 'employee-1',
        leaveTypeId: 'leave-type-1',
        year: 2025,
        allocated: 10,
        used: 5,
        pending: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // Mock prisma responses
    mockContext.prisma.user.findUnique.mockResolvedValue(mockEmployee)
    mockContext.prisma.leaveType.findMany.mockResolvedValue(mockLeaveTypes)
    mockContext.prisma.leaveBalance.findMany.mockResolvedValue(existingBalances)
    
    // Mock update function
    mockContext.prisma.leaveBalance.update.mockImplementation((args: any) => {
      return Promise.resolve({
        ...existingBalances.find(b => b.id === args.where.id),
        ...args.data,
        updatedAt: new Date(),
        user: mockEmployee,
        leaveType: mockLeaveTypes.find(lt => lt.id === 'leave-type-1')
      })
    })
    
    // Mock create function for the second leave type
    mockContext.prisma.leaveBalance.create.mockImplementation((args: any) => {
      return Promise.resolve({
        id: `balance-${args.data.leaveTypeId}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockEmployee,
        leaveType: mockLeaveTypes.find(lt => lt.id === args.data.leaveTypeId)
      })
    })
    
    const input = {
      userId: 'employee-1',
      defaultAllocation: 25
    }
    
    const result = await leaveBalanceResolvers.Mutation.initializeLeaveBalance(
      null,
      { input },
      mockContext
    )
    
    expect(result.success).toBe(true)
    expect(result.balances).toHaveLength(2)
    expect(mockContext.prisma.leaveBalance.update).toHaveBeenCalledTimes(1)
    expect(mockContext.prisma.leaveBalance.create).toHaveBeenCalledTimes(1)
    expect(result.balances[0].allocated).toBe(25) // Updated from 10 to 25
  })

  it('should not allow employees to initialize leave balances', async () => {
    const mockContext = createMockContext(mockEmployee)
    
    const input = {
      userId: 'employee-1',
      defaultAllocation: 20
    }
    
    await expect(
      leaveBalanceResolvers.Mutation.initializeLeaveBalance(
        null,
        { input },
        mockContext
      )
    ).rejects.toThrow('Not authorized to initialize leave balances')
    
    expect(mockContext.prisma.user.findUnique).not.toHaveBeenCalled()
    expect(mockContext.prisma.leaveType.findMany).not.toHaveBeenCalled()
    expect(mockContext.prisma.leaveBalance.findMany).not.toHaveBeenCalled()
  })

  it('should return an error if employee does not exist', async () => {
    const mockContext = createMockContext(mockHR)
    
    // Mock prisma responses
    mockContext.prisma.user.findUnique.mockResolvedValue(null)
    
    const input = {
      userId: 'non-existent-employee',
      defaultAllocation: 20
    }
    
    await expect(
      leaveBalanceResolvers.Mutation.initializeLeaveBalance(
        null,
        { input },
        mockContext
      )
    ).rejects.toThrow('Employee not found')
    
    expect(mockContext.prisma.leaveType.findMany).not.toHaveBeenCalled()
    expect(mockContext.prisma.leaveBalance.findMany).not.toHaveBeenCalled()
  })

  it('should return success=false if no active leave types exist', async () => {
    const mockContext = createMockContext(mockHR)
    
    // Mock prisma responses
    mockContext.prisma.user.findUnique.mockResolvedValue(mockEmployee)
    mockContext.prisma.leaveType.findMany.mockResolvedValue([])
    
    const input = {
      userId: 'employee-1',
      defaultAllocation: 20
    }
    
    const result = await leaveBalanceResolvers.Mutation.initializeLeaveBalance(
      null,
      { input },
      mockContext
    )
    
    expect(result.success).toBe(false)
    expect(result.message).toBe('No active leave types found')
    expect(result.balances).toEqual([])
    expect(mockContext.prisma.leaveBalance.findMany).not.toHaveBeenCalled()
  })
})
