# Vercel Deployment Guide - Phase II & III

**Date**: January 2, 2026
**Status**: Ready for deployment
**Deployment Strategy**: Frontend on Vercel, Backend on Railway/Render

---

## Overview

### What Gets Deployed to Vercel

| Application | Port (Local) | Vercel URL (Example) | Status |
|-------------|--------------|----------------------|--------|
| **frontend-web** (Phase 2) | 3000 | `https://todo-web.vercel.app` | Ready |
| **frontend-chatbot** (Phase 3) | 3001 | `https://todo-chatbot.vercel.app` | Ready |
| **backend** (FastAPI) | 8000 | ❌ **NOT Vercel** (use Railway/Render) | N/A |

**Why backend NOT on Vercel?**
- Vercel is optimized for Node.js/Next.js (not Python FastAPI)
- Better Auth JWT verification needs persistent Python server
- Railway/Render provide better FastAPI hosting with PostgreSQL

---

## Phase 4 Deployment Strategy

### Important: Phase 4 vs Vercel

| Phase | Deployment Platform | Purpose |
|-------|---------------------|---------|
| **Phase 2-3** (Current) | Vercel (frontends) + Railway (backend) | Production web hosting |
| **Phase 4** | Kubernetes (Minikube → Cloud) | Container orchestration |

**Can we work in parallel?**
✅ **YES!** Here's how:

```
Timeline (Jan 2-4):

Day 1 (Today - Jan 2):
├─ Morning: Deploy to Vercel (1-2 hours)
│  ├─ frontend-web → Vercel
│  ├─ frontend-chatbot → Vercel
│  └─ backend → Railway
│
└─ Afternoon: Start Phase 4 (parallel work)
   ├─ Create Dockerfiles (already done!)
   ├─ Write K8s manifests
   ├─ Create Helm charts
   └─ Setup Minikube

Day 2-3 (Jan 3-4):
└─ Phase 4: Kubernetes deployment
   ├─ Test on Minikube
   ├─ kubectl-ai integration
   ├─ kagent setup
   └─ Submit Phase 4
```

**Key Point**:
- Vercel deployment is for **production web access** (hackathon demo)
- Phase 4 is for **Kubernetes/container orchestration** (different requirement)
- They are **separate deployments** - can do both!

---

## Step-by-Step: Vercel Deployment

### Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com (free tier)
2. **GitHub Repo**: Your code must be in a public GitHub repository
3. **Railway Account**: For backend deployment (https://railway.app)

---

## Part 1: Deploy Backend to Railway (Required First)

### Why Railway?
- ✅ Supports Python/FastAPI natively
- ✅ Free tier with PostgreSQL
- ✅ Automatic HTTPS
- ✅ Environment variables
- ✅ Better Auth integration works

### Steps:

#### 1. Create Railway Project
```bash
# Visit: https://railway.app
# Click "Start a New Project"
# Select "Deploy from GitHub repo"
# Choose your repository
```

#### 2. Configure Backend Service
```yaml
# Railway will auto-detect backend/ directory
Service: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
```

#### 3. Add Environment Variables (Railway Dashboard)
```bash
# Critical variables
DATABASE_URL=<Your Neon PostgreSQL URL>
BETTER_AUTH_SECRET=<43-char secret - SAME as frontend>
BETTER_AUTH_URL=https://your-backend.railway.app/api/auth
FRONTEND_URL=https://your-frontend.vercel.app
OPENAI_API_KEY=<Your OpenAI API key>

# Optional
PYTHONUNBUFFERED=1
PORT=8000
```

#### 4. Deploy Backend
```bash
# Railway deploys automatically from GitHub
# Wait for deployment to complete
# Copy your backend URL: https://your-backend-XXXXX.railway.app
```

#### 5. Test Backend Health
```bash
curl https://your-backend-XXXXX.railway.app/health
# Should return: {"status":"healthy"}
```

---

## Part 2: Deploy Frontend-Web to Vercel

### Steps:

#### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

#### 2. Deploy via Vercel Dashboard (Recommended)

**Go to**: https://vercel.com/new

**Import Git Repository**:
1. Click "Add New Project"
2. Import your GitHub repository
3. Vercel auto-detects Next.js

**Configure Build Settings**:
```
Framework Preset: Next.js
Root Directory: frontend-web
Build Command: npm run build
Output Directory: .next
Install Command: npm install --legacy-peer-deps
```

**Environment Variables** (Add in Vercel dashboard):
```bash
# Required
NEXT_PUBLIC_API_URL=https://your-backend-XXXXX.railway.app
BETTER_AUTH_SECRET=<SAME 43-char secret as backend>
BETTER_AUTH_URL=https://your-frontend-web.vercel.app/api/auth

# Optional
NODE_ENV=production
```

**Deploy**:
- Click "Deploy"
- Wait 2-3 minutes
- Copy deployment URL: `https://your-frontend-web.vercel.app`

#### 3. Test Frontend-Web
```
Visit: https://your-frontend-web.vercel.app
Expected: Landing page loads
Try: Sign up → Login → Dashboard
```

---

## Part 3: Deploy Frontend-Chatbot to Vercel

### Steps:

#### 1. Create New Vercel Project

**Go to**: https://vercel.com/new

**Configure Build Settings**:
```
Framework Preset: Next.js
Root Directory: frontend-chatbot
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**Environment Variables**:
```bash
# Required
NEXT_PUBLIC_API_URL=https://your-backend-XXXXX.railway.app
NEXT_PUBLIC_WEB_UI_URL=https://your-frontend-web.vercel.app

# Optional (for ChatKit production)
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=<Get from OpenAI after deployment>

# Feature flags
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_DEV_MODE=false
```

**Deploy**:
- Click "Deploy"
- Wait 2-3 minutes
- Copy URL: `https://your-chatbot.vercel.app`

#### 2. Configure OpenAI ChatKit Domain Allowlist

**Required for `/chatkit` route to work in production**:

1. **Get your Vercel URL**: `https://your-chatbot.vercel.app`

2. **Add to OpenAI Allowlist**:
   - Go to: https://platform.openai.com/settings/organization/security/domain-allowlist
   - Click "Add domain"
   - Enter: `https://your-chatbot.vercel.app`
   - Submit and copy the **domain key**

3. **Update Vercel Environment Variable**:
   - Go to Vercel project settings
   - Add variable: `NEXT_PUBLIC_OPENAI_DOMAIN_KEY=<your-domain-key>`
   - Redeploy: Vercel → Deployments → Redeploy

4. **Wait for Propagation**: 5-10 minutes

#### 3. Test Frontend-Chatbot
```
Visit: https://your-chatbot.vercel.app
Expected:
  ✅ Custom UI loads (/)
  ✅ ChatKit UI loads (/chatkit)
  ✅ Navigation between UIs works
  ✅ Login redirects to frontend-web
  ✅ After login, chatbot works
```

---

## Deployment Checklist

### ✅ Backend (Railway)
- [ ] Railway project created
- [ ] Environment variables configured
- [ ] Deployment successful
- [ ] Health endpoint returns 200
- [ ] OpenAI API connection works
- [ ] Database connection verified

### ✅ Frontend-Web (Vercel)
- [ ] Vercel project created
- [ ] Build settings configured (root: frontend-web)
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Landing page loads
- [ ] Sign up/login works
- [ ] Dashboard displays tasks
- [ ] Better Auth integration works

### ✅ Frontend-Chatbot (Vercel)
- [ ] Vercel project created
- [ ] Build settings configured (root: frontend-chatbot)
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Custom UI loads (/)
- [ ] ChatKit UI loads (/chatkit)
- [ ] Domain allowlist configured
- [ ] ChatKit domain key added
- [ ] Authentication flow works
- [ ] Chat messages send/receive

---

## Common Issues & Fixes

### Issue 1: Build Fails on Vercel
**Error**: `Cannot find module 'framer-motion'`

**Fix**:
```bash
# Update package.json build command
"build": "npm install --legacy-peer-deps && next build"
```

### Issue 2: Backend CORS Error
**Error**: `Access-Control-Allow-Origin header`

**Fix** (in backend `main.py`):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-web.vercel.app",
        "https://your-chatbot.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 3: ChatKit Not Working in Production
**Error**: Domain not allowlisted

**Fix**:
1. Verify domain added at: https://platform.openai.com/settings/organization/security/domain-allowlist
2. Ensure `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` set in Vercel
3. Wait 5-10 minutes for propagation
4. Hard refresh browser (Ctrl+Shift+R)

### Issue 4: Better Auth Session Issues
**Error**: `Session expired` or `Not authenticated`

**Fix**:
1. Ensure `BETTER_AUTH_SECRET` is **EXACTLY THE SAME** in:
   - Railway backend
   - Vercel frontend-web
2. Check `BETTER_AUTH_URL` points to correct frontend domain
3. Clear browser cookies and try again

---

## Environment Variables Summary

### Backend (Railway)
```bash
DATABASE_URL=postgresql://...@...neon.tech/...
BETTER_AUTH_SECRET=abc123xyz789... (43 chars)
BETTER_AUTH_URL=https://your-frontend.vercel.app/api/auth
FRONTEND_URL=https://your-frontend.vercel.app
OPENAI_API_KEY=sk-...
```

### Frontend-Web (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
BETTER_AUTH_SECRET=abc123xyz789... (SAME as backend)
BETTER_AUTH_URL=https://your-frontend.vercel.app/api/auth
```

### Frontend-Chatbot (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WEB_UI_URL=https://your-frontend-web.vercel.app
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-chatkit-domain-key
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_DEV_MODE=false
```

---

## Phase 4 vs Vercel - Key Differences

| Aspect | Vercel Deployment | Phase 4 (Kubernetes) |
|--------|-------------------|----------------------|
| **Purpose** | Production web hosting | Container orchestration |
| **Platform** | Vercel (frontends) + Railway (backend) | Docker + Kubernetes + Minikube |
| **Target** | General users via web browser | Kubernetes cluster (local/cloud) |
| **Requirements** | Git repo, environment variables | Dockerfiles, K8s manifests, Helm charts |
| **Complexity** | Low (automated) | High (manual K8s setup) |
| **Deadline** | Optional (for demo) | Required (Jan 4 - Phase 4 submission) |

**Can we do both?**
✅ **YES!** They are completely separate:
- Vercel: For hackathon demo URL (show judges working app)
- Phase 4: For Kubernetes deployment requirement (show K8s skills)

---

## Parallel Work Strategy (Recommended)

### Today (Jan 2) - Morning (2 hours):
```
🚀 Vercel Deployment Sprint
├─ Backend → Railway (30 min)
├─ Frontend-web → Vercel (30 min)
├─ Frontend-chatbot → Vercel (30 min)
└─ Testing & verification (30 min)
```

### Today (Jan 2) - Afternoon → Jan 4:
```
🎯 Phase 4 Sprint (Parallel)
├─ Create K8s manifests (backend, frontend-web, frontend-chatbot)
├─ Write Helm charts with values
├─ Setup Minikube locally
├─ Deploy to Minikube
├─ Integrate kubectl-ai and kagent
└─ Test and submit Phase 4
```

**Why parallel works:**
- Vercel deployment: 2 hours one-time setup
- Phase 4 work: 2-3 days continuous work
- No conflicts (different deployment targets)
- Vercel gives you demo URL immediately
- Phase 4 continues independently

---

## Next Steps

### 1. Deploy to Vercel (2 hours)
```bash
# I can help you with:
- Creating Vercel projects
- Configuring environment variables
- Debugging deployment issues
- Setting up ChatKit domain allowlist
```

### 2. Start Phase 4 in Parallel (Today afternoon)
```bash
# After Vercel deployment, we tackle:
- Kubernetes manifests
- Helm charts
- Minikube setup
- kubectl-ai integration
```

---

## Quick Commands

### Check Deployment Status
```bash
# Backend health
curl https://your-backend.railway.app/health

# Frontend-web
curl https://your-frontend-web.vercel.app

# Frontend-chatbot
curl https://your-chatbot.vercel.app
```

### Redeploy (if needed)
```bash
# Vercel CLI
cd frontend-web
vercel --prod

cd frontend-chatbot
vercel --prod
```

---

**Ready to deploy?** Let me know and I'll guide you through each step! 🚀

**Or start Phase 4?** We can do Vercel deployment in parallel while setting up Kubernetes! 💪
