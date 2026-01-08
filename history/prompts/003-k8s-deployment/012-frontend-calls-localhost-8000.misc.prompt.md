---
id: 012
title: Diagnose frontend localhost 8000 connection refused
stage: misc
date: 2026-01-06
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-k8s-deployment
branch: 003-k8s-deployment
user: malikasadjaved
command: debug browser ERR_CONNECTION_REFUSED
labels: ["kubernetes","frontend","config","networking"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - frontend-web/lib/api.ts
 - frontend-web/lib/env.ts
 - frontend-web/app/api/auth/[...all]/route.ts
 - docker/frontend-web.Dockerfile
 - helm-charts/todo-app/templates/configmap.yaml
 - helm-charts/todo-app/values-dev.yaml
tests:
 - curl GET http://127.0.0.1:8000/health (200) via kubectl port-forward
---

## Prompt

favicon.ico:1  GET http://127.0.0.1:59284/favicon.ico 404 (Not Found)

bc62969ad0ddb371.js:2  GET http://localhost:8000/api/fe671405-dbfa-47b1-ba23-7a27f33d1cc5/tasks?sort=created_at&order=asc net::ERR_CONNECTION_REFUSED

tg @ bc62969ad0ddb371.js:2

m @ 7450f98995503f30.js:1

queryFn @ 7450f98995503f30.js:1

...

bc62969ad0ddb371.js:2  POST http://localhost:8000/api/fe671405-dbfa-47b1-ba23-7a27f33d1cc5/tasks net::ERR_CONNECTION_REFUSED

...

bc62969ad0ddb371.js:2  POST http://localhost:8000/api/fe671405-dbfa-47b1-ba23-7a27f33d1cc5/chat net::ERR_CONNECTION_REFUSED

...

## Response snapshot

- Observed browser is attempting to call `http://localhost:8000/...` and failing with `ERR_CONNECTION_REFUSED`.
- Confirmed Kubernetes backend service exists as NodePort `todo-app-backend` on port `8000:30002` and frontend web is NodePort `3000:30000`.
- Confirmed frontend-web ConfigMap includes `NEXT_PUBLIC_API_URL: http://192.168.49.2:30002`, but the browser bundle still uses `localhost:8000`.
- Root cause: Next.js `NEXT_PUBLIC_*` variables are baked into the client bundle at build time; setting env vars via Kubernetes ConfigMap at runtime does not update already-built JS.
- Immediate workaround: `kubectl port-forward svc/todo-app-backend 8000:8000` to make `localhost:8000` reachable.
- Longer-term fix: rebuild `todo-frontend-web:latest` with Docker build args setting `NEXT_PUBLIC_API_URL` to the external reachable backend URL and restart the frontend deployment.

## Outcome

- ✅ Impact: Identified cause of frontend networking errors and provided immediate workaround + permanent fix direction.
- 🧪 Tests: Verified backend health responds through localhost after port-forward.
- 📁 Files: Investigation across API client/env, Dockerfile build args, Helm configmap and values.
- 🔁 Next prompts: Rebuild frontend-web image with correct build args; verify browser calls backend without port-forward.
- 🧠 Reflection: In Next.js, runtime k8s env vars do not automatically change client-side API base URLs; need build-time injection or runtime-config pattern.

## Evaluation notes (flywheel)

- Failure modes observed: Misalignment between K8s runtime ConfigMap env and Next.js build-time env causing baked `localhost` URL in browser.
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Add a runtime `/api/config` endpoint or middleware-based proxy to avoid baking base URLs into the client bundle.
