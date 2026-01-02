# Deploy Full-Stack App: Next.js (Vercel) + FastAPI (Railway)

Use this command when deploying a monorepo with Next.js frontend and FastAPI backend.

## Command Pattern
```
/sp.deploy-fullstack
```

## Prerequisites
- GitHub repository connected
- Backend code in `backend/` directory
- Frontend code in `frontend-web/` directory
- Neon PostgreSQL database URL available
- OpenAI API key (optional, for AI features)

## Execution Steps

### Phase 1: Deploy Backend to Railway
```bash
# 1. Create Railway project from GitHub
# Dashboard: https://railway.app/new → Deploy from GitHub

# 2. Set environment variables
# DATABASE_URL=postgresql://...
# BETTER_AUTH_SECRET=<43-char-secret>
# BETTER_AUTH_URL=https://<vercel-frontend>.vercel.app/api/auth
# FRONTEND_URL=https://<vercel-frontend>.vercel.app
# OPENAI_API_KEY=sk-...
# PORT=8000
```

### Phase 2: Deploy Frontend to Vercel
```bash
# 1. Login
vercel login

# 2. Deploy from frontend-web directory
cd frontend-web
vercel --prod --yes

# 3. Set environment variables
echo "https://backend.railway.app" | vercel env add NEXT_PUBLIC_API_URL production
echo "https://frontend.vercel.app/api/auth" | vercel env add NEXT_PUBLIC_BETTER_AUTH_URL production
```

### Phase 3: Configure CORS
1. Update Railway `FRONTEND_URL` to match Vercel frontend URL
2. Redeploy Railway service
3. Verify CORS works

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| TypeScript type mismatch | Initialize state with valid type value |
| CORS blocked | Redeploy Railway after FRONTEND_URL change |
| Peer dependency warnings | Use `npm install --legacy-peer-deps` |

## References
- Skill Document: `skills/001-fullstack-deployment-railway-vercel.skill.md`
- Full deployment guide with error reference
