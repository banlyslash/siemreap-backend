import { GraphQLContext } from '../context'
import { GraphQLError } from 'graphql'
import { requireAuth } from '@/utils/auth'
import { LeaveRequestStatus } from '@/generated/client'
import * as fs from 'fs'
import * as path from 'path'
import { createObjectCsvStringifier } from 'csv-writer'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Define enums to match GraphQL schema
export enum LeaveHistorySortField {
  startDate = 'startDate',
  endDate = 'endDate',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  status = 'status',
  leaveType = 'leaveType'
}

export enum SortDirection {
  asc = 'asc',
  desc = 'desc'
}

export enum ExportFormat {
  csv = 'csv',
  pdf = 'pdf'
}

export enum LeaveAuditAction {
  created = 'created',
  updated = 'updated',
  status_changed = 'status_changed',
  approved_by_manager = 'approved_by_manager',
  rejected_by_manager = 'rejected_by_manager',
  approved_by_hr = 'approved_by_hr',
  rejected_by_hr = 'rejected_by_hr',
  cancelled = 'cancelled'
}

export const leaveHistoryResolvers = {
  Query: {
    // Get leave history with pagination and filtering
    leaveHistory: async (
      _: any,
      args: {
        userId?: string
        leaveTypeId?: string
        status?: LeaveRequestStatus
        startDate?: Date
        endDate?: Date
        sortBy?: LeaveHistorySortField
        sortDirection?: SortDirection
        page?: number
        pageSize?: number
      },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Default pagination values
      const page = args.page || 1
      const pageSize = args.pageSize || 10
      const skip = (page - 1) * pageSize
      
      // Build filters
      const filters: any = {}
      
      if (args.userId) {
        filters.userId = args.userId
      } else if (user?.role === 'employee') {
        // Employees can only see their own leave history
        filters.userId = user.id
      }
      
      if (args.leaveTypeId) {
        filters.leaveTypeId = args.leaveTypeId
      }
      
      if (args.status) {
        filters.status = args.status
      }
      
      // Date range filter
      if (args.startDate || args.endDate) {
        if (args.startDate && args.endDate) {
          // Find requests that overlap with the given date range
          filters.OR = [
            {
              AND: [
                { startDate: { lte: new Date(args.endDate) } },
                { endDate: { gte: new Date(args.startDate) } }
              ]
            }
          ]
        } else if (args.startDate) {
          filters.startDate = { gte: new Date(args.startDate) }
        } else if (args.endDate) {
          filters.endDate = { lte: new Date(args.endDate) }
        }
      }
      
      // Build sort options
      const sortBy = args.sortBy || LeaveHistorySortField.createdAt
      const sortDirection = args.sortDirection || SortDirection.desc
      
      // Map sort field to Prisma sort field
      let orderBy: any = {}
      
      if (sortBy === LeaveHistorySortField.leaveType) {
        // Special case for sorting by leave type name
        orderBy = {
          leaveType: {
            name: sortDirection
          }
        }
      } else {
        orderBy[sortBy] = sortDirection
      }
      
      // Get total count for pagination
      const total = await prisma.leaveRequest.count({
        where: filters
      })
      
      // Get leave requests
      const items = await prisma.leaveRequest.findMany({
        where: filters,
        orderBy,
        skip,
        take: pageSize,
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })
      
      return {
        items,
        total,
        page,
        pageSize,
        hasMore: skip + items.length < total
      }
    },
    
    // Export leave history to CSV or PDF
    exportLeaveHistory: async (
      _: any,
      args: {
        userId?: string
        leaveTypeId?: string
        status?: LeaveRequestStatus
        startDate?: Date
        endDate?: Date
        format: ExportFormat
      },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      // Build filters
      const filters: any = {}
      
      if (args.userId) {
        filters.userId = args.userId
      } else if (user?.role === 'employee') {
        // Employees can only export their own leave history
        filters.userId = user.id
      }
      
      if (args.leaveTypeId) {
        filters.leaveTypeId = args.leaveTypeId
      }
      
      if (args.status) {
        filters.status = args.status
      }
      
      // Date range filter
      if (args.startDate || args.endDate) {
        if (args.startDate && args.endDate) {
          // Find requests that overlap with the given date range
          filters.OR = [
            {
              AND: [
                { startDate: { lte: new Date(args.endDate) } },
                { endDate: { gte: new Date(args.startDate) } }
              ]
            }
          ]
        } else if (args.startDate) {
          filters.startDate = { gte: new Date(args.startDate) }
        } else if (args.endDate) {
          filters.endDate = { lte: new Date(args.endDate) }
        }
      }
      
      // Get leave requests
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          leaveType: true,
          manager: true,
          hr: true
        }
      })
      
      // Format data for export
      const exportData = leaveRequests.map(request => ({
        id: request.id,
        employee: `${request.user.firstName} ${request.user.lastName}`,
        leaveType: request.leaveType.name,
        startDate: request.startDate.toISOString().split('T')[0],
        endDate: request.endDate.toISOString().split('T')[0],
        halfDay: request.halfDay ? 'Yes' : 'No',
        status: request.status,
        reason: request.reason || '',
        manager: request.manager ? `${request.manager.firstName} ${request.manager.lastName}` : '',
        managerComment: request.managerComment || '',
        hr: request.hr ? `${request.hr.firstName} ${request.hr.lastName}` : '',
        hrComment: request.hrComment || '',
        createdAt: request.createdAt.toISOString().split('T')[0]
      }))
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `leave-history-${timestamp}.${args.format}`
      const filePath = path.join(__dirname, '../../../../temp', filename)
      
      // Ensure temp directory exists
      if (!fs.existsSync(path.join(__dirname, '../../../../temp'))) {
        fs.mkdirSync(path.join(__dirname, '../../../../temp'), { recursive: true })
      }
      
      // Generate export file
      if (args.format === ExportFormat.csv) {
        // Generate CSV
        const csvStringifier = createObjectCsvStringifier({
          header: [
            { id: 'id', title: 'ID' },
            { id: 'employee', title: 'Employee' },
            { id: 'leaveType', title: 'Leave Type' },
            { id: 'startDate', title: 'Start Date' },
            { id: 'endDate', title: 'End Date' },
            { id: 'halfDay', title: 'Half Day' },
            { id: 'status', title: 'Status' },
            { id: 'reason', title: 'Reason' },
            { id: 'manager', title: 'Manager' },
            { id: 'managerComment', title: 'Manager Comment' },
            { id: 'hr', title: 'HR' },
            { id: 'hrComment', title: 'HR Comment' },
            { id: 'createdAt', title: 'Created At' }
          ]
        })
        
        const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(exportData)
        fs.writeFileSync(filePath, csvContent)
      } else {
        // Generate PDF
        const pdfDoc = await PDFDocument.create()
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        
        // Add title page
        const titlePage = pdfDoc.addPage()
        const { height } = titlePage.getSize()
        
        titlePage.drawText('Leave History Report', {
          x: 50,
          y: height - 100,
          size: 24,
          font: boldFont,
          color: rgb(0, 0, 0)
        })
        
        titlePage.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
          x: 50,
          y: height - 150,
          size: 12,
          font: font,
          color: rgb(0, 0, 0)
        })
        
        // Add data pages
        const itemsPerPage = 10
        for (let i = 0; i < exportData.length; i += itemsPerPage) {
          const page = pdfDoc.addPage()
          const pageItems = exportData.slice(i, i + itemsPerPage)
          
          // Add header
          page.drawText('Leave History', {
            x: 50,
            y: height - 50,
            size: 16,
            font: boldFont,
            color: rgb(0, 0, 0)
          })
          
          // Add table header
          page.drawText('Employee', { x: 50, y: height - 100, size: 10, font: boldFont })
          page.drawText('Leave Type', { x: 150, y: height - 100, size: 10, font: boldFont })
          page.drawText('Start Date', { x: 250, y: height - 100, size: 10, font: boldFont })
          page.drawText('End Date', { x: 350, y: height - 100, size: 10, font: boldFont })
          page.drawText('Status', { x: 450, y: height - 100, size: 10, font: boldFont })
          
          // Add table rows
          pageItems.forEach((item, index) => {
            const y = height - 120 - (index * 20)
            page.drawText(item.employee || '', { x: 50, y, size: 10, font })
            page.drawText(item.leaveType || '', { x: 150, y, size: 10, font })
            page.drawText(item.startDate || '', { x: 250, y, size: 10, font })
            page.drawText(item.endDate || '', { x: 350, y, size: 10, font })
            page.drawText(item.status || '', { x: 450, y, size: 10, font })
          })
        }
        
        const pdfBytes = await pdfDoc.save()
        fs.writeFileSync(filePath, pdfBytes)
      }
      
      // In a real application, we would upload this file to a cloud storage
      // and return a signed URL. For now, we'll just return a local file path.
      const url = `/temp/${filename}`
      
      return {
        url,
        filename,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
      }
    },
    
    // Get leave audit trail for a specific leave request
    leaveAuditTrail: async (
      _: any,
      args: { leaveRequestId: string },
      context: GraphQLContext
    ) => {
      const { prisma, user } = context
      requireAuth(user)
      
      const { leaveRequestId } = args
      
      // Find the leave request
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: leaveRequestId }
      })
      
      if (!leaveRequest) {
        throw new GraphQLError('Leave request not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }
      
      // Check permissions
      if (
        user?.role === 'employee' &&
        leaveRequest.userId !== user.id
      ) {
        throw new GraphQLError('Not authorized to view this leave request audit trail', {
          extensions: { code: 'FORBIDDEN' }
        })
      }
      
      // Get audit trail
      const auditTrail = await prisma.leaveAudit.findMany({
        where: { leaveRequestId },
        orderBy: { timestamp: 'desc' },
        include: {
          performedBy: true
        }
      })
      
      return auditTrail
    }
  }
}

// Helper function to create audit entries
export const createLeaveAudit = async (
  prisma: any,
  leaveRequestId: string,
  action: LeaveAuditAction,
  performedById: string,
  details?: string,
  previousStatus?: LeaveRequestStatus,
  newStatus?: LeaveRequestStatus
) => {
  return prisma.leaveAudit.create({
    data: {
      leaveRequestId,
      action,
      performedById,
      details,
      previousStatus,
      newStatus,
      timestamp: new Date()
    }
  })
}
