import { leaveHistoryResolvers } from '../leave-history.resolver'
import { GraphQLError } from 'graphql'
import { LeaveRequestStatus } from '@/generated/client'

// Mock the fs and path modules
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}))

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mock/path')
}))

// Mock PDF-lib
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn().mockReturnValue({
      embedFont: jest.fn().mockResolvedValue({}),
      addPage: jest.fn().mockReturnValue({
        getSize: jest.fn().mockReturnValue({ width: 612, height: 792 }),
        drawText: jest.fn()
      }),
      save: jest.fn().mockResolvedValue(Buffer.from('mock-pdf'))
    })
  },
  StandardFonts: {
    Helvetica: 'Helvetica',
    HelveticaBold: 'Helvetica-Bold'
  },
  rgb: jest.fn().mockReturnValue({})
}))

// Mock csv-writer
jest.mock('csv-writer', () => ({
  createObjectCsvStringifier: jest.fn().mockReturnValue({
    getHeaderString: jest.fn().mockReturnValue('header,'),
    stringifyRecords: jest.fn().mockReturnValue('data')
  })
}))

// Mock data
const mockLeaveRequests = [
  {
    id: 'leave-request-1',
    userId: 'user-1',
    user: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'employee'
    },
    leaveTypeId: 'leave-type-1',
    leaveType: {
      id: 'leave-type-1',
      name: 'Annual Leave',
      color: '#3498db'
    },
    startDate: new Date('2025-10-20'),
    endDate: new Date('2025-10-22'),
    halfDay: false,
    status: LeaveRequestStatus.hr_approved,
    reason: 'Vacation',
    manager: {
      id: 'manager-1',
      firstName: 'Jane',
      lastName: 'Smith'
    },
    managerComment: 'Approved',
    hr: {
      id: 'hr-1',
      firstName: 'Alex',
      lastName: 'Johnson'
    },
    hrComment: 'Approved by HR',
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-05')
  }
]

const mockAuditTrail = [
  {
    id: 'audit-1',
    leaveRequestId: 'leave-request-1',
    action: 'created',
    performedById: 'user-1',
    performedBy: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe'
    },
    timestamp: new Date('2025-10-01'),
    details: 'Leave request created',
    previousStatus: null,
    newStatus: LeaveRequestStatus.pending
  },
  {
    id: 'audit-2',
    leaveRequestId: 'leave-request-1',
    action: 'approved_by_manager',
    performedById: 'manager-1',
    performedBy: {
      id: 'manager-1',
      firstName: 'Jane',
      lastName: 'Smith'
    },
    timestamp: new Date('2025-10-02'),
    details: 'Approved by manager',
    previousStatus: LeaveRequestStatus.pending,
    newStatus: LeaveRequestStatus.manager_approved
  }
]

// Mock context with different user roles
const createMockContext = (user: any) => ({
  prisma: {
    leaveRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    },
    leaveAudit: {
      findMany: jest.fn()
    }
  },
  user
})

describe('Leave History Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Leave History Query', () => {
    it('should return paginated leave history', async () => {
      const mockContext = createMockContext({
        id: 'hr-1',
        role: 'hr'
      })
      
      mockContext.prisma.leaveRequest.count.mockResolvedValue(1)
      mockContext.prisma.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests)
      
      const result = await leaveHistoryResolvers.Query.leaveHistory(
        null,
        { page: 1, pageSize: 10 },
        mockContext
      )
      
      expect(result.items).toEqual(mockLeaveRequests)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
      expect(result.hasMore).toBe(false)
    })

    it('should filter by user ID for employees', async () => {
      const mockContext = createMockContext({
        id: 'user-1',
        role: 'employee'
      })
      
      mockContext.prisma.leaveRequest.count.mockResolvedValue(1)
      mockContext.prisma.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests)
      
      await leaveHistoryResolvers.Query.leaveHistory(
        null,
        {},
        mockContext
      )
      
      // Check that the employee's ID was used as a filter
      expect(mockContext.prisma.leaveRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1'
          })
        })
      )
    })

    it('should apply date filters correctly', async () => {
      const mockContext = createMockContext({
        id: 'hr-1',
        role: 'hr'
      })
      
      mockContext.prisma.leaveRequest.count.mockResolvedValue(1)
      mockContext.prisma.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests)
      
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-12-31')
      
      await leaveHistoryResolvers.Query.leaveHistory(
        null,
        { startDate, endDate },
        mockContext
      )
      
      // Check that date filters were applied correctly
      expect(mockContext.prisma.leaveRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                AND: expect.arrayContaining([
                  { startDate: { lte: endDate } },
                  { endDate: { gte: startDate } }
                ])
              })
            ])
          })
        })
      )
    })
  })

  describe('Export Leave History', () => {
    it('should export leave history to CSV', async () => {
      const mockContext = createMockContext({
        id: 'hr-1',
        role: 'hr'
      })
      
      mockContext.prisma.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests)
      
      const result = await leaveHistoryResolvers.Query.exportLeaveHistory(
        null,
        { format: 'csv' },
        mockContext
      )
      
      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('filename')
      expect(result).toHaveProperty('expiresAt')
      expect(result.url).toContain('/temp/')
    })

    it('should export leave history to PDF', async () => {
      const mockContext = createMockContext({
        id: 'hr-1',
        role: 'hr'
      })
      
      mockContext.prisma.leaveRequest.findMany.mockResolvedValue(mockLeaveRequests)
      
      const result = await leaveHistoryResolvers.Query.exportLeaveHistory(
        null,
        { format: 'pdf' },
        mockContext
      )
      
      expect(result).toHaveProperty('url')
      expect(result).toHaveProperty('filename')
      expect(result).toHaveProperty('expiresAt')
      expect(result.url).toContain('/temp/')
    })
  })

  describe('Leave Audit Trail', () => {
    it('should return the audit trail for a leave request', async () => {
      const mockContext = createMockContext({
        id: 'hr-1',
        role: 'hr'
      })
      
      mockContext.prisma.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequests[0])
      mockContext.prisma.leaveAudit.findMany.mockResolvedValue(mockAuditTrail)
      
      const result = await leaveHistoryResolvers.Query.leaveAuditTrail(
        null,
        { leaveRequestId: 'leave-request-1' },
        mockContext
      )
      
      expect(result).toEqual(mockAuditTrail)
    })

    it('should throw an error if the leave request does not exist', async () => {
      const mockContext = createMockContext({
        id: 'hr-1',
        role: 'hr'
      })
      
      mockContext.prisma.leaveRequest.findUnique.mockResolvedValue(null)
      
      await expect(
        leaveHistoryResolvers.Query.leaveAuditTrail(
          null,
          { leaveRequestId: 'non-existent' },
          mockContext
        )
      ).rejects.toThrow('Leave request not found')
    })

    it('should restrict employees from viewing other users\' audit trails', async () => {
      const mockContext = createMockContext({
        id: 'other-user',
        role: 'employee'
      })
      
      mockContext.prisma.leaveRequest.findUnique.mockResolvedValue(mockLeaveRequests[0])
      
      await expect(
        leaveHistoryResolvers.Query.leaveAuditTrail(
          null,
          { leaveRequestId: 'leave-request-1' },
          mockContext
        )
      ).rejects.toThrow('Not authorized to view this leave request audit trail')
    })
  })
})
