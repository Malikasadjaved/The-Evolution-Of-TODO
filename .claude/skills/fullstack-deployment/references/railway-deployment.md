# Railway Backend Deployment Guide

Complete guide for deploying FastAPI backends to Railway.

## Prerequisites

- GitHub repository (public or private)
- Railway account (free tier available)
- Neon PostgreSQL database created

## Directory Structure

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

## Configuration Files

### backend/src/api/config.py

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

### backend/src/api/main.py (CORS)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings

app = FastAPI()

# Parse comma-separated frontend URLs
frontend_origins = [url.strip() for url in settings.frontend_url.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

## Deployment Methods

### Method 1: Railway Dashboard (Recommended)

**Step 1: Create Project**
1. Go to https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

**Step 2: Configure Service**
```
Service Name: backend
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
```

**Step 3: Environment Variables**
```bash
DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=<43-char-secret>
BETTER_AUTH_URL=https://your-frontend.vercel.app/api/auth
FRONTEND_URL=https://your-frontend.vercel.app
OPENAI_API_KEY=sk-...
PORT=8000
PYTHONUNBUFFERED=1
```

**Step 4: Deploy**
- Railway auto-deploys on Git push
- Monitor deployment logs
- Copy backend URL: `https://your-backend.railway.app`

**Step 5: Verify**
```bash
curl https://your-backend.railway.app/health
# Expected: {"status":"healthy"}
```

### Method 2: Railway CLI

**Installation**:
```bash
npm i -g @railway/cli
```

**Usage**:
```bash
# Login
railway login

# Link project (from backend directory)
cd backend
railway init

# Deploy
railway up

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set BETTER_AUTH_SECRET="..."
railway variables set FRONTEND_URL="https://frontend.vercel.app"

# View logs
railway logs
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | JWT signing (43 chars) | Generated via `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `BETTER_AUTH_URL` | Frontend auth endpoint | `https://frontend.vercel.app/api/auth` |
| `FRONTEND_URL` | CORS allowed origins | `https://frontend.vercel.app` or `https://app1.com,https://app2.com` |
| `OPENAI_API_KEY` | AI features | `sk-...` |
| `PORT` | Railway port | `8000` (set by Railway) |
| `PYTHONUNBUFFERED` | Real-time logs | `1` |

## Post-Deployment Configuration

### Update Frontend URL After Vercel Deployment

**Critical**: CORS won't work until `FRONTEND_URL` is updated.

1. Deploy Vercel frontend first (or use placeholder)
2. Copy Vercel deployment URL
3. Update Railway `FRONTEND_URL`:
   ```bash
   railway variables set FRONTEND_URL="https://your-frontend.vercel.app"
   ```
4. **REDEPLOY Railway service** (CORS requires restart):
   ```bash
   railway up
   ```

### Multiple Frontend Origins

For multiple frontends (e.g., web + chatbot):
```bash
railway variables set FRONTEND_URL="https://web.vercel.app,https://chatbot.vercel.app"
```

## Verification Commands

### Health Check
```bash
curl https://backend.railway.app/health
# Expected: {"status":"healthy"}
```

### CORS Test
```bash
curl -I -X OPTIONS https://backend.railway.app/api/user/tasks \
  -H "Origin: https://frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET"

# Expected headers:
# Access-Control-Allow-Origin: https://frontend.vercel.app
# Access-Control-Allow-Credentials: true
```

### API Docs
```bash
# Visit in browser
https://backend.railway.app/docs
```

## Troubleshooting

### Issue 1: CORS Not Working After Environment Change

**Symptom**: Updated `FRONTEND_URL` but still getting CORS errors

**Cause**: Railway doesn't restart automatically on environment changes

**Fix**:
```bash
railway up  # Force redeploy
```

### Issue 2: Database Connection Failed

**Symptom**: `connection refused` or `SSL required`

**Fix**: Ensure `?sslmode=require` in `DATABASE_URL`:
```bash
postgresql://user:pass@host.neon.tech/db?sslmode=require
```

### Issue 3: Port Binding Error

**Symptom**: `Address already in use`

**Fix**: Use Railway's `$PORT` environment variable:
```python
# main.py
import os
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
```

## Railway CLI Commands

```bash
# Deploy
railway up

# Environment variables
railway variables list
railway variables set KEY=value
railway variables rm KEY

# Logs
railway logs
railway logs --follow

# Restart
railway restart

# Status
railway status

# Connect to database
railway connect <service-name>
```

## Optional: Railway.toml

For advanced configuration:

```toml
[build]
builder = "python/python"

[deploy]
startCommand = "uvicorn src.api.main:app --host 0.0.0.0 --port $PORT"
watchPatterns = ["backend/**"]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[vars]
PYTHONUNBUFFERED = "1"
PORT = "8000"
```

Place in `backend/Railway.toml`.
