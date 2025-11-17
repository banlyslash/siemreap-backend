# GraphQL Schema - Quick Start

## 🚀 For Backend Developers

### Compile Schema
```bash
npm run compile-schema
```

Output: `src/graphql/schema/compiled-schema.graphql`

### When to Run
- After modifying any `.graphql` file
- Before sharing schema with frontend
- Before committing schema changes

---

## 📦 For Frontend Developers

### Option 1: Download via HTTP (Easiest)

**View Schema:**
```bash
curl http://localhost:3001/api/schema
```

**Download Schema:**
```bash
curl http://localhost:3001/api/schema/download -o schema.graphql
```

**Get Schema Info:**
```bash
curl http://localhost:3001/api/schema/info
```

### Option 2: Copy File Directly

```bash
# From backend root directory
cp src/graphql/schema/compiled-schema.graphql ../frontend/src/schema.graphql
```

### Option 3: GraphQL Code Generation

**Install dependencies:**
```bash
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations
```

**Create `codegen.yml`:**
```yaml
schema: 'http://localhost:3001/api/graphql'
# OR use local file:
# schema: '../backend/src/graphql/schema/compiled-schema.graphql'

documents: 'src/**/*.graphql'
generates:
  src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
```

**Generate types:**
```bash
npx graphql-codegen
```

---

## 📍 Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/schema` | View schema in browser |
| `GET /api/schema/download` | Download schema file |
| `GET /api/schema/info` | Get schema metadata |
| `POST /api/graphql` | GraphQL API endpoint |

---

## 📝 Schema Structure

```
Query {
  # User Management
  me, users, user(id)
  
  # Leave Management
  leaveRequests, leaveRequest(id)
  leaveBalances, leaveBalance(id)
  leaveHistory, exportLeaveHistory
  
  # Approvals
  pendingApprovals
  managerApprovedRequests
  
  # Team Management
  teamMembers, teamOnLeaveToday
  
  # Holidays
  holidays, holiday(id)
}

Mutation {
  # Authentication
  login
  
  # Leave Requests
  createLeaveRequest
  createLeaveBatch
  approveLeaveRequest
  rejectLeaveRequest
  cancelLeaveRequest
  
  # Leave Balances
  updateLeaveBalance
  initializeLeaveBalance
  
  # Holidays
  createHoliday, updateHoliday, deleteHoliday
}
```

---

## 🔧 Development Workflow

### Backend Changes
1. Modify `.graphql` files in `src/graphql/schema/`
2. Run `npm run compile-schema`
3. Commit both source and compiled schema
4. Notify frontend team of changes

### Frontend Integration
1. Fetch latest schema: `curl http://localhost:3001/api/schema/download -o schema.graphql`
2. Run code generation: `npx graphql-codegen`
3. Use generated types in your code

---

## 💡 Tips

- **Auto-compile on save**: Add to your IDE's file watcher
- **Git hooks**: Auto-compile before commit (see `SCHEMA_SHARING.md`)
- **Schema diff**: Use GraphQL Inspector to track changes
- **Introspection**: Enable in development, disable in production

---

## 📚 More Information

See `SCHEMA_SHARING.md` for detailed documentation.
