---
id: 010
title: Fullstack Vercel Deployment with CORS Configuration
stage: general
date: 2026-01-02
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: main
user: malikasadjaved
command: deploy frontend to vercel
labels: ["deployment", "vercel", "frontend", "cors", "fullstack"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - frontend-web/app/dashboard/page.tsx
 - frontend-web/vercel.json
 - frontend-web/.env.local
 - skills/001-fullstack-deployment-railway-vercel.skill.md
 - .spec-kit/commands/sp.deploy-fullstack.md
tests:
---

## Prompt

Deploy the frontend-web application to Vercel. Backend is already deployed on Railway at https://the-evolution-of-todo-production-b8f4.up.railway.app

The initial build failed with:
```
Type error: Type 'string' is not assignable to type 'SortField | undefined'.
at line 639 in app/dashboard/page.tsx
```

After fixing the TypeScript error, the user connected the GitHub repository to Vercel and encountered issues with Root Directory configuration. Used Vercel CLI to:
1. Login and link the project
2. Set environment variables (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_BETTER_AUTH_URL)
3. Deploy to production

Deployment succeeded but CORS errors appeared in browser:
```
Access to fetch at 'https://the-evolution-of-todo-production-b8f4.up.railway.app/api/...'
from origin 'https://frontend-web-gules.vercel.app' has been blocked by CORS policy
```

## Response snapshot

**Phase 1: TypeScript Fix**
- Fixed sortField initialization in dashboard/page.tsx:65
- Changed from `useState<SortField>('')` to `useState<SortField>('created_at')`
- Empty string '' is not a valid SortField type even though union includes it

**Phase 2: Vercel CLI Deployment**
- User ran `vercel login` and authenticated
- Linked project: `vercel link --yes --project frontend-web`
- Initial deployment failed with CORS error on Better Auth
- Error: `NEXT_PUBLIC_BETTER_AUTH_URL must be a valid URL`

**Phase 3: Environment Variable Fixes**
- Removed old invalid variable: `vercel env rm NEXT_PUBLIC_BETTER_AUTH_URL production --yes`
- Added correct URL: `echo "https://frontend-web-gules.vercel.app/api/auth" | vercel env add NEXT_PUBLIC_BETTER_AUTH_URL production`
- Redeployed with `vercel --prod --yes --force`
- Build succeeded, deployment completed

**Phase 4: CORS Error Resolution**
- CORS error from Railway backend - origin not allowed
- Root cause: Railway FRONTEND_URL environment variable still pointed to localhost
- Solution: User updated FRONTEND_URL on Railway dashboard to `https://frontend-web-gules.vercel.app`
- Required Railway redeploy to apply CORS changes

**Phase 5: Skill Document Creation**
Created comprehensive skill document at:
- `skills/001-fullstack-deployment-railway-vercel.skill.md` (710 lines)
- `.spec-kit/commands/sp.deploy-fullstack.md`

**Final URLs:**
- Frontend: https://frontend-web-gules.vercel.app
- Backend: https://the-evolution-of-todo-production-b8f4.up.railway.app

## Outcome

- ✅ Impact: Successfully deployed fullstack application - FastAPI backend on Railway, Next.js frontend on Vercel
- 🧪 Tests: Manual verification - login works, dashboard loads, tasks can be created
- 📁 Files: Created deployment skill document, slash command, fixed TypeScript error
- 🔁 Next prompts: Deploy frontend-chatbot to Vercel, configure OpenAI ChatKit domain allowlist
- 🧠 Reflection: Key learnings captured - platform selection (Vercel for Node.js, Railway for Python), CORS requires server restart, monorepo root directory configuration

## Evaluation notes (flywheel)

- Failure modes observed:
  1. TypeScript build error due to invalid state initialization type
  2. CORS preflight failure due to Railway FRONTEND_URL not matching Vercel domain
  3. Root Directory path confusion when deploying monorepo from CLI
- Graders run and results (PASS/FAIL): Deployment PASS, manual functional tests PASS
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Deploy frontend-chatbot app following same pattern
