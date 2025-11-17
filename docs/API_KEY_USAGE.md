# API Key Authentication Usage

## Overview

This document describes how to use API key authentication to access the GraphQL API, specifically for retrieving employee leave balances by email.

## Authentication

API key authentication allows external services to access specific GraphQL queries without user credentials. The API key must be passed in the `x-api-key` header.

### Required Permission

To query leave balances by email, your API key must have the `read:leaves` permission.

## Query: leaveBalancesByEmail

### Description

Retrieves leave balance information for an employee using their email address. This query is designed for external services (e.g., notification systems, reporting tools) that need to access employee leave data.

### Schema

```graphql
type Query {
  leaveBalancesByEmail(email: String!, year: Int): UserLeaveBalances!
}

type UserLeaveBalances {
  userId: ID!
  year: Int!
  balances: [LeaveBalance!]!
}

type LeaveBalance {
  id: ID!
  user: User!
  leaveType: LeaveType!
  year: Int!
  allocated: Float!
  used: Float!
  remaining: Float!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Parameters

- **email** (required): The employee's email address
- **year** (optional): The year for which to retrieve balances. Defaults to the current year if not specified.

### Example Request

```bash
curl -X POST http://localhost:3001/api/graphql \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "query": "query GetLeaveBalance($email: String!, $year: Int) { leaveBalancesByEmail(email: $email, year: $year) { userId year balances { id leaveType { name color } allocated used remaining } } }",
    "variables": {
      "email": "employee@example.com",
      "year": 2025
    }
  }'
```

### Example Response

```json
{
  "data": {
    "leaveBalancesByEmail": {
      "userId": "user-123",
      "year": 2025,
      "balances": [
        {
          "id": "balance-1",
          "leaveType": {
            "name": "Annual Leave",
            "color": "#4CAF50"
          },
          "allocated": 20.0,
          "used": 5.0,
          "remaining": 15.0
        },
        {
          "id": "balance-2",
          "leaveType": {
            "name": "Sick Leave",
            "color": "#F44336"
          },
          "allocated": 10.0,
          "used": 2.0,
          "remaining": 8.0
        }
      ]
    }
  }
}
```

### Error Responses

#### User Not Found

```json
{
  "errors": [
    {
      "message": "User with email employee@example.com not found",
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

#### Missing or Invalid API Key

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

#### Insufficient Permissions

```json
{
  "errors": [
    {
      "message": "Insufficient permissions",
      "extensions": {
        "code": "FORBIDDEN"
      }
    }
  ]
}
```

## Generating an API Key

To generate an API key with the required permissions, run:

```bash
npm run generate-api-key
```

Or use the API key service programmatically:

```typescript
import { ApiKeyService } from '@/services/api-key.service'

const apiKey = await ApiKeyService.createApiKey(
  'Notification Service',
  'notification-service',
  ['read:leaves'],
  'API key for sending leave balance notifications',
  // Optional: expiration date
  new Date('2026-12-31')
)

console.log('API Key:', apiKey.key)
```

## Use Cases

### 1. Notification Service

Send reminders to employees about their remaining leave balance:

```typescript
async function notifyEmployeeLeaveBalance(email: string) {
  const response = await fetch('http://localhost:3001/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY
    },
    body: JSON.stringify({
      query: `
        query GetLeaveBalance($email: String!) {
          leaveBalancesByEmail(email: $email) {
            balances {
              leaveType { name }
              remaining
            }
          }
        }
      `,
      variables: { email }
    })
  })
  
  const { data } = await response.json()
  
  // Send notification with balance info
  for (const balance of data.leaveBalancesByEmail.balances) {
    console.log(`${balance.leaveType.name}: ${balance.remaining} days remaining`)
  }
}
```

### 2. Reporting Dashboard

Display leave balance statistics across the organization:

```typescript
async function getTeamLeaveBalances(emails: string[]) {
  const balances = await Promise.all(
    emails.map(email => 
      fetch('http://localhost:3001/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.API_KEY
        },
        body: JSON.stringify({
          query: `
            query GetLeaveBalance($email: String!) {
              leaveBalancesByEmail(email: $email) {
                userId
                balances {
                  leaveType { name }
                  allocated
                  used
                  remaining
                }
              }
            }
          `,
          variables: { email }
        })
      }).then(res => res.json())
    )
  )
  
  return balances
}
```

## Security Considerations

1. **Keep API keys secure**: Never commit API keys to version control
2. **Use environment variables**: Store API keys in `.env` files or secure vaults
3. **Rotate keys regularly**: Set expiration dates and rotate keys periodically
4. **Limit permissions**: Only grant the minimum permissions required
5. **Monitor usage**: Track API key usage via the `lastUsedAt` field

## Additional Resources

- [GraphQL Schema Documentation](./src/graphql/schema/)
- [API Key Service](./src/services/api-key.service.ts)
- [Service Authentication Utility](./src/utils/service-auth.ts)
