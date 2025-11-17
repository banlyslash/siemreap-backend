# Leave History Feature Documentation

This document provides an overview of the Leave History feature implementation, which allows users to view, filter, and export their leave history.

## Features Implemented

### 1. Leave History Query with Advanced Filtering

The `leaveHistory` query provides a paginated list of leave requests with advanced filtering options:

- Filter by leave request status
- Filter by user ID
- Filter by leave type
- Filter by date range
- Sort by various fields (start date, end date, status, etc.)
- Pagination support

### 2. Leave History Export

The `exportLeaveHistory` query allows users to export their leave history in different formats:

- CSV export
- PDF export
- Customizable filters for the exported data

### 3. Leave Audit Trail

The `leaveAuditTrail` query provides a detailed audit trail for each leave request, showing:

- Who created the request
- All status changes
- Approvals and rejections
- Comments and timestamps

## GraphQL Schema

```graphql
# Leave history queries
leaveHistory(
  userId: ID
  leaveTypeId: ID
  status: LeaveRequestStatus
  startDate: DateTime
  endDate: DateTime
  sortBy: LeaveHistorySortField
  sortDirection: SortDirection
  page: Int
  pageSize: Int
): LeaveHistoryResult!

# Export leave history
exportLeaveHistory(
  userId: ID
  leaveTypeId: ID
  status: LeaveRequestStatus
  startDate: DateTime
  endDate: DateTime
  format: ExportFormat!
): ExportResult!

# Leave audit trail
leaveAuditTrail(leaveRequestId: ID!): [LeaveAuditEntry!]!
```

## Data Models

### Leave Audit Trail

The Leave Audit Trail is stored in the `LeaveAudit` model in the database:

```prisma
model LeaveAudit {
  id               String            @id @default(uuid())
  leaveRequestId   String            @map("leave_request_id")
  leaveRequest     LeaveRequest      @relation("LeaveRequestAudits", fields: [leaveRequestId], references: [id])
  action           String
  performedById    String            @map("performed_by_id")
  performedBy      User              @relation("UserLeaveAudits", fields: [performedById], references: [id])
  timestamp        DateTime          @default(now())
  details          String?
  previousStatus   LeaveRequestStatus?
  newStatus        LeaveRequestStatus?
  createdAt        DateTime          @default(now()) @map("created_at")

  @@map("leave_audits")
  @@index([leaveRequestId])
  @@index([performedById])
  @@index([timestamp])
}
```

## Audit Trail Actions

The following actions are tracked in the audit trail:

- `created`: Leave request created
- `updated`: Leave request details updated
- `status_changed`: Generic status change
- `approved_by_manager`: Manager approved the request
- `rejected_by_manager`: Manager rejected the request
- `approved_by_hr`: HR approved the request
- `rejected_by_hr`: HR rejected the request
- `cancelled`: Leave request cancelled

## Access Control

The Leave History feature implements the following access controls:

- **Employees** can only view and export their own leave history
- **Managers** can view leave history for their team members
- **HR** can view leave history for all employees
- Audit trails are restricted based on the same permissions

## Export Functionality

The export functionality supports two formats:

### CSV Export

Exports all leave request data in a CSV format with the following columns:
- ID
- Employee
- Leave Type
- Start Date
- End Date
- Half Day
- Status
- Reason
- Manager
- Manager Comment
- HR
- HR Comment
- Created At

### PDF Export

Generates a PDF report with:
- Title page
- Report metadata (generation date)
- Tabular data of leave requests
- Formatted for readability

## Integration with Leave Request Workflow

The Leave History feature integrates with the existing leave request workflow:

1. When a leave request is created, an audit entry is created
2. When a manager approves/rejects a request, an audit entry is created
3. When HR approves/rejects a request, an audit entry is created
4. When a request is cancelled, an audit entry is created

This ensures a complete audit trail for every leave request in the system.

## Usage Examples

### Viewing Leave History

```graphql
query GetLeaveHistory($userId: ID, $startDate: DateTime, $endDate: DateTime, $page: Int, $pageSize: Int) {
  leaveHistory(
    userId: $userId
    startDate: $startDate
    endDate: $endDate
    page: $page
    pageSize: $pageSize
    sortBy: startDate
    sortDirection: desc
  ) {
    items {
      id
      user {
        id
        firstName
        lastName
      }
      leaveType {
        id
        name
        color
      }
      startDate
      endDate
      halfDay
      status
      reason
      createdAt
    }
    total
    page
    pageSize
    hasMore
  }
}
```

### Exporting Leave History

```graphql
query ExportLeaveHistory($format: ExportFormat!) {
  exportLeaveHistory(
    format: $format
    startDate: "2025-01-01"
    endDate: "2025-12-31"
  ) {
    url
    filename
    expiresAt
  }
}
```

### Viewing Audit Trail

```graphql
query GetLeaveAuditTrail($leaveRequestId: ID!) {
  leaveAuditTrail(leaveRequestId: $leaveRequestId) {
    id
    action
    performedBy {
      id
      firstName
      lastName
    }
    timestamp
    details
    previousStatus
    newStatus
  }
}
```
