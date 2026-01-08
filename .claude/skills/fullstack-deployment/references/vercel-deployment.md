# Vercel Frontend Deployment Guide

Complete guide for deploying Next.js frontends to Vercel.

## Prerequisites

- GitHub repository
- Vercel account (free tier available)
- Backend deployed to Railway (for API URL)

## Directory Structure

```
frontend-web/
├── app/                    # Next.js App Router
├── components/
├── lib/
│   └── api.ts             # API client
├── next.config.js
├── package.json
├── tsconfig.json
└── vercel.json
```

## Configuration Files

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Key Settings**:
- `installCommand`: `--legacy-peer-deps` required for React 19 + Framer Motion compatibility
- `framework`: Tells Vercel to use Next.js optimizations

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
}

module.exports = nextConfig
```

**Key Settings**:
- `output: 'standalone'`: Optimizes build size for production

### package.json (Critical for React 19)

```json
{
  "name": "frontend-web",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "better-auth": "^1.4.7",
    "framer-motion": "^12.0.0"
  }
}
```

## Deployment Methods

### Method 1: Vercel CLI (Recommended for Monorepos)

**Step 1: Install CLI**
```bash
npm i -g vercel
```

**Step 2: Login**
```bash
vercel login
# Follow browser prompts
```

**Step 3: Link Project**
```bash
cd frontend-web
vercel link --yes --project frontend-web
# Creates .vercel directory
```

**Step 4: Set Environment Variables**
```bash
# Add production variables
echo "https://backend.railway.app" | vercel env add NEXT_PUBLIC_API_URL production
echo "https://frontend.vercel.app/api/auth" | vercel env add NEXT_PUBLIC_BETTER_AUTH_URL production
echo "<43-char-secret>" | vercel env add BETTER_AUTH_SECRET production

# View variables
vercel env ls
```

**Step 5: Deploy to Production**
```bash
vercel --prod --yes
# --yes: Skip confirmation
# --force: Redeploy even if no changes
```

**Step 6: Verify**
```bash
# Inspect deployment
vercel inspect <deployment-url>

# View logs
vercel inspect <deployment-url> --logs
```

### Method 2: Vercel Dashboard

**Step 1: Import Project**
1. Go to https://vercel.com/new
2. Connect GitHub repository
3. Select repository

**Step 2: Configure Project**
```
Framework Preset: Next.js
Root Directory: ./           # Deploy from root, CLI handles subfolder
Build Command: (leave default)
Output Directory: (leave default)
Install Command: npm install --legacy-peer-deps
```

**Step 3: Environment Variables**
Add in Vercel dashboard > Settings > Environment Variables:
```
NEXT_PUBLIC_API_URL = https://backend.railway.app
BETTER_AUTH_SECRET = <43-char-secret>
NEXT_PUBLIC_BETTER_AUTH_URL = https://<project>.vercel.app/api/auth
```

**Note**: Update `NEXT_PUBLIC_BETTER_AUTH_URL` after first deployment with actual Vercel URL.

**Step 4: Deploy**
- Click "Deploy"
- Monitor build logs
- Copy deployment URL

## Environment Variables Reference

| Variable | Purpose | Example | Visibility |
|----------|---------|---------|------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://backend.railway.app` | Public (client) |
| `BETTER_AUTH_SECRET` | JWT verification (MUST match backend) | `<43-char-secret>` | Private (server) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Auth endpoint | `https://frontend.vercel.app/api/auth` | Public (client) |

**Critical Rule**: `BETTER_AUTH_SECRET` must be IDENTICAL to Railway backend secret.

## Monorepo Configuration

### The Root Directory Challenge

When deploying from a monorepo, Vercel needs to know which folder contains the frontend.

**Solution 1: Deploy from Subdirectory (CLI)**

Best for monorepos:

```bash
# Deploy from INSIDE frontend folder
cd frontend-web
vercel --prod --yes
```

Set Root Directory in Vercel settings to `./` (not `frontend-web`).

**Solution 2: Set Root Directory in Dashboard**

If deploying via dashboard:
1. Set Root Directory to `frontend-web`
2. Ensure build command paths are relative to that directory

### Path Error: "does not exist"

**Symptom**:
```
The provided path "/project/frontend-web/project/frontend-web" does not exist
```

**Cause**: Root Directory setting conflicts with actual deployment location

**Fix**:
1. Set Root Directory to `./` in Vercel settings
2. Always deploy from inside `frontend-web` folder via CLI

## Common Build Errors & Fixes

### Error 1: TypeScript Type Mismatch

```
Type 'string' is not assignable to type 'SortField | undefined'
```

**Cause**: State initialized with empty string but type expected specific values

**Fix**:
```typescript
// BEFORE (broken)
const [sortField, setSortField] = useState<SortField>('')

// AFTER (fixed)
const [sortField, setSortField] = useState<SortField>('created_at')
```

### Error 2: React 19 Peer Dependencies

```
Cannot find module 'framer-motion'
ERESOLVE unable to resolve dependency tree
```

**Cause**: React 19 peer dependency conflicts

**Fix**: Use `--legacy-peer-deps` in `vercel.json`:
```json
{
  "installCommand": "npm install --legacy-peer-deps"
}
```

### Error 3: Environment Validation Failed

```
NEXT_PUBLIC_BETTER_AUTH_URL: must be a valid URL
```

**Cause**: Malformed URL (trailing space, missing protocol, etc.)

**Fix**:
```bash
# Remove and re-add
vercel env rm NEXT_PUBLIC_BETTER_AUTH_URL production --yes
echo "https://frontend.vercel.app/api/auth" | vercel env add NEXT_PUBLIC_BETTER_AUTH_URL production
```

### Error 4: Module Not Found (local build works)

**Cause**: Case-sensitive imports on Vercel (Linux) vs local (Windows)

**Fix**: Ensure import paths match file casing exactly:
```typescript
// WRONG (if file is TaskCard.tsx)
import TaskCard from './components/taskcard'

// CORRECT
import TaskCard from './components/TaskCard'
```

## Verification Commands

### Test Frontend

```bash
# Homepage
curl -I https://frontend.vercel.app
# Expected: 200 OK

# Better Auth endpoints
curl -I https://frontend.vercel.app/api/auth/sign-up
# Expected: 200 OK
```

### Test API Connection

```bash
# From frontend, check if backend is accessible
curl https://frontend.vercel.app/api/tasks
# Should make request to Railway backend
```

## Post-Deployment Steps

### 1. Update Railway CORS

After getting Vercel URL, update Railway backend:

```bash
railway variables set FRONTEND_URL="https://your-frontend.vercel.app"
railway up  # Redeploy to apply CORS changes
```

### 2. Update Better Auth URL

If you used placeholder during initial deployment:

```bash
vercel env rm NEXT_PUBLIC_BETTER_AUTH_URL production --yes
echo "https://<actual-url>.vercel.app/api/auth" | vercel env add NEXT_PUBLIC_BETTER_AUTH_URL production
vercel --prod --force  # Redeploy with new variable
```

### 3. Test Authentication Flow

1. Visit frontend URL
2. Sign up new user
3. Check Railway logs for authentication requests
4. Login with user
5. Test protected API routes

## Vercel CLI Commands

```bash
# Deploy
vercel                     # Preview deployment
vercel --prod              # Production deployment
vercel --prod --force      # Force redeploy

# Environment variables
vercel env ls
vercel env add KEY <environment>
vercel env rm KEY <environment> --yes
vercel env pull .env.local  # Download to local file

# Project management
vercel link --yes
vercel inspect <url>
vercel inspect <url> --logs

# Domains
vercel domains ls
vercel domains add <domain>
```

## Preview Deployments

Vercel automatically creates preview deployments for PRs:

```
Feature Branch -> PR -> Preview URL (https://<branch>-<project>.vercel.app)
Main Branch -> Production URL
```

**Environment Variables for Previews**:
- Use Vercel dashboard to set different values for preview vs production
- Example: Point preview to staging backend

## Troubleshooting

### Issue 1: Deployment Succeeds but Site Shows 500 Error

**Cause**: Environment variable missing or malformed

**Fix**:
1. Check Vercel logs: `vercel inspect <url> --logs`
2. Verify all required environment variables are set
3. Ensure `BETTER_AUTH_SECRET` is exactly 43 characters

### Issue 2: Authentication Not Working

**Symptom**: Login fails with no error

**Cause**: `NEXT_PUBLIC_BETTER_AUTH_URL` points to wrong domain

**Fix**: Ensure it points to the FRONTEND's own domain:
```bash
# CORRECT
NEXT_PUBLIC_BETTER_AUTH_URL=https://frontend.vercel.app/api/auth

# WRONG (pointing to backend)
NEXT_PUBLIC_BETTER_AUTH_URL=https://backend.railway.app/api/auth
```

### Issue 3: Build Slower Than Expected

**Symptom**: Build takes 5+ minutes

**Cause**: Installing large dependencies or TypeScript compilation

**Optimization**:
1. Use `output: 'standalone'` in `next.config.js`
2. Check for unnecessary dependencies in `package.json`
3. Enable SWC (default in Next.js 16)

## WSL Development Environment

### Node.js Version Mismatch

**Issue**: WSL has Node.js 18.x, Next.js 16 requires >=20.9.0

**Solution**: Use Windows Node.js from WSL:
```bash
# Check versions
node --version  # WSL: 18.19.1
/mnt/c/Program\ Files/nodejs/node.exe --version  # Windows: 20.x.x

# Run dev server with Windows Node.js
cd frontend-web
PATH="/mnt/c/Program Files/nodejs:$PATH" npm run dev
```

**Alternative**: Install Node.js 20+ in WSL via nvm:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```
