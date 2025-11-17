# HR Pending Approvals Feature

## Overview
This feature allows HR users to view all pending leave requests that need follow-up. It provides a dedicated endpoint for HR to monitor leave requests that are still in the initial pending state, helping them identify potential bottlenecks in the approval process.

## User Story
**As an HR user, I want to view Pending Approvals so I know who to follow up with.**

## Implementation Details

### GraphQL Schema
Added a new query to the GraphQL schema:

```graphql
extend type Query {
  # For HR to see all pending leave requests that need follow-up
  hrPendingApprovals: [LeaveRequest!]!
}
```

### Resolver Implementation
The resolver fetches all leave requests with a status of `pending` and returns them in descending order of creation date:

```typescript
// For HR to see all pending leave requests that need follow-up
hrPendingApprovals: async (_: any, _args: {}, context: GraphQLContext) => {
  const { prisma, user } = context
  requireAuth(user)
  
  // Only HR can access this query
  if (user?.role !== 'hr') {
    throw new GraphQLError('Not authorized to view pending approvals', {
      extensions: { code: 'FORBIDDEN' }
    })
  }
  
  // Find all pending leave requests for HR to follow up
  return prisma.leaveRequest.findMany({
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
}
```

## Security Considerations
- Only users with the HR role can access this endpoint
- Authentication is required
- Authorization is enforced through role checking

## Usage Example
```graphql
query HrPendingApprovals {
  hrPendingApprovals {
    id
    startDate
    endDate
    status
    reason
    user {
      id
      firstName
      lastName
      email
    }
    leaveType {
      id
      name
      color
    }
    createdAt
  }
}
```

## Frontend Implementation Recommendations
- Display the pending requests in a table format
- Include filters for date ranges, departments, or employees
- Provide a "Follow Up" action button that can trigger email reminders to managers
- Show the duration of time the request has been pending
- Implement sorting by various fields (employee name, date submitted, etc.)
