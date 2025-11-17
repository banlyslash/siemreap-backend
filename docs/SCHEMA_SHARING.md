# GraphQL Schema Sharing Guide

## Overview

This project uses a modular GraphQL schema structure where each domain (users, leave requests, holidays, etc.) has its own `.graphql` file. For easy sharing with frontend developers, we provide a compiled single-file version of the complete schema.

## Quick Start

### Generate the Compiled Schema

```bash
npm run compile-schema
```

This will generate/update: `src/graphql/schema/compiled-schema.graphql`

### Share with Frontend

The compiled schema file can be found at:
```
src/graphql/schema/compiled-schema.graphql
```

**Options for sharing:**

1. **Copy the file** directly to your frontend repository
2. **Share via Git** - commit the compiled schema to version control
3. **API endpoint** - serve it via HTTP (see below)
4. **GraphQL introspection** - frontend can query the schema directly from the running server

## Schema Structure

### Source Files (Modular)
```
src/graphql/schema/
├── schema.graphql              # Root Query/Mutation types
├── user.graphql                # User types and inputs
├── leave-type.graphql          # Leave type definitions
├── leave-request.graphql       # Leave request types
├── leave-balance.graphql       # Leave balance types
├── leave-batch.graphql         # Batch operations
├── leave-history.graphql       # Leave history and audit
├── holiday.graphql             # Holiday types
├── statistics.graphql          # Statistics types
├── hr-pending-approvals.graphql # HR approval types
└── compiled-schema.graphql     # ✨ Generated single file
```

### Compiled Schema
- **Single file** containing all type definitions
- **Auto-generated** with metadata header
- **Organized** in logical order
- **Ready to share** with frontend teams

## Usage Examples

### For Frontend Developers

#### 1. GraphQL Code Generation (Recommended)

Use the compiled schema for code generation:

```bash
# In your frontend project
npx @graphql-codegen/cli init
```

Configure `codegen.yml`:
```yaml
schema: '../backend/src/graphql/schema/compiled-schema.graphql'
generates:
  src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
```

#### 2. Apollo Client IntrospectionQuery

```typescript
import { getIntrospectionQuery } from 'graphql'

// Fetch schema from running server
const introspectionQuery = getIntrospectionQuery()
const result = await fetch('http://localhost:4000/api/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: introspectionQuery })
})
```

#### 3. Direct Import (TypeScript)

```typescript
import schema from './compiled-schema.graphql'
// Use with GraphQL tools
```

## Automatic Updates

### When to Regenerate

Run `npm run compile-schema` whenever you:
- ✅ Add new types or fields
- ✅ Modify existing types
- ✅ Add new queries or mutations
- ✅ Update enums or inputs

### Git Hooks (Optional)

Add to `.husky/pre-commit`:
```bash
npm run compile-schema
git add src/graphql/schema/compiled-schema.graphql
```

This ensures the compiled schema is always up-to-date.

## Serving Schema via HTTP

### Option 1: Static File Endpoint

Add to `src/app.ts`:
```typescript
import path from 'path'

app.get('/api/schema', (req, res) => {
  const schemaPath = path.join(__dirname, 'graphql/schema/compiled-schema.graphql')
  res.sendFile(schemaPath)
})
```

Frontend can fetch:
```bash
curl http://localhost:3001/api/schema
```

### Option 2: GraphQL Introspection (Built-in)

Apollo Server provides introspection by default in development:

```graphql
query IntrospectionQuery {
  __schema {
    types {
      name
      fields {
        name
        type {
          name
        }
      }
    }
  }
}
```

## Best Practices

### For Backend Developers

1. **Keep schemas modular** - one file per domain
2. **Run compile-schema** before committing changes
3. **Document breaking changes** in commit messages
4. **Version your schema** if using schema registry

### For Frontend Developers

1. **Use code generation** for type safety
2. **Fetch schema regularly** during development
3. **Cache schema** in production builds
4. **Handle schema changes** gracefully

## Troubleshooting

### Schema Not Updating

```bash
# Clear cache and regenerate
rm src/graphql/schema/compiled-schema.graphql
npm run compile-schema
```

### TypeScript Errors

Ensure `graphql` package versions match between backend and frontend:
```bash
npm list graphql
```

### Missing Types

Check that all `.graphql` files are in `src/graphql/schema/` directory.

## Advanced: Schema Registry

For larger teams, consider using a schema registry:

- **Apollo Studio** - schema versioning and tracking
- **GraphQL Inspector** - schema diff and validation
- **Schema Stitching** - combine multiple schemas

## Related Scripts

```bash
npm run compile-schema    # Compile all schema files into one
npm run codegen          # Generate TypeScript types from schema
npm run dev              # Start development server with schema
```

## Schema Metadata

The compiled schema includes:
- ✅ Generation timestamp
- ✅ Source file references
- ✅ Regeneration instructions
- ✅ File organization comments

## Support

For questions about the schema:
1. Check the compiled schema file
2. Review individual `.graphql` files for details
3. Test queries in GraphQL Playground: `http://localhost:4000/api/graphql`
