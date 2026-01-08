# Comprehensive Troubleshooting Matrix

Complete diagnostic and resolution guide for Kubernetes full-stack deployments.

---

## Quick Diagnosis Flowchart

```
Issue Detected
     ↓
1. Check pod status: kubectl get pods -n <namespace>
     ↓
   ┌─────────────┬──────────────┬──────────────┐
   Pending       Running       CrashLoopBackOff
   ↓             ↓              ↓
   See #1-#4     See #5-#7      See #8-#10
```

---

## Build-Time Issues

### #1: Docker Build - Dockerfile Not Found

**Symptoms:**
```
ERROR: failed to solve: failed to read dockerfile: open Dockerfile.backend: no such file or directory
```

**Root Cause:**
- Dockerfile path incorrect
- Building from wrong directory
- Dockerfile in subdirectory not specified

**Diagnosis:**
```bash
# Find all Dockerfiles
find . -name "Dockerfile" -type f

# Check current directory
pwd
ls -la | grep Dockerfile
```

**Resolution:**
```bash
# ✅ Option 1: Build from component directory
cd backend
docker build -t app-backend:latest .
cd ..

# ✅ Option 2: Use -f flag with correct path
docker build -t app-backend:latest -f backend/Dockerfile backend/

# ❌ Wrong: Incorrect path
docker build -f docker/Dockerfile.backend .
```

**Prevention:**
- Always verify Dockerfile location before building
- Use relative paths from monorepo root
- Document build commands in README

---

### #2: Frontend Build - Environment Validation Failed

**Symptoms:**
```
❌ Environment validation failed:
- NEXT_PUBLIC_API_URL: NEXT_PUBLIC_API_URL must be a valid URL
- NEXT_PUBLIC_BETTER_AUTH_SECRET: Required
- NEXT_PUBLIC_BETTER_AUTH_URL: Required

Error: next.config.ts failed to load.
```

**Root Cause:**
- Next.js requires `NEXT_PUBLIC_*` variables at **build time**
- Dockerfile only sets variables in runtime stage
- `next.config.ts` validation runs during `npm run build`

**Diagnosis:**
```bash
# Read Dockerfile to check for ARG/ENV declarations
grep -A 5 "npm run build" frontend/Dockerfile

# If no ARG/ENV before this line → Problem confirmed
```

**Resolution:**

**Step 1:** Edit `frontend/Dockerfile` - Add BEFORE `RUN npm run build`:
```dockerfile
# Build arguments (can be overridden with --build-arg)
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_BETTER_AUTH_SECRET=default-secret-change-me
ARG NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth

# Convert to environment variables (available during build)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BETTER_AUTH_SECRET=${NEXT_PUBLIC_BETTER_AUTH_SECRET}
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL}

# Now build will succeed
RUN npm run build
```

**Step 2:** Rebuild image:
```bash
cd frontend
docker build -t app-frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET=your-secret-here \
  .
```

**Prevention:**
- Always declare `NEXT_PUBLIC_*` as ARG+ENV in Dockerfile
- Provide default values for local development
- Test build locally before pushing to Kubernetes

**Reference:** See `dockerfile-patterns.md#nextjs-env-vars`

---

### #3: Docker Space Consumption (60GB+)

**Symptoms:**
```bash
$ docker system df
TYPE            TOTAL     ACTIVE    SIZE
Images          25        5         60.2GB
Containers      10        2         15.3GB
```

**Root Cause:**
- Building images on host machine
- Then loading into Minikube
- Docker copies (not moves) images → duplicate storage

**Diagnosis:**
```bash
# Check host Docker images
docker images | grep <project>

# Check Minikube Docker images
eval $(minikube docker-env)
docker images | grep <project>

# If both show same images → Duplication confirmed
```

**Resolution:**

**Build directly in Minikube (recommended):**
```bash
# Point shell to Minikube Docker daemon
eval $(minikube docker-env)

# Verify context switched
echo $DOCKER_HOST  # Should show: tcp://192.168.x.x:2376

# Build images (stored only in Minikube)
docker build -t app-backend:latest ./backend
docker build -t app-frontend:latest ./frontend

# Images immediately available to Kubernetes
kubectl apply -f k8s/deployment.yaml
```

**Storage Savings:**
- Before: Host (30GB) + Minikube (30GB) = 60GB
- After: Minikube only (30GB)
- **Savings: 50%**

**Prevention:**
- Always use `eval $(minikube docker-env)` before building
- Add to deployment script/documentation
- Clean host Docker regularly: `docker system prune -a`

---

## Deployment Issues

### #4: Pods Stuck in Pending

**Symptoms:**
```bash
$ kubectl get pods -n app
NAME                READY   STATUS    RESTARTS   AGE
backend-xxx         0/1     Pending   0          2m
frontend-xxx        0/1     Pending   0          2m
```

**Root Causes & Resolutions:**

#### Cause A: Insufficient Resources

**Diagnosis:**
```bash
kubectl describe pod -n app backend-xxx | grep -A 10 Events

# Look for:
# Warning  FailedScheduling  ... Insufficient memory
# Warning  FailedScheduling  ... Insufficient cpu
```

**Resolution:**
```bash
# Stop Minikube
minikube stop

# Start with more resources
minikube start --driver=docker --memory=8192 --cpus=4

# Redeploy
kubectl delete namespace app
kubectl create namespace app
kubectl apply -f k8s/deployment.yaml
```

#### Cause B: Image Pull Error

**Diagnosis:**
```bash
kubectl describe pod -n app backend-xxx | grep -A 10 Events

# Look for:
# Warning  Failed  ... Failed to pull image "app-backend:latest"
# Warning  Failed  ... rpc error: ... not found
```

**Resolution:**
```bash
# Verify images exist in Minikube
eval $(minikube docker-env)
docker images | grep app-

# If missing, rebuild:
docker build -t app-backend:latest ./backend
docker build -t app-frontend:latest ./frontend

# Ensure imagePullPolicy: Never in deployment
kubectl apply -f k8s/deployment.yaml
```

#### Cause C: Node Not Ready

**Diagnosis:**
```bash
kubectl get nodes

# If shows NotReady → Minikube issue
```

**Resolution:**
```bash
minikube stop
minikube start --driver=docker
kubectl get nodes  # Should show Ready
```

---

### #5: Frontend 503 Error - Service Unavailable

**Symptoms:**
```javascript
// Browser console
POST http://localhost:3000/api/auth/sign-up 503 (Service Unavailable)

// Frontend API route error
{
  "error": "Authentication service unavailable",
  "details": "connect ECONNREFUSED 127.0.0.1:8000"
}
```

**Root Cause:**
- Frontend Next.js server (inside pod) trying to call `localhost:8000`
- From inside pod, `localhost` refers to pod itself, not backend service
- Backend is in different pod → unreachable via localhost

**Diagnosis:**
```bash
# Check if API_URL is set in frontend pod
kubectl exec -n app deployment/frontend -- env | grep -E "(API_URL|NEXT_PUBLIC)"

# Expected:
# NEXT_PUBLIC_API_URL=http://localhost:8000  (for browser)
# API_URL=http://backend-service:8000  (for server-side)

# If API_URL missing or equals NEXT_PUBLIC_API_URL → Problem!
```

**Resolution:**

**Step 1:** Add `API_URL` to frontend deployment:
```yaml
# k8s/deployment.yaml - Frontend container env
env:
- name: NEXT_PUBLIC_API_URL
  value: "http://localhost:8000"  # Browser requests (via port-forward)
- name: API_URL
  value: "http://backend-service:8000"  # ← ADD THIS! Server-side (K8s DNS)
```

**Step 2:** Update frontend code to use `API_URL` for server-side requests:
```typescript
// app/api/auth/[...all]/route.ts
import { env } from '@/lib/env'

async function handleAuthRequest(request) {
  const backendUrl = `${env.API_URL}/api/auth${path}`  // Uses API_URL
  const response = await fetch(backendUrl, { method, body })
  return response
}
```

**Step 3:** Update env schema to default API_URL:
```typescript
// lib/env.ts
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  API_URL: z.string().url()
    .optional()
    .default(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'),
})
```

**Step 4:** Apply and restart:
```bash
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/frontend -n app

# Restart port-forward for new pod
kubectl port-forward -n app svc/frontend 3000:3000
```

**Verification:**
```bash
# Check env vars in new pod
kubectl exec -n app deployment/frontend -- env | grep API_URL

# Should show:
# API_URL=http://backend-service:8000
```

**Prevention:**
- Always use dual API URL strategy for full-stack apps
- Document in deployment template
- Add validation in CI/CD pipeline

**Reference:** See `SKILL.md#dual-api-url-strategy`

---

### #6: Connection Refused - Port-Forward Inactive

**Symptoms:**
```bash
$ curl http://localhost:8000/health
curl: (7) Failed to connect to localhost port 8000: Connection refused
```

**Root Cause:**
- Port-forward not running
- Port-forward disconnected (network timeout)
- Terminal window closed

**Diagnosis:**
```bash
# Check port-forward processes
ps aux | grep "port-forward"

# If no results → Port-forward not running

# Check if pods are running
kubectl get pods -n app
# If pods show 1/1 Running → Issue is port-forward only
```

**Resolution:**

**Quick Fix:**
```bash
# Restart port-forwarding
kubectl port-forward -n app svc/backend 8000:8000 &
kubectl port-forward -n app svc/frontend 3000:3000 &
```

**Persistent Fix (use screen/tmux):**
```bash
# Install screen (if not available)
sudo apt-get install screen  # Ubuntu/Debian
brew install screen  # macOS

# Create session
screen -S port-forward

# Run port-forward script
./scripts/port-forward.sh

# Detach: Press Ctrl+A, then D

# Reattach later:
screen -r port-forward

# List sessions:
screen -ls
```

**Automated Script Fix:**
```bash
chmod +x scripts/port-forward.sh
./scripts/port-forward.sh  # Auto-discovers pods and ports
```

**Prevention:**
- Use automated script with health checks
- Run in persistent session (screen/tmux)
- Add to startup scripts/cron
- Monitor with systemd service (production)

---

### #7: JWT 401 Unauthorized

**Symptoms:**
```bash
$ curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
{"detail":"Unauthorized"}
```

**Root Causes & Resolutions:**

#### Cause A: Token Expired

**Diagnosis:**
```bash
# Decode JWT to check expiration
echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null

# Expected output:
{
  "user_id": "...",
  "email": "...",
  "exp": 1767814572,  # Check if this is in the past
  "iat": 1767728172
}

# Convert exp to human-readable
date -d @1767814572  # Linux
date -r 1767814572   # macOS
```

**Resolution:**
```bash
# Re-login to get new token
curl -X POST http://localhost:8000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  > signin-response.json

# Extract new token
TOKEN=$(cat signin-response.json | jq -r '.token')
```

#### Cause B: Missing "Bearer" Prefix

**Diagnosis:**
```bash
# Check Authorization header format
echo "Authorization: $TOKEN"  # ❌ Wrong

# Should be:
echo "Authorization: Bearer $TOKEN"  # ✅ Correct
```

**Resolution:**
```bash
# ✅ Correct format
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN"

# ❌ Wrong formats
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: $TOKEN"  # Missing Bearer

curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: bearer $TOKEN"  # Lowercase bearer (some backends reject)
```

#### Cause C: Token Not Set

**Diagnosis:**
```bash
echo $TOKEN
# If empty → Token not set
```

**Resolution:**
```bash
# Extract from signin response
TOKEN=$(cat signin-response.json | jq -r '.token')

# Verify
echo $TOKEN  # Should show: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### #8: Pods CrashLoopBackOff

**Symptoms:**
```bash
$ kubectl get pods -n app
NAME                READY   STATUS             RESTARTS   AGE
backend-xxx         0/1     CrashLoopBackOff   5          5m
```

**Diagnosis Steps:**

**Step 1: Check Logs**
```bash
kubectl logs -n app backend-xxx --tail=100

# Common errors and their causes:
# "connection to server at ... failed" → Database connection issue
# "ModuleNotFoundError: No module named 'fastapi'" → Dependencies missing
# "KeyError: 'DATABASE_URL'" → Environment variable missing
# "Address already in use" → Port conflict
```

**Step 2: Check Pod Events**
```bash
kubectl describe pod -n app backend-xxx | grep -A 20 Events

# Look for warning/error events
```

**Resolution by Error Type:**

#### Error A: Database Connection Failed

**Log Example:**
```
sqlalchemy.exc.OperationalError: connection to server at "ep-...neon.tech" failed
```

**Resolution:**
```bash
# 1. Verify DATABASE_URL secret
kubectl get secret -n app app-secrets -o jsonpath='{.data.database-url}' | base64 -d
echo ""

# 2. Test connection manually
kubectl exec -n app deployment/backend -- \
  python -c "import psycopg2; psycopg2.connect('postgresql://...')"

# 3. If wrong, recreate secret
kubectl delete secret -n app app-secrets
kubectl create secret generic app-secrets \
  --from-literal=database-url='postgresql://correct-url-here'

# 4. Restart deployment
kubectl rollout restart deployment -n app backend
```

#### Error B: Missing Dependencies

**Log Example:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Resolution:**
```bash
# Rebuild with fresh install
eval $(minikube docker-env)
docker build --no-cache -t app-backend:latest ./backend

# Restart deployment
kubectl rollout restart deployment -n app backend
```

#### Error C: Missing Environment Variable

**Log Example:**
```
KeyError: 'DATABASE_URL'
```

**Resolution:**
```bash
# Check if secret exists
kubectl get secret -n app app-secrets -o yaml

# Check if deployment references secret
kubectl get deployment -n app backend -o yaml | grep -A 10 secretKeyRef

# If missing, update deployment:
kubectl apply -f k8s/deployment.yaml
```

---

## Network Issues

### #9: Pod Cannot Reach External Service

**Symptoms:**
```
requests.exceptions.ConnectionError: HTTPSConnectionPool(host='api.external.com', port=443)
```

**Diagnosis:**
```bash
# Test external connectivity from pod
kubectl exec -n app deployment/backend -- \
  curl -I https://api.external.com

# If fails → Network policy or egress issue
```

**Resolution:**
```bash
# Check network policies
kubectl get networkpolicies -n app

# If restrictive policy exists, add egress rule:
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-external
  namespace: app
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
EOF
```

---

### #10: Frontend Cannot Reach Backend via Browser

**Symptoms:**
```javascript
// Browser console
GET http://localhost:8000/api/tasks net::ERR_CONNECTION_REFUSED
```

**Root Cause:**
- Port-forward not active
- CORS not configured
- Browser using wrong URL

**Diagnosis:**
```bash
# 1. Check port-forward
curl http://localhost:8000/health
# If fails → Port-forward issue (see #6)

# 2. Check CORS headers
curl -I http://localhost:8000/api/tasks \
  -H "Origin: http://localhost:3000"

# Should include:
# Access-Control-Allow-Origin: http://localhost:3000
```

**Resolution:**

**CORS Fix (FastAPI):**
```python
# backend/src/api/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Port-Forward Fix:**
```bash
kubectl port-forward -n app svc/backend 8000:8000 &
```

---

## Common Resolution Commands

```bash
# Restart deployment
kubectl rollout restart deployment -n <namespace> <deployment-name>

# Check rollout status
kubectl rollout status deployment -n <namespace> <deployment-name>

# Rollback to previous version
kubectl rollout undo deployment -n <namespace> <deployment-name>

# Scale deployment
kubectl scale deployment -n <namespace> <deployment-name> --replicas=3

# Update image
kubectl set image deployment -n <namespace> <deployment-name> \
  container-name=new-image:tag

# Delete and recreate pod
kubectl delete pod -n <namespace> <pod-name>

# Exec into pod
kubectl exec -n <namespace> -it deployment/<deployment-name> -- /bin/sh

# View pod logs (follow)
kubectl logs -n <namespace> -f deployment/<deployment-name>

# Describe resource
kubectl describe pod/deployment/service -n <namespace> <resource-name>
```

---

## Diagnostic Checklist

When facing issues, run this checklist:

### Pod-Level
- [ ] Pod status: `kubectl get pods -n <namespace>`
- [ ] Pod logs: `kubectl logs -n <namespace> <pod-name>`
- [ ] Pod events: `kubectl describe pod -n <namespace> <pod-name>`
- [ ] Pod env vars: `kubectl exec -n <namespace> deployment/<name> -- env`

### Service-Level
- [ ] Service exists: `kubectl get services -n <namespace>`
- [ ] Service endpoints: `kubectl get endpoints -n <namespace>`
- [ ] Service port-forward: `kubectl port-forward -n <namespace> svc/<name> <port>:<port>`

### Image-Level
- [ ] Images in Minikube: `eval $(minikube docker-env) && docker images`
- [ ] imagePullPolicy: `kubectl get deployment -n <namespace> <name> -o yaml | grep imagePullPolicy`

### Secret-Level
- [ ] Secrets exist: `kubectl get secrets -n <namespace>`
- [ ] Secret keys: `kubectl get secret -n <namespace> <name> -o jsonpath='{.data}' | jq 'keys'`
- [ ] Secret values (base64 decoded): `kubectl get secret -n <namespace> <name> -o jsonpath='{.data.<key>}' | base64 -d`

### Network-Level
- [ ] Port-forward active: `ps aux | grep port-forward`
- [ ] DNS resolution: `kubectl exec -n <namespace> deployment/<name> -- nslookup <service-name>`
- [ ] Service connectivity: `kubectl exec -n <namespace> deployment/frontend -- curl http://backend:8000/health`

---

## Emergency Debugging

If all else fails:

```bash
# Complete restart
kubectl delete namespace <namespace>
minikube delete
minikube start --driver=docker --memory=8192 --cpus=4

# Rebuild from scratch
eval $(minikube docker-env)
docker build -t app-backend:latest ./backend
docker build -t app-frontend:latest ./frontend

# Redeploy
kubectl create namespace <namespace>
kubectl create secret generic app-secrets --from-env-file=.env --namespace=<namespace>
kubectl apply -f k8s/deployment.yaml

# Setup port-forward
kubectl port-forward -n <namespace> svc/backend 8000:8000 &
kubectl port-forward -n <namespace> svc/frontend 3000:3000 &
```
