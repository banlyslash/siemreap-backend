# Database Connection Pool Optimization

## Problem
The application was experiencing "sorry, too many clients already" errors from PostgreSQL. This occurred because:

1. **Multiple PrismaClient instances** were being created throughout the codebase
2. Each instance creates its own connection pool
3. PostgreSQL has a maximum connection limit (default: 100)
4. With multiple instances × connections per pool, the limit was quickly exhausted

## Solution Implemented

### 1. Singleton Prisma Client Pattern
Created a singleton Prisma client at `src/lib/prisma.ts` that:
- Reuses a single PrismaClient instance across the entire application
- Prevents connection pool exhaustion
- Implements graceful shutdown on process exit
- Uses global variable in development to prevent hot-reload issues

### 2. Updated All Files
Replaced all `new PrismaClient()` instantiations with the singleton import:
- ✅ `src/graphql/context.ts`
- ✅ `src/app.ts`
- ✅ `src/simple-graphql-server.ts`
- ✅ `src/services/api-key.service.ts`
- ✅ `src/utils/api-key-auth.ts`
- ✅ `src/controllers/leave.controller.ts`

### 3. Connection Pool Configuration
Added connection pooling parameters to DATABASE_URL in `.env`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?connection_limit=10&pool_timeout=20"
```

**Parameters:**
- `connection_limit=10`: Maximum connections per Prisma Client (adjust based on your needs)
- `pool_timeout=20`: Seconds to wait for an available connection

## Recommended Settings

### For Development
```bash
connection_limit=5
pool_timeout=10
```

### For Production
Calculate based on:
- **Max connections** = (Number of application instances) × (connection_limit) < PostgreSQL max_connections
- **Example**: 5 instances × 10 connections = 50 total connections (safe for default PostgreSQL limit of 100)

```bash
connection_limit=10
pool_timeout=20
```

## Verification

After implementing these changes:
1. Restart your application
2. Monitor PostgreSQL connections:
   ```sql
   SELECT count(*) FROM pg_stat_activity WHERE datname = 'your_database_name';
   ```
3. The connection count should remain stable and low

## Additional Optimizations

If you still experience connection issues:

1. **Increase PostgreSQL max_connections** (requires database restart):
   ```sql
   ALTER SYSTEM SET max_connections = 200;
   ```

2. **Use PgBouncer** for connection pooling at the database level

3. **Enable Prisma connection pooling** with `pgbouncer=true` parameter:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname?connection_limit=10&pool_timeout=20&pgbouncer=true"
   ```

## Files Modified
- Created: `src/lib/prisma.ts`
- Updated: `src/graphql/context.ts`
- Updated: `src/app.ts`
- Updated: `src/simple-graphql-server.ts`
- Updated: `src/services/api-key.service.ts`
- Updated: `src/utils/api-key-auth.ts`
- Updated: `src/controllers/leave.controller.ts`
- Updated: `.env.example`
