# Full-Stack Deployment Skill: Next.js + FastAPI on Vercel + Railway

**Skill ID**: `001-fullstack-deployment-railway-vercel`
**Created**: 2026-01-02
**Version**: 1.0.0
**Status**: Verified Production Ready

---

## Overview

This skill captures the complete deployment process for a monorepo containing:
- **Frontend**: Next.js 16 (App Router) with React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI (Python) with SQLModel, PostgreSQL (Neon), JWT Authentication
- **Authentication**: Better Auth with JWT tokens

**Deployment Targets**:
- Frontend → Vercel (optimized for Next.js/Node.js)
- Backend → Railway (optimized for Python/FastAPI)

---

## Architecture Decision: Platform Selection

### Why Vercel for Frontend?
| Factor | Vercel | Railway | Render |
|--------|--------|---------|--------|
| Next.js Native Support | ✅ First-class | ❌ Adapter needed | ❌ Basic |
| Edge Functions | ✅ | ❌ | ❌ |
| Automatic Deployments | ✅ Git integration | ✅ | ✅ |
| Preview Deployments | ✅ | ❌ | ❌ |
| Build Performance | Optimized for Next.js | Slower | Moderate |

### Why Railway for Backend?
| Factor | Railway | Vercel | Render |
|--------|---------|--------|--------|
| Python/FastAPI Native | ✅ First-class | ❌ Serverless limits | ✅ |
| Persistent Server | ✅ | ❌ (serverless) | ✅ |
| PostgreSQL Free Tier | ✅ (1GB DB) | ❌ | ❌ ($7/mo) |
| Environment Variables | ✅ Easy | ✅ | ✅ |
| WebSocket Support | ✅ | ❌ | ✅ |

### Key Learning
**DO NOT deploy Python/FastAPI backends to Vercel**. Vercel is designed for serverless/Node.js workloads. The persistent server requirement for JWT authentication with Better Auth makes Railway the correct choice.

---

## Prerequisites

### Local Development Setup (WSL)
```bash
# Node.js version check (Next.js 16 requires >= 20.9.0)
node --version  # WSL might have 18.x (too old!)
/mnt/c/Program\ Files/nodejs/node.exe --version  # Use Windows Node.js

# For WSL, use Windows Node.js in PATH
PATH="/mnt/c/Program Files/nodejs:$PATH" npm run dev
```

### Git Repository Requirements
- Public or private GitHub repository
- Main branch with production-ready code
- README with setup instructions

---

## Phase 1: Backend Deployment to Railway

### Step 1.1: Prepare Backend Code

**Directory Structure**:
```
backend/
├── src/
│   └── api/
│       ├── main.py           # FastAPI app with CORS
│       ├── config.py         # Settings with Pydantic
│       ├── auth.py           # JWT verification
│       └── routes/           # API endpoints
├── requirements.txt
├── pyproject.toml
└── Railway.toml (optional)
```

**Key File: `backend/src/api/config.py`**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    better_auth_secret: str
    better_auth_url: str = "http://localhost:3000/api/auth"
    frontend_url: str = "http://localhost:3000"
    openai_api_key: str = ""
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_file = ".env"

settings = Settings()
```

**Key File: `backend/src/api/main.py` (CORS Configuration)**
```python
from fastapi.middleware.cors import CORSMiddleware

# Parse comma-separated frontend URLs
frontend_origins = [url.strip() for url in settings.frontend_url.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 1.2: Deploy to Railway

**Option A: Railway Dashboard (Recommended)**

1. **Create Project**:
   - Go to https://railway.app
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"

2. **Configure Service**:
   ```
   Service Name: backend
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
   ```

3. **Add Environment Variables**:
   ```bash
   # Critical (replace values with your actual secrets)
   DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require
   BETTER_AUTH_SECRET=your-43-character-secret-here
   BETTER_AUTH_URL=https://your-frontend.vercel.app/api/auth
   FRONTEND_URL=https://your-frontend.vercel.app
   OPENAI_API_KEY=sk-...
   PORT=8000
   PYTHONUNBUFFERED=1
   ```

4. **Deploy**:
   - Railway auto-deploys from GitHub
   - Wait for deployment to complete
   - Copy backend URL: `https://your-backend.railway.app`

5. **Verify Health**:
   ```bash
   curl https://your-backend.railway.app/health
   # Expected: {"status":"healthy"}
   ```

**Option B: Railway CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project (from backend directory)
cd backend
railway init
railway up

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set BETTER_AUTH_SECRET="..."
```

### Step 1.3: Critical Backend Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection | `postgresql://user:pass@host.neon.tech/db` |
| `BETTER_AUTH_SECRET` | JWT signing (43 chars) | Generated via `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `BETTER_AUTH_URL` | Frontend auth endpoint | `https://frontend.vercel.app/api/auth` |
| `FRONTEND_URL` | CORS allowed origin | `https://frontend.vercel.app` |
| `OPENAI_API_KEY` | AI features | `sk-...` |
| `PORT` | Railway port | `8000` |

---

## Phase 2: Frontend Deployment to Vercel

### Step 2.1: Prepare Frontend Code

**Critical Configuration Files**:

**`frontend-web/vercel.json`**:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**`frontend-web/next.config.js`**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
}
module.exports = nextConfig
```

**`frontend-web/package.json`** (Critical for React 19):
```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "better-auth": "^1.4.7",
    "framer-motion": "^12.0.0"
  },
  "scripts": {
    "build": "next build",
    "dev": "next dev"
  }
}
```

### Step 2.2: Common Build Errors & Fixes

#### Error 1: TypeScript Type Mismatch
```
Type error: Type 'string' is not assignable to type 'SortField | undefined'.
```

**Root Cause**: State initialized with empty string `''` but type expected `'due_date' | 'priority' | 'created_at' | 'title' | ''`

**Fix**: Initialize with valid type value
```typescript
// BEFORE (broken)
const [sortField, setSortField] = useState<SortField>('')

// AFTER (fixed)
const [sortField, setSortField] = useState<SortField>('created_at')
```

#### Error 2: React 19 Peer Dependencies
```
Cannot find module 'framer-motion'
```

**Fix**: Use `--legacy-peer-deps` flag
```bash
npm install --legacy-peer-deps
# Or in vercel.json:
"installCommand": "npm install --legacy-peer-deps"
```

### Step 2.3: Deploy to Vercel (CLI Method)

**Step 1: Login**
```bash
vercel login
# Follow browser prompts to authenticate
```

**Step 2: Link Project**
```bash
cd frontend-web
vercel link --yes --project frontend-web
# Creates .vercel directory with project config
```

**Step 3: Set Environment Variables**
```bash
# List existing variables
vercel env ls

# Remove old/broken variables
vercel env rm NEXT_PUBLIC_BETTER_AUTH_URL production --yes

# Add correct variables
echo "https://your-frontend.vercel.app/api/auth" | vercel env add NEXT_PUBLIC_BETTER_AUTH_URL production
echo "https://your-backend.railway.app" | vercel env add NEXT_PUBLIC_API_URL production
```

**Step 4: Deploy to Production**
```bash
vercel --prod --yes --force
# --force: Redeploy even if same files
# --yes: Skip confirmation
```

**Step 5: Verify Deployment**
```bash
# Check deployment status
vercel inspect <deployment-url>

# View logs
vercel inspect <deployment-url> --logs
```

### Step 2.4: Critical Frontend Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base | `https://backend.railway.app` |
| `BETTER_AUTH_SECRET` | JWT verification (MUST match backend) | Same 43-char string |
| `BETTER_AUTH_URL` | Auth endpoint | `https://frontend.vercel.app/api/auth` |

---

## Phase 3: CORS & Cross-Origin Configuration

### The Critical CORS Handshake

For authentication to work, the backend MUST allow the frontend origin:

```
Frontend (Vercel) → API Calls → Backend (Railway)
                                      ↓
                         CORS allows frontend origin?
                                      ↓
                         Yes → Request proceeds
                         No  → CORS Error (blocked)
```

### Railway Backend CORS Configuration

The backend reads `FRONTEND_URL` environment variable:

```python
# In backend/src/api/main.py
frontend_origins = [url.strip() for url in settings.frontend_url.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Required Railway Settings**:
1. Set `FRONTEND_URL` to your Vercel URL (no trailing slash)
2. **Redeploy** the Railway service to apply changes

### Vercel Frontend Better Auth URL

The frontend's `NEXT_PUBLIC_BETTER_AUTH_URL` must point to its own domain:

```
NEXT_PUBLIC_BETTER_AUTH_URL = https://frontend.vercel.app/api/auth
```

This is because Better Auth handles authentication at `/api/auth` on the frontend server.

---

## Phase 4: Vercel Monorepo Configuration

### The Root Directory Challenge

When deploying a monorepo to Vercel, you MUST specify which folder contains the frontend:

| GitHub Repo Structure | Root Directory Setting |
|----------------------|----------------------|
| `frontend-web/` | `frontend-web` |
| `frontend-chatbot/` | `frontend-chatbot` (separate project) |
| `./` (root) | `./` (not recommended for monorepo) |

### Solution: CLI Deployment from Subdirectory

Instead of changing Root Directory in Vercel settings (which can cause path issues):

1. **Deploy from INSIDE the frontend folder**:
   ```bash
   cd frontend-web
   vercel --prod --yes
   ```

2. **Ensure Root Directory in Vercel settings is `./`**:
   - This tells Vercel to build from wherever you run the command
   - Prevents "path does not exist" errors

### If You Must Use Root Directory in Dashboard

Set it to `./` (not `frontend-web`) and deploy from the `frontend-web` directory.

---

## Error Resolution Reference

### Error 1: Environment Validation Failed
```
NEXT_PUBLIC_BETTER_AUTH_URL: NEXT_PUBLIC_BETTER_AUTH_URL must be a valid URL
```

**Cause**: Malformed URL in environment variable (e.g., trailing space, invalid format)

**Fix**:
```bash
# Remove and re-add with correct URL
vercel env rm NEXT_PUBLIC_BETTER_AUTH_URL production --yes
echo "https://frontend.vercel.app/api/auth" | vercel env add NEXT_PUBLIC_BETTER_AUTH_URL production
```

### Error 2: CORS Policy Blocked
```
Access to fetch at 'https://backend.railway.app/api/...' from origin 'https://frontend.vercel.app'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Cause**: Backend's CORS middleware doesn't include frontend URL

**Fix**:
1. Update `FRONTEND_URL` on Railway to include Vercel domain
2. Redeploy Railway service

### Error 3: Path Does Not Exist
```
The provided path "/project/frontend-web/project/frontend-web" does not exist
```

**Cause**: Root Directory setting conflicts with CLI deployment location

**Fix**:
1. Set Root Directory to `./` in Vercel settings
2. Deploy from inside `frontend-web` folder
3. Or set Root Directory to `frontend-web` and deploy from root

### Error 4: Vercel Build Fails - TypeScript
```
Type 'string' is not assignable to type 'SortField | undefined'
```

**Cause**: Type mismatch between state initialization and prop types

**Fix**: Initialize state with valid type value, not empty string

---

## Deployment Checklist

### Before Deployment
- [ ] Code committed to Git main branch
- [ ] Environment variables documented
- [ ] Railway backend deployed and healthy (`/health` returns 200)
- [ ] Neon PostgreSQL database created

### Railway Backend Deployment
- [ ] GitHub repo linked
- [ ] Environment variables set (especially `FRONTEND_URL`)
- [ ] Deployment successful
- [ ] Health check passes
- [ ] CORS configured for Vercel frontend

### Vercel Frontend Deployment
- [ ] GitHub repo connected
- [ ] Root Directory set correctly (`./` if deploying from subfolder)
- [ ] Environment variables set (`NEXT_PUBLIC_API_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`)
- [ ] Build successful
- [ ] Sign up/login works
- [ ] API calls to backend succeed (no CORS errors)

### Post-Deployment Verification
- [ ] Sign up new user
- [ ] Login with existing user
- [ ] Create task
- [ ] Read tasks from dashboard
- [ ] Update task
- [ ] Delete task
- [ ] Logout works

---

## Commands Quick Reference

### Railway Commands
```bash
# Deploy
railway up

# Environment variables
railway variables set KEY=value
railway variables list

# Logs
railway logs

# Restart
railway up (redeploys)
```

### Vercel Commands
```bash
# Login
vercel login

# Link project
vercel link --yes

# Environment variables
vercel env ls
vercel env add KEY production  # Prompts for value
vercel env rm KEY production --yes

# Deploy
vercel --prod --yes            # From correct directory
vercel --prod --force          # Force redeploy

# Inspect
vercel inspect <url>
vercel inspect <url> --logs
```

---

## Lessons Learned (Reusable Intelligence)

### 1. Platform Selection is Critical
- **Node.js/Next.js → Vercel** (native support, edge functions, preview deploys)
- **Python/FastAPI → Railway** (persistent server, Python-native, free PostgreSQL)
- Don't fight the platform - use the right tool for the job

### 2. Environment Variable Consistency
- `BETTER_AUTH_SECRET` must be IDENTICAL on both Vercel and Railway
- `FRONTEND_URL` on Railway must match Vercel's deployed URL
- `NEXT_PUBLIC_BETTER_AUTH_URL` on Vercel must point to Vercel's own domain

### 3. CORS Requires Server Restart
- Changing `FRONTEND_URL` on Railway doesn't apply immediately
- Must **redeploy** Railway service to pick up new CORS settings

### 4. Monorepo Root Directory Issues
- Vercel's Root Directory setting and CLI deployment location must align
- Easiest solution: Set Root Directory to `./` and deploy from the subfolder

### 5. React 19 Peer Dependencies
- Next.js 16 + React 19 requires `--legacy-peer-deps` flag
- This is a known compatibility issue - the flag is required

### 6. TypeScript Strict Mode
- Production builds are stricter than dev builds
- Initialize state with valid type values, not empty strings
- Test production builds locally: `npm run build`

### 7. Better Auth Production URL
- `NEXT_PUBLIC_BETTER_AUTH_URL` must be the frontend's production URL
- This is because Better Auth runs on the frontend server (Next.js API routes)
- The backend only verifies tokens - it doesn't handle the auth flow itself

---

## File Templates

### vercel.json (Frontend)
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### Railway.toml (Backend - Optional)
```toml
[build]
builder = "python/python"

[deploy]
startCommand = "uvicorn src.api.main:app --host 0.0.0.0 --port $PORT"
watchPatterns = ["backend/**"]

[vars]
PYTHONUNBUFFERED = "1"
PORT = "8000"
```

---

## Verification Commands

### Test Backend Health
```bash
curl https://your-backend.railway.app/health
# Expected: {"status":"healthy"}
```

### Test CORS Configuration
```bash
curl -I -X OPTIONS https://your-backend.railway.app/api/user/tasks \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET"
# Expected: 200 OK with CORS headers
```

### Test Frontend
```bash
curl -I https://your-frontend.vercel.app
# Expected: 200 OK
curl -I https://your-frontend.vercel.app/api/auth/sign-up
# Expected: 200 OK (Better Auth endpoint)
```

---

## Troubleshooting Flowchart

```
Deployment Failed?
        ↓
Check Build Logs (Vercel) or Deploy Logs (Railway)
        ↓
Type Error? → Fix TypeScript initialization
        ↓
CORS Error? → Check Railway FRONTEND_URL + Redeploy
        ↓
Auth Error? → Check BETTER_AUTH_SECRET matches
        ↓
Module Not Found? → Check package.json + --legacy-peer-deps
        ↓
Environment Variable? → Verify all vars set correctly
```

---

## Future Improvements

1. **Custom Domain**: Add `www.yourdomain.com` to Vercel project
2. **Preview Environments**: Enable preview deployments for PRs
3. **CI/CD Pipeline**: GitHub Actions for automated testing before deploy
4. **Monitoring**: Add Vercel Analytics or Datadog
5. **Database Backups**: Configure Neon PostgreSQL automated backups

---

**Skill Document Complete** ✅
- Use this as a template for future Next.js + FastAPI deployments
- Adapt environment variable names to your specific project
- Remember: Platform selection is 80% of deployment success
