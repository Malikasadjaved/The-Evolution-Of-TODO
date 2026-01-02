# ✅ Railway Backend Deployment Checklist

**Target**: Deploy FastAPI backend to Railway
**Time**: ~30 minutes
**Result**: Live backend URL for frontend to connect

---

## Step 1: Create Railway Account & Project

### 1.1 Sign Up
🌐 **Go to**: https://railway.app
- Click "Login with GitHub"
- Authorize Railway to access your repository
- ✅ **Account created**

### 1.2 Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose: `The-Evolution-Of-TODO` (your repository)
- ✅ **Project created**

---

## Step 2: Configure Backend Service

### 2.1 Add Service
- Railway will auto-detect your repository
- Click "Add a service"
- Select "GitHub Repo"
- Choose root directory (Railway will detect `backend/`)

### 2.2 Root Directory
**Important**: Railway needs to know where your backend code is

In Railway dashboard:
- Go to Settings → Root Directory
- Set: `backend`
- ✅ **Root directory configured**

### 2.3 Build Configuration
Railway should auto-detect Python. Verify:
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`

If not auto-detected, add manually in Settings → Deploy

---

## Step 3: Environment Variables (CRITICAL)

Click on your service → Variables tab → Add all these:

### Required Variables:

```bash
# 1. Database Connection (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_zetUmFOTM5J4@ep-fancy-resonance-ad38zyof-pooler.c-2.us-east-1.aws.neon.tech/todo_db?sslmode=require&channel_binding=require

# 2. Better Auth Secret (SAME as frontend - 43 characters)
BETTER_AUTH_SECRET=DicJ0mbjX2VmhOMYzT2vAEn5f5JPEwPVZgEIB6Cy07A

# 3. Better Auth URL (UPDATE after frontend deployment)
# For now, use placeholder:
BETTER_AUTH_URL=https://placeholder.vercel.app/api/auth

# 4. Frontend URL (UPDATE after frontend deployment)
# For now, use placeholder:
FRONTEND_URL=https://placeholder.vercel.app

# 5. OpenAI API Key (Get from: https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE

# 6. Server Configuration
HOST=0.0.0.0
PORT=$PORT
DEBUG=False

# 7. Python Configuration
PYTHONUNBUFFERED=1
```

✅ **All variables added**

---

## Step 4: Deploy Backend

### 4.1 Trigger Deployment
- Railway auto-deploys on git push
- Or click "Deploy" button in dashboard
- Wait 2-3 minutes for build

### 4.2 Monitor Deployment
Watch the logs:
- Click "View Logs" in Railway dashboard
- Look for: `Uvicorn running on http://0.0.0.0:XXXX`
- ✅ **Deployment successful**

### 4.3 Get Backend URL
- Railway generates a public URL
- Look for: `https://your-backend-production.up.railway.app`
- Copy this URL (you'll need it for frontend)
- ✅ **Backend URL obtained**

---

## Step 5: Test Backend

### 5.1 Health Check
```bash
# Replace with your actual Railway URL
curl https://your-backend-production.up.railway.app/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-02T..."
}
```

✅ **Backend is live!**

### 5.2 API Documentation
Visit in browser:
```
https://your-backend-production.up.railway.app/docs
```

Should see Swagger UI with all endpoints
✅ **API docs accessible**

---

## Step 6: Update Frontend URLs (Later)

**After frontend deployment**, come back and update:

1. Go to Railway → Your Service → Variables
2. Update these:
   - `BETTER_AUTH_URL` → `https://your-frontend.vercel.app/api/auth`
   - `FRONTEND_URL` → `https://your-frontend.vercel.app`
3. Click "Redeploy" to apply changes

---

## Troubleshooting

### Issue 1: Build Fails
**Error**: `Could not find a version that satisfies the requirement`

**Fix**:
```bash
# Update requirements.txt locally
pip freeze > backend/requirements.txt
git add backend/requirements.txt
git commit -m "Update requirements.txt"
git push
```

### Issue 2: Health Endpoint Returns 503
**Error**: `{"detail":"Database connection failed"}`

**Fix**:
- Verify `DATABASE_URL` is correct in Railway variables
- Check Neon database is running at: https://console.neon.tech

### Issue 3: CORS Errors
**Error**: `Access-Control-Allow-Origin`

**Fix**: Will be resolved after updating `FRONTEND_URL` in Step 6

---

## Environment Variables Summary

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your Neon URL | Don't change |
| `BETTER_AUTH_SECRET` | DicJ0mbjX2VmhOMYzT2vAEn5f5JPEwPVZgEIB6Cy07A | SAME as frontend |
| `BETTER_AUTH_URL` | Update after frontend deploy | Placeholder for now |
| `FRONTEND_URL` | Update after frontend deploy | Placeholder for now |
| `OPENAI_API_KEY` | Your OpenAI key | From your .env |
| `HOST` | 0.0.0.0 | Required |
| `PORT` | $PORT | Railway variable |
| `DEBUG` | False | Production mode |
| `PYTHONUNBUFFERED` | 1 | Better logging |

---

## Success Checklist

- [ ] Railway account created
- [ ] Project created from GitHub
- [ ] Backend service added
- [ ] Root directory set to `backend`
- [ ] All 9 environment variables added
- [ ] Deployment triggered
- [ ] Deployment successful (check logs)
- [ ] Backend URL obtained
- [ ] Health endpoint tested (200 OK)
- [ ] API docs accessible

**Once all checked**: ✅ **Backend deployment complete!**

---

## Next Step

After backend is live, deploy frontends to Vercel:
1. Frontend-web (Phase 2)
2. Frontend-chatbot (Phase 3)

Both will use your Railway backend URL!

---

**Estimated Time**: 30 minutes
**Status**: Ready to begin
**Your Backend URL**: Will be `https://the-evolution-of-todo-production.up.railway.app`
