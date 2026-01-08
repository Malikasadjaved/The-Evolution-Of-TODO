# Error Resolution Catalog

Complete catalog of deployment errors with fixes for Next.js + FastAPI full-stack deployments.

## Build Errors

### Error 1: TypeScript Type Mismatch

**Error Message**:
```
Type 'string' is not assignable to type 'SortField | undefined'.
  Type 'string' is not assignable to type '"due_date" | "priority" | "created_at" | "title"'.
```

**File**: Usually in React components with state

**Root Cause**: State initialized with empty string `''` but type expected specific literal values

**Fix**:
```typescript
// BEFORE (broken)
const [sortField, setSortField] = useState<SortField>('')

// AFTER (fixed)
const [sortField, setSortField] = useState<SortField>('created_at')

// Or make type nullable
type SortField = 'due_date' | 'priority' | 'created_at' | 'title' | ''
```

**Prevention**: Always initialize state with valid type values

---

### Error 2: React 19 Peer Dependency Conflicts

**Error Message**:
```
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^18.0.0" from framer-motion@12.0.0
npm ERR! node_modules/framer-motion
```

**Root Cause**: Framer Motion expects React 18, but project uses React 19

**Fix 1: Vercel Configuration**

Add to `vercel.json`:
```json
{
  "installCommand": "npm install --legacy-peer-deps"
}
```

**Fix 2: Package.json**

Add to `package.json`:
```json
{
  "scripts": {
    "build": "npm install --legacy-peer-deps && next build"
  }
}
```

**Fix 3: Local Development**

```bash
npm install --legacy-peer-deps
```

**Why It Works**: `--legacy-peer-deps` ignores peer dependency mismatches

**Alternative**: Wait for library updates or use React 18

---

### Error 3: Module Not Found

**Error Message**:
```
Module not found: Can't resolve 'framer-motion'
Module not found: Can't resolve '@/components/TaskCard'
```

**Cause 1: Missing Dependency**

**Fix**:
```bash
npm install framer-motion
# Or whatever package is missing
```

**Cause 2: Case-Sensitive Paths (Production vs Local)**

**Details**: Vercel runs on Linux (case-sensitive), local Windows/Mac may be case-insensitive

**Fix**:
```typescript
// WRONG (if file is TaskCard.tsx)
import TaskCard from './components/taskcard'

// CORRECT
import TaskCard from './components/TaskCard'
```

**Prevention**: Match casing exactly in imports

---

### Error 4: Next.js Version Mismatch

**Error Message**:
```
You are using Node.js 18.19.1. For Next.js, Node.js version ">=20.9.0" is required.
```

**Context**: WSL environment with old Node.js

**Fix 1: Use Windows Node.js from WSL**

```bash
# Check Windows Node.js version
/mnt/c/Program\ Files/nodejs/node.exe --version

# Run with Windows Node.js
PATH="/mnt/c/Program Files/nodejs:$PATH" npm run dev
```

**Fix 2: Install Node.js 20+ in WSL**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
node --version  # Should show v20.x.x
```

**Prevention**: Always use Node.js >=20.9.0 for Next.js 16+

---

## Deployment Errors

### Error 5: Environment Variable Validation Failed

**Error Message**:
```
Error: NEXT_PUBLIC_BETTER_AUTH_URL: NEXT_PUBLIC_BETTER_AUTH_URL must be a valid URL
```

**Root Cause**: Malformed URL in environment variable

**Common Issues**:
- Trailing space: `"https://example.com "`
- Missing protocol: `"example.com"`
- Invalid characters: `"https://example .com"`

**Fix**:
```bash
# Remove broken variable
vercel env rm NEXT_PUBLIC_BETTER_AUTH_URL production --yes

# Add correct variable (use echo to avoid shell interpretation)
echo "https://frontend.vercel.app/api/auth" | vercel env add NEXT_PUBLIC_BETTER_AUTH_URL production

# Redeploy
vercel --prod --force
```

**Prevention**: Always use quotes and verify URL format

---

### Error 6: Path Does Not Exist (Monorepo)

**Error Message**:
```
Error: The provided path "/project/frontend-web/project/frontend-web" does not exist
Error: ENOENT: no such file or directory, scandir '/project/frontend-web/node_modules'
```

**Root Cause**: Vercel Root Directory setting conflicts with CLI deployment location

**Fix 1: Set Root Directory to `./`**

1. Vercel Dashboard > Settings > General
2. Set Root Directory to `./`
3. Deploy from inside `frontend-web` folder:
   ```bash
   cd frontend-web
   vercel --prod --yes
   ```

**Fix 2: Set Root Directory to Subfolder**

1. Set Root Directory to `frontend-web`
2. Deploy from monorepo root:
   ```bash
   cd /path/to/monorepo
   vercel --prod --yes
   ```

**Prevention**: Ensure Root Directory and deployment location align

---

### Error 7: Railway Build Failed - Missing requirements.txt

**Error Message**:
```
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
```

**Root Cause**: Railway can't find `requirements.txt` in root directory setting

**Fix**:
1. Railway Dashboard > Service Settings
2. Set Root Directory to `backend`
3. Ensure `requirements.txt` is in `backend/requirements.txt`
4. Redeploy

**Prevention**: Verify Railway Root Directory points to backend folder

---

## Runtime Errors

### Error 8: CORS Policy Blocked

**Error Message (Browser Console)**:
```
Access to fetch at 'https://backend.railway.app/api/tasks' from origin
'https://frontend.vercel.app' has been blocked by CORS policy: No
'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause**: Backend's CORS middleware doesn't include frontend URL

**Fix**:
```bash
# Update Railway environment variable
railway variables set FRONTEND_URL="https://frontend.vercel.app"

# CRITICAL: Redeploy backend to apply changes
railway up
```

**Verification**:
```bash
curl -I -X OPTIONS https://backend.railway.app/api/tasks \
  -H "Origin: https://frontend.vercel.app"

# Should include:
# access-control-allow-origin: https://frontend.vercel.app
```

**See**: `cors-configuration.md` for detailed CORS troubleshooting

---

### Error 9: 401 Unauthorized on Protected Routes

**Error Message (Browser Console)**:
```
GET https://backend.railway.app/api/user/123/tasks 401 (Unauthorized)
```

**Cause 1: Missing JWT Token**

**Fix**: Ensure token is stored and sent:
```typescript
// Store token after login
localStorage.setItem('auth_token', response.token)

// Send token in requests
const token = localStorage.getItem('auth_token')
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**Cause 2: Incorrect BETTER_AUTH_SECRET**

**Fix**: Ensure secret matches on both platforms:
```bash
# Railway
railway variables list | grep BETTER_AUTH_SECRET

# Vercel
vercel env ls | grep BETTER_AUTH_SECRET

# Must be identical!
```

**Cause 3: Token Expired**

**Fix**: Implement token refresh or redirect to login

---

### Error 10: Database Connection Failed

**Error Message (Railway Logs)**:
```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) connection to server failed
```

**Cause 1: Missing SSL**

**Fix**: Add `?sslmode=require` to DATABASE_URL:
```bash
# WRONG
postgresql://user:pass@host.neon.tech/db

# CORRECT
postgresql://user:pass@host.neon.tech/db?sslmode=require
```

**Cause 2: Invalid Credentials**

**Fix**: Regenerate Neon PostgreSQL connection string:
1. Neon Dashboard > Connection Details
2. Copy connection string
3. Update Railway `DATABASE_URL`
4. Redeploy

---

### Error 11: 500 Internal Server Error (Deployed Frontend)

**Error Message**: Frontend loads but shows 500 error page

**Cause 1: Missing Environment Variables**

**Fix**:
```bash
# Check which variables are set
vercel env ls

# Add missing variables
vercel env add NEXT_PUBLIC_API_URL production
vercel env add BETTER_AUTH_SECRET production
```

**Cause 2: Environment Variable Format Error**

**Fix**:
```bash
# View deployment logs
vercel inspect <deployment-url> --logs

# Look for "Invalid URL" or "ECONNREFUSED" errors
# Fix the malformed variable
```

**Prevention**: Test locally with production-like .env first

---

### Error 12: Better Auth Sign Up Fails

**Error Message**:
```
Failed to fetch
POST https://frontend.vercel.app/api/auth/sign-up net::ERR_FAILED
```

**Cause 1: BETTER_AUTH_URL Points to Wrong Domain**

**Fix**: Ensure it points to FRONTEND's own domain:
```bash
# CORRECT (frontend's own domain)
NEXT_PUBLIC_BETTER_AUTH_URL=https://frontend.vercel.app/api/auth

# WRONG (backend domain)
NEXT_PUBLIC_BETTER_AUTH_URL=https://backend.railway.app/api/auth
```

**Cause 2: Better Auth Secret Missing**

**Fix**:
```bash
# Add to Vercel (server-side)
vercel env add BETTER_AUTH_SECRET production

# Must match Railway backend secret
```

---

## Performance Errors

### Error 13: Slow Build Times (>5 minutes)

**Symptom**: Vercel build takes much longer than local

**Cause 1: Large Dependencies**

**Fix**:
```bash
# Audit bundle size
npx next-bundle-analyzer

# Remove unused dependencies
npm uninstall <package>
```

**Cause 2: TypeScript Compilation**

**Fix**: Use SWC (default in Next.js 16):
```javascript
// next.config.js
module.exports = {
  swcMinify: true,  // Default in Next.js 16
}
```

**Prevention**: Keep dependencies minimal, use tree-shaking

---

### Error 14: Cold Start Latency (Railway)

**Symptom**: First request takes 10+ seconds

**Cause**: Railway free tier spins down after inactivity

**Solution 1: Upgrade to Railway Pro** ($5/mo - no cold starts)

**Solution 2: Keep-Alive Ping**

Create GitHub Action to ping every 10 minutes:
```yaml
# .github/workflows/keepalive.yml
name: Keep Railway Warm
on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl https://backend.railway.app/health
```

---

## WSL-Specific Errors

### Error 15: npm Command Not Found (WSL)

**Error Message**:
```
bash: npm: command not found
```

**Fix 1: Use Windows Node.js**

```bash
# Run Windows npm from WSL
/mnt/c/Program\ Files/nodejs/npm.cmd install
```

**Fix 2: Install Node.js in WSL**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install Node.js
nvm install 20
nvm use 20
```

---

### Error 16: Port Already in Use (WSL)

**Error Message**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix** (WSL-specific):
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or kill all node processes
pkill -9 node
```

---

## Debugging Workflow

```
Error Occurred?
    ↓
1. Identify Error Source
   - Build time (Vercel/Railway logs)?
   - Runtime (Browser console)?
   - Network (DevTools Network tab)?
    ↓
2. Check Environment Variables
   - All required variables set?
   - Values correct (no typos)?
   - Secrets match across platforms?
    ↓
3. Check Logs
   - Vercel: vercel inspect <url> --logs
   - Railway: railway logs
   - Browser: DevTools Console + Network
    ↓
4. Test Locally
   - Can you reproduce locally?
   - Use production .env values
    ↓
5. Apply Fix
   - Update code/config
   - Redeploy (--force if needed)
   - Verify fix in production
```

## Quick Reference

| Error Type | First Check | Common Fix |
|------------|-------------|------------|
| Build failure | Vercel logs | Fix TypeScript errors, add --legacy-peer-deps |
| CORS blocked | Railway FRONTEND_URL | Update URL, redeploy backend |
| 401 Unauthorized | Token in localStorage | Check BETTER_AUTH_SECRET matches |
| 500 Error | Vercel env vars | Add missing variables, redeploy |
| Path not found | Root Directory setting | Set to `./`, deploy from subfolder |
| Module not found | npm install logs | Install dependency, check casing |
| Database error | DATABASE_URL | Add `?sslmode=require` |
| WSL Node.js | node --version | Use Windows Node.js or install nvm |
