---
name: fullstack-deployment
description: |
  Deploy full-stack Next.js + FastAPI applications to production (Vercel + Railway).
  Use when deploying Next.js frontends with React 19, FastAPI Python backends, PostgreSQL databases,
  and Better Auth JWT authentication. Handles CORS, environment variables, monorepo configurations,
  and common deployment errors. Supports WSL development environments.
---

# Full-Stack Deployment: Next.js + FastAPI

Deploy production-ready full-stack applications with Next.js frontend on Vercel and FastAPI backend on Railway.

## What This Skill Does

- Deploys Next.js 16 (React 19) frontends to Vercel
- Deploys FastAPI Python backends to Railway
- Configures CORS for cross-origin authentication
- Handles Better Auth JWT token flow
- Resolves monorepo deployment issues
- Fixes common build and environment errors

## What This Skill Does NOT Do

- Infrastructure as Code (Terraform/Pulumi)
- Docker containerization (uses platform native builds)
- Multi-region deployments
- Custom domain SSL (manual setup required)

---

## Architecture Decision: Platform Selection

**Frontend to Vercel**:
- First-class Next.js support with edge functions
- Automatic preview deployments for PRs
- Optimized build performance

**Backend to Railway**:
- Native Python/FastAPI support
- Persistent server (required for Better Auth)
- Free PostgreSQL tier (1GB)
- WebSocket support

**Critical**: Do NOT deploy Python backends to Vercel (serverless limitations break JWT auth).

---

## Deployment Workflow

### Step 1: Backend Deployment (Railway)

**Required Files**:
- `backend/src/api/main.py` (CORS configuration)
- `backend/src/api/config.py` (environment settings)
- `backend/requirements.txt`

**Required Environment Variables**:
```bash
DATABASE_URL=postgresql://user:pass@host.neon.tech/db
BETTER_AUTH_SECRET=<43-char-secret>
BETTER_AUTH_URL=https://frontend.vercel.app/api/auth
FRONTEND_URL=https://frontend.vercel.app
OPENAI_API_KEY=sk-...
PORT=8000
```

**Deploy**:
1. Link GitHub repo in Railway dashboard
2. Set root directory to `backend`
3. Configure environment variables
4. Deploy and copy backend URL

**Verify**:
```bash
curl https://backend.railway.app/health
# Expected: {"status":"healthy"}
```

See `references/railway-deployment.md` for detailed Railway configuration.

### Step 2: Frontend Deployment (Vercel)

**Required Files**:
- `frontend-web/vercel.json` (build configuration)
- `frontend-web/next.config.js`
- `frontend-web/package.json`

**Required Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=https://backend.railway.app
BETTER_AUTH_SECRET=<same-43-char-secret>
BETTER_AUTH_URL=https://frontend.vercel.app/api/auth
```

**Deploy via CLI**:
```bash
cd frontend-web
vercel login
vercel link --yes
vercel env add NEXT_PUBLIC_API_URL production
vercel --prod --yes
```

See `references/vercel-deployment.md` for detailed Vercel configuration.

### Step 3: CORS Configuration

**Critical Handshake**:
```
Frontend (Vercel) -> API Calls -> Backend (Railway)
                                      |
                         CORS allows frontend origin?
                                      |
                         Yes -> Proceed
                         No  -> Blocked
```

**Backend CORS Setup** (`backend/src/api/main.py`):
```python
from fastapi.middleware.cors import CORSMiddleware

frontend_origins = [url.strip() for url in settings.frontend_url.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**After setting Railway's `FRONTEND_URL`, REDEPLOY the service** (CORS changes require restart).

See `references/cors-configuration.md` for troubleshooting CORS errors.

---

## Common Errors & Quick Fixes

### Error 1: TypeScript Build Failure
```
Type 'string' is not assignable to type 'SortField | undefined'
```
**Fix**: Initialize state with valid type value, not empty string.

### Error 2: CORS Policy Blocked
```
Access-Control-Allow-Origin header is not present
```
**Fix**: Update Railway `FRONTEND_URL` and redeploy backend.

### Error 3: React 19 Peer Dependencies
```
Cannot find module 'framer-motion'
```
**Fix**: Use `--legacy-peer-deps` flag in `vercel.json`:
```json
{
  "installCommand": "npm install --legacy-peer-deps"
}
```

### Error 4: Monorepo Path Not Found
```
The provided path "/project/frontend-web/project/frontend-web" does not exist
```
**Fix**: Set Vercel Root Directory to `./` and deploy from inside `frontend-web` folder.

See `references/error-resolution.md` for complete error catalog.

---

## Environment Variable Consistency

**Critical Rule**: `BETTER_AUTH_SECRET` MUST be identical on both platforms.

| Platform | Variable | Example |
|----------|----------|---------|
| **Railway** | `FRONTEND_URL` | `https://frontend.vercel.app` |
| **Railway** | `BETTER_AUTH_SECRET` | `<43-char-secret>` |
| **Vercel** | `NEXT_PUBLIC_API_URL` | `https://backend.railway.app` |
| **Vercel** | `BETTER_AUTH_SECRET` | `<same-43-char-secret>` |
| **Vercel** | `BETTER_AUTH_URL` | `https://frontend.vercel.app/api/auth` |

---

## WSL Development Notes

**Node.js Version Issue**:
WSL often has Node.js 18.x (too old for Next.js 16 which requires >=20.9.0).

**Solution**: Use Windows Node.js from WSL:
```bash
# Check versions
node --version  # WSL (18.x)
/mnt/c/Program\ Files/nodejs/node.exe --version  # Windows (20.x)

# Run with Windows Node.js
PATH="/mnt/c/Program Files/nodejs:$PATH" npm run dev
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code committed to main branch
- [ ] Environment variables documented
- [ ] Railway backend healthy (`/health` returns 200)
- [ ] Neon PostgreSQL database created

### Railway Backend
- [ ] GitHub repo linked
- [ ] Environment variables set
- [ ] CORS configured with Vercel URL
- [ ] Deployment successful
- [ ] Health check passes

### Vercel Frontend
- [ ] Root Directory set correctly
- [ ] Environment variables set
- [ ] Build successful
- [ ] Auth endpoints accessible (`/api/auth/sign-up`)

### Post-Deployment
- [ ] Sign up new user
- [ ] Login works
- [ ] API calls succeed (no CORS errors)
- [ ] Task CRUD operations work

---

## Reference Files

| File | When to Read |
|------|--------------|
| `references/railway-deployment.md` | Detailed Railway setup, CLI commands |
| `references/vercel-deployment.md` | Detailed Vercel setup, CLI commands |
| `references/cors-configuration.md` | CORS troubleshooting, testing |
| `references/error-resolution.md` | Complete error catalog with fixes |
| `references/monorepo-configuration.md` | Monorepo root directory issues |
| `assets/templates/vercel.json` | Production-ready vercel.json |
| `assets/templates/Railway.toml` | Production-ready Railway.toml |
| `assets/templates/cors-middleware.py` | FastAPI CORS boilerplate |

---

## Example Usage

**User**: "Deploy my Next.js + FastAPI app to production"

**Claude**:
1. Reads codebase for Dockerfiles, environment variables
2. Identifies Next.js frontend and FastAPI backend
3. Guides Railway backend deployment
4. Guides Vercel frontend deployment
5. Configures CORS handshake
6. Verifies end-to-end authentication flow

**User**: "Getting CORS error after deployment"

**Claude**:
1. Checks Railway `FRONTEND_URL` environment variable
2. Verifies it matches Vercel deployment URL
3. Confirms backend CORS middleware configuration
4. Instructs user to redeploy Railway service
5. Tests CORS with curl command

---

**Skill Type**: Deployment | **Domain**: Full-Stack | **Version**: 1.0.0
