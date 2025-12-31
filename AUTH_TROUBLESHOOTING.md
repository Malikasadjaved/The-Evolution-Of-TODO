# Authentication Troubleshooting Guide

**Date:** 2025-12-14
**Status:** ⚠️ **BLOCKED** - Better Auth SQLite adapter failing

---

## Current Issue

Better Auth is unable to initialize the SQLite database adapter, causing all authentication operations (signup, login) to fail with **500 Internal Server Error**.

### Error Details

```
[BetterAuthError: Failed to initialize database adapter] {
  cause: undefined
}
```

**Endpoint Failing:** `POST http://localhost:3000/api/auth/sign-up/email`

---

## Root Cause

The Better Auth SQLite adapter (`better-sqlite3@12.5.0`) is installed but failing to initialize the database. Possible causes:

1. **Path Configuration Issue:** SQLite database path may be incorrect or inaccessible
2. **Adapter Compatibility:** Better Auth v1.4.6 may have compatibility issues with better-sqlite3 v12.5.0
3. **Database Initialization:** Better Auth is unable to create the SQLite database file
4. **Windows-specific Issue:** File path or permissions issue on Windows

---

## What We've Tried

1. ✅ Fixed Better Auth baseURL configuration (was pointing to backend instead of frontend)
2. ✅ Installed `better-sqlite3` package
3. ✅ Changed database URL from `file:./auth.db` to `./auth.db`
4. ✅ Restarted frontend server multiple times
5. ❌ Database file still not being created
6. ❌ Adapter initialization still failing

---

## Recommended Solutions

### Option 1: Use PostgreSQL (Recommended) ⭐

Match the backend's database approach and use Neon PostgreSQL for Better Auth as well.

**Advantages:**
- Production-ready database
- Same database as backend (consistency)
- No SQLite path/permissions issues
- Better Auth has mature PostgreSQL support

**Implementation:**

1. Install PostgreSQL adapter:
```bash
cd frontend
npm install @better-auth/pg
npm install pg
```

2. Update `frontend/lib/auth.ts`:
```typescript
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { pgAdapter } from "@better-auth/pg";
import { Pool } from "pg";

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.BETTER_AUTH_DATABASE_URL,
});

export const auth = betterAuth({
  database: pgAdapter(pool),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    generateId: false,
  },
  trustedOrigins: [
    "http://localhost:3000",
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
  secret: process.env.BETTER_AUTH_SECRET || "",
  plugins: [nextCookies()],
});
```

3. Add to `frontend/.env.local`:
```env
BETTER_AUTH_DATABASE_URL=postgresql://[your-neon-connection-string]
```

4. Restart frontend server

---

### Option 2: Use LibSQL / Turso (SQLite-based, Cloud)

A modern SQLite-compatible database with better Better Auth support.

**Advantages:**
- SQLite-like simplicity
- Cloud-hosted (no local file issues)
- Better Auth officially supports it
- Free tier available

**Implementation:**

1. Sign up at https://turso.tech
2. Create a database
3. Install adapter:
```bash
cd frontend
npm install @better-auth/turso
npm install @libsql/client
```

4. Update `frontend/lib/auth.ts`:
```typescript
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { tursoAdapter } from "@better-auth/turso";
import { createClient } from "@libsql/client";

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const auth = betterAuth({
  database: tursoAdapter(turso),
  // ... rest of config
});
```

5. Add to `frontend/.env.local`:
```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

---

### Option 3: Fix SQLite (Advanced Debugging)

Try to resolve the SQLite adapter issue.

**Steps:**

1. Check Better Auth and better-sqlite3 versions compatibility
2. Try absolute path for database:
```typescript
import path from "path";

database: {
  provider: "sqlite",
  url: path.join(process.cwd(), "auth.db"),
},
```

3. Manually create database file:
```bash
cd frontend
touch auth.db
chmod 666 auth.db  # Give read/write permissions
```

4. Check Better Auth logs for more details:
```typescript
// Add to lib/auth.ts
export const auth = betterAuth({
  // ... existing config
  logger: {
    level: "debug", // Enable debug logging
  },
});
```

5. Check for Windows-specific SQLite issues
6. Try downgrading better-sqlite3 to an older version

---

### Option 4: Temporary Mock Auth (For Testing Only)

Bypass Better Auth temporarily to test the rest of the application.

**⚠️ NOT FOR PRODUCTION**

Create a mock auth system that returns fake sessions for testing purposes.

---

## Immediate Recommendation

**Switch to PostgreSQL (Option 1)** because:

1. ✅ Your backend already uses PostgreSQL (Neon)
2. ✅ Better Auth has excellent PostgreSQL support
3. ✅ Avoids local file/path issues entirely
4. ✅ Production-ready from day one
5. ✅ Can share database with backend or use separate one

### Quick Start (PostgreSQL)

```bash
# 1. Install packages
cd frontend
npm install pg

# 2. Update lib/auth.ts to use PostgreSQL
# (see Option 1 above)

# 3. Add database URL to .env.local
echo "BETTER_AUTH_DATABASE_URL=your-neon-postgresql-url" >> .env.local

# 4. Restart server
npm run dev
```

Better Auth will automatically create the required tables on first use.

---

## Testing After Fix

Once you switch to PostgreSQL or another working adapter:

1. Navigate to `http://localhost:3000/signup`
2. Fill in signup form
3. Should see **201 Created** instead of **500 Internal Server Error**
4. Database tables should be auto-created by Better Auth
5. User should be redirected to dashboard

---

## Additional Notes

### Current Server Status
- ✅ Backend API: Running on port 8000
- ✅ Frontend: Running on port 3000
- ⚠️ Better Auth: Database adapter failing

### Files Modified During Troubleshooting
- `frontend/lib/auth-client.ts` - Fixed baseURL
- `frontend/.env.local` - Added NEXT_PUBLIC_BETTER_AUTH_URL
- `frontend/lib/auth.ts` - Changed SQLite URL format
- `frontend/package.json` - Added better-sqlite3

### Known Working Configuration (From PHR 011)
The authentication system **was** designed to work - the issue is specifically with the SQLite adapter initialization, not the Better Auth setup itself.

---

## Next Steps

1. **Choose a solution** (recommend Option 1: PostgreSQL)
2. **Implement the fix**
3. **Test signup/login**
4. **Continue with end-to-end authentication testing**

---

## Questions?

- Check Better Auth docs: https://better-auth.com/docs
- PostgreSQL adapter docs: https://better-auth.com/docs/adapters/postgresql
- Turso adapter docs: https://better-auth.com/docs/adapters/turso

---

**Status:** Waiting for database adapter fix before authentication can work.
