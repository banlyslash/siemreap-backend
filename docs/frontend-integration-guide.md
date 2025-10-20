# Frontend Integration Guide

This document provides guidance on integrating the frontend with the backend GraphQL API, specifically addressing the gaps identified in the API integration gaps analysis.

## Schema Compatibility Changes

We've made several changes to the GraphQL schema to ensure compatibility with the frontend implementation:

### 1. Leave Request Structure

#### Field Mappings

| Frontend Field | Backend Field | Notes |
|---------------|--------------|-------|
| `employee` | `user` | Both fields are available, `employee` is deprecated |
| `employeeId` | `userId` | Both fields are available, `employeeId` is deprecated |
| `halfDayStart` | `halfDayStart` | Added to match frontend |
| `halfDayEnd` | `halfDayEnd` | Added to match frontend |

#### Status Enum Values

We've added aliases for status enum values to match frontend expectations:

```graphql
enum LeaveRequestStatus {
  pending
  manager_approved
  approved_by_manager # Alias for manager_approved
  manager_rejected
  rejected_by_manager # Alias for manager_rejected
  hr_approved
  approved_by_hr # Alias for hr_approved
  hr_rejected
  rejected_by_hr # Alias for hr_rejected
  cancelled
}
```

### 2. Leave Balance Structure

#### Field Mappings

| Frontend Field | Backend Field | Notes |
|---------------|--------------|-------|
| `entitled` | `allocated` | Both fields are available, `entitled` is deprecated |
| `pending` | `pending` | Added to match frontend |

#### Aggregated Balances

We've added a new query to get all leave balances for a user in a single request:

```graphql
userLeaveBalances(userId: ID!, year: Int): UserLeaveBalances!

type UserLeaveBalances {
  userId: ID!
  year: Int!
  balances: [LeaveBalance!]!
}
```

### 3. Approval Process

#### Approval Objects

We've added compatibility fields for approval objects:

```graphql
type LeaveRequest {
  # ...existing fields
  managerApproval: ApprovalInfo
  hrApproval: ApprovalInfo
}

type ApprovalInfo {
  approved: Boolean
  comment: String
  timestamp: DateTime
  by: User
}
```

#### Role-Specific Approval Mutations

We've added role-specific approval mutations for the frontend:

```graphql
managerApproveLeaveRequest(id: ID!, comment: String): LeaveRequest!
managerRejectLeaveRequest(id: ID!, comment: String!): LeaveRequest!
hrApproveLeaveRequest(id: ID!, comment: String): LeaveRequest!
hrRejectLeaveRequest(id: ID!, comment: String!): LeaveRequest!
```

## Usage Guidelines

### 1. Leave Request Creation

When creating a leave request, you can use either the new or old field names:

```graphql
mutation CreateLeaveRequest($input: CreateLeaveRequestInput!) {
  createLeaveRequest(input: $input) {
    id
    # Use either user or employee
    user { id firstName lastName }
    employee { id firstName lastName } # Same as user
    
    # Half-day handling
    halfDay
    halfDayStart
    halfDayEnd
    
    # Status
    status
  }
}
```

### 2. Leave Balance Retrieval

You can retrieve leave balances in two ways:

#### Individual Balances

```graphql
query GetLeaveBalances($userId: ID!, $year: Int) {
  leaveBalances(userId: $userId, year: $year) {
    id
    leaveType { id name color }
    allocated
    entitled # Same as allocated
    used
    pending
    remaining
  }
}
```

#### Aggregated Balances

```graphql
query GetUserLeaveBalances($userId: ID!, $year: Int) {
  userLeaveBalances(userId: $userId, year: $year) {
    userId
    year
    balances {
      id
      leaveType { id name color }
      allocated
      used
      pending
      remaining
    }
  }
}
```

### 3. Approval Process

You can use either the generic or role-specific approval mutations:

#### Generic Approval

```graphql
mutation ApproveLeaveRequest($id: ID!, $comment: String) {
  approveLeaveRequest(id: $id, comment: $comment) {
    id
    status
  }
}
```

#### Role-Specific Approval

```graphql
mutation ManagerApproveLeaveRequest($id: ID!, $comment: String) {
  managerApproveLeaveRequest(id: $id, comment: $comment) {
    id
    status
    managerApproval {
      approved
      comment
      timestamp
      by { id firstName lastName }
    }
  }
}
```

## Status Transition Rules

The following status transitions are valid:

1. `pending` → `manager_approved` (by manager)
2. `pending` → `manager_rejected` (by manager)
3. `manager_approved` → `hr_approved` (by HR)
4. `manager_approved` → `hr_rejected` (by HR)
5. `pending` → `cancelled` (by employee or admin)
6. `manager_approved` → `cancelled` (by employee or admin)

## Pending Balance Calculation

The `pending` field in the `LeaveBalance` type is calculated as the sum of working days in all pending and manager-approved leave requests for the user, leave type, and year.
