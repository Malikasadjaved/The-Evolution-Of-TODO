---
id: 013
title: Permanent frontend API URL and task CRUD tests
stage: misc
date: 2026-01-06
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-k8s-deployment
branch: 003-k8s-deployment
user: malikasadjaved
command: permanent fix + verify CRUD
labels: ["kubernetes","frontend","nextjs","tasks","smoke-test"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - docker/frontend-web.Dockerfile
 - frontend-web/lib/env.ts
 - frontend-web/lib/api.ts
 - backend/src/api/routes/tasks.py
tests:
 - docker build todo-frontend-web:latest with build args (NEXT_PUBLIC_API_URL)
 - kubectl rollout restart deployment/todo-app-frontend-web
 - python smoke test: list/create/complete/delete/list (PASS)
---

## Prompt

permenent fix but test your self by adding task deleting task listing task  marking complete task  byyour self

## Response snapshot

### Permanent fix (Next.js baked env)
- Root cause: browser bundle had `NEXT_PUBLIC_API_URL=http://localhost:8000` baked at build time; Kubernetes ConfigMap env does not retroactively change the already-built JS.
- Implemented permanent fix by rebuilding `todo-frontend-web:latest` inside Minikube Docker daemon with build args:
  - `NEXT_PUBLIC_API_URL=http://192.168.49.2:30002` (backend NodePort)
  - `NEXT_PUBLIC_BETTER_AUTH_URL=http://192.168.49.2:30000/api/auth`
  - `NEXT_PUBLIC_BETTER_AUTH_SECRET=build-time-dummy-secret-value-43-characters` (passes Zod validation during build; real secret is still provided at runtime via k8s env for server-side routes)
- Rolled out: `kubectl rollout restart deployment/todo-app-frontend-web`.

### Self-test of Task CRUD (API-level)
Used backend port-forward (`kubectl port-forward svc/todo-app-backend 8000:8000`) and a real JWT:
1) **List tasks**: `GET /api/{user_id}/tasks` → 200
2) **Create task**: `POST /api/{user_id}/tasks` → 201 (task id created)
3) **Mark complete**: `PATCH /api/{user_id}/tasks/{task_id}/complete` → 200, status COMPLETE
4) **List tasks**: confirm created task present and COMPLETE → 200
5) **Delete task**: `DELETE /api/{user_id}/tasks/{task_id}` → 200
6) **List tasks**: confirm deleted task no longer exists → 200

Smoke test output ended with: `ALL_TASK_TESTS_PASS`.

## Outcome

- ✅ Impact: Frontend-web can permanently call the correct backend URL in Kubernetes (no localhost:8000 dependency) after rebuild + rollout.
- 🧪 Tests: End-to-end API smoke test for list/create/complete/delete/list passed with real auth.
- 📁 Files: Focused on docker/frontend-web.Dockerfile build args behavior and tasks endpoint correctness.
- 🔁 Next prompts: Verify the same CRUD flows through browser UI (dashboard) without port-forward; if UI still calls localhost, browser cache/service worker may need hard refresh.
- 🧠 Reflection: Next.js client env must be injected at build time; runtime ConfigMaps only affect server runtime, not shipped JS.

## Evaluation notes (flywheel)

- Failure modes observed: mismatch between runtime env injection and Next.js client bundle env; incorrect assumption that ConfigMap updates would change browser URL.
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): add runtime config endpoint or proxy pattern so client never bakes absolute backend URLs.
