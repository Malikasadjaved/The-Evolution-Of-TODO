---
name: k8s-fullstack-deployment
description: |
  Deploy full-stack applications (frontend + backend + database) to Kubernetes (Minikube) with ClusterIP services and kubectl port-forward access. Solves common issues: Docker space consumption (60GB+ → 15GB), frontend build failures with environment variables, and pod-to-pod communication. This skill should be used when users need to deploy multi-tier web applications to local Kubernetes with production-ready patterns including health checks, secrets management, resource limits, and dual API URL strategy for browser and server-side requests.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Kubernetes Full-Stack Deployment

Deploy production-ready full-stack applications to Kubernetes with minimal storage overhead and proper service communication.

## What This Skill Provides

**Deployment Architecture:**
- ✅ Minikube-native image builds (50% storage reduction)
- ✅ ClusterIP services with port-forward (predictable localhost access)
- ✅ Dual API URL strategy (browser vs server-side requests)
- ✅ Production patterns (health checks, secrets, resource limits)

**Problem Solutions:**
- Docker space consumption (60GB+ → ~15GB)
- Next.js build-time environment variable validation
- Pod-to-pod communication (Kubernetes service DNS)
- Frontend proxy unable to reach backend (503 errors)

**Stack Support:**
- Frontend: Next.js, React, Vue, Angular (with API routes/middleware)
- Backend: FastAPI, Express, Spring Boot, any REST API
- Database: PostgreSQL, MySQL, MongoDB (cloud or self-hosted)

---

## Before Implementation

Gather context to ensure successful deployment:

| Source | Gather |
|--------|--------|
| **Codebase** | Dockerfile locations, environment variables, service ports, API endpoints |
| **Conversation** | User's tech stack, database provider, environment constraints |
| **Skill References** | Kubernetes patterns, troubleshooting guides, security best practices |
| **User Guidelines** | Project-specific secrets, resource requirements, networking needs |

Ask user for THEIR specific context:
1. What ports do frontend/backend use? (default: 3000/8000)
2. Where is the database hosted? (Neon, AWS RDS, self-hosted?)
3. What environment variables are required?
4. Any resource constraints? (memory/CPU limits)

---

## Deployment Workflow

### Phase 1: Prerequisites Check

```bash
# Verify tools installed
minikube version  # Require: v1.30.0+
kubectl version --client  # Require: v1.27.0+
docker --version  # Require: 20.10+

# Start Minikube (if not running)
minikube start --driver=docker --memory=4096 --cpus=2
minikube status  # Verify: host/kubelet/apiserver Running
```

**Critical Decision**: Always use Minikube Docker driver (not VirtualBox/Hyper-V) for best Docker integration.

---

### Phase 2: Build Images (Minikube-Native)

**Problem Solved**: Eliminates duplicate storage (host + Minikube).

```bash
# Point shell to Minikube Docker daemon
eval $(minikube docker-env)

# Verify context switched
echo $DOCKER_HOST  # Should show: tcp://192.168.x.x:2376

# Build backend
cd backend
docker build -t <project>-backend:latest .
cd ..

# Build frontend (with build-time env vars)
cd frontend
docker build -t <project>-frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:<backend-port> \
  --build-arg NEXT_PUBLIC_AUTH_SECRET=<auth-secret> \
  --build-arg NEXT_PUBLIC_AUTH_URL=http://localhost:<frontend-port>/api/auth \
  .
cd ..

# Verify images exist in Minikube
docker images | grep <project>
```

**Frontend Build Validation**: If build fails with "Environment validation failed", ensure Dockerfile has ARG/ENV declarations BEFORE `RUN npm run build`. See `references/dockerfile-patterns.md`.

---

### Phase 3: Create Kubernetes Resources

**Namespace:**
```bash
kubectl create namespace <project>-app
```

**Secrets** (from .env files):
```bash
# Extract from backend/.env
kubectl create secret generic app-secrets \
  --namespace=<project>-app \
  --from-literal=database-url='<DATABASE_URL>' \
  --from-literal=auth-secret='<AUTH_SECRET>' \
  --from-literal=api-key='<API_KEY>'

# Verify secrets created
kubectl get secrets -n <project>-app
```

**Deployment Manifest** (`k8s/deployment.yaml`):

Create manifest with:
- Backend Deployment + ClusterIP Service
- Frontend Deployment + ClusterIP Service
- Environment variables from secrets
- Health checks (liveness + readiness probes)
- Resource limits (memory: 256Mi-512Mi, CPU: 250m-500m)
- `imagePullPolicy: Never` (use local Minikube images)

**Critical Environment Variables**:
```yaml
# Frontend Pod Environment
- name: NEXT_PUBLIC_API_URL
  value: "http://localhost:<backend-port>"  # Browser requests (via port-forward)
- name: API_URL
  value: "http://<project>-backend:<backend-port>"  # Server-side (Kubernetes DNS)
```

See `references/deployment-template.yaml` for complete manifest.

---

### Phase 4: Deploy to Kubernetes

```bash
# Apply deployment
kubectl apply -f k8s/deployment.yaml

# Wait for pods to be ready
kubectl get pods -n <project>-app --watch
# Wait until both show: 1/1 Running

# Verify services created
kubectl get services -n <project>-app
# Should show: ClusterIP services (no NodePort)
```

**Rollout Status:**
```bash
kubectl rollout status deployment/<project>-backend -n <project>-app
kubectl rollout status deployment/<project>-frontend -n <project>-app
```

---

### Phase 5: Setup Port-Forwarding

**Manual (Two Terminals):**

Terminal 1 - Backend:
```bash
kubectl port-forward -n <project>-app svc/<project>-backend <backend-port>:<backend-port>
```

Terminal 2 - Frontend:
```bash
kubectl port-forward -n <project>-app svc/<project>-frontend <frontend-port>:<frontend-port>
```

**Automated Script** (`scripts/port-forward.sh`):

See `references/port-forward-script.sh` for production script with:
- Dynamic pod discovery
- Cleanup function (Ctrl+C handling)
- Health check verification
- Background execution support

**Run Script:**
```bash
chmod +x scripts/port-forward.sh
./scripts/port-forward.sh
```

---

### Phase 6: Verify Deployment

**Health Checks:**
```bash
# Backend
curl http://localhost:<backend-port>/health
# Expected: {"status":"healthy"}

# Frontend
curl -I http://localhost:<frontend-port>
# Expected: HTTP/1.1 200 OK
```

**Pod Logs:**
```bash
# Backend logs
kubectl logs -n <project>-app deployment/<project>-backend --tail=50

# Frontend logs
kubectl logs -n <project>-app deployment/<project>-frontend --tail=50
```

**Environment Variables in Pod:**
```bash
kubectl exec -n <project>-app deployment/<project>-frontend -- env | grep -E "(API_URL|NEXT_PUBLIC)"
# Verify: API_URL points to Kubernetes service
```

---

## Architecture Patterns

### Dual API URL Strategy

**Problem**: Frontend runs in Kubernetes pod. Two types of requests:
1. **Browser → Backend**: Needs localhost URL (via port-forward)
2. **Frontend Server → Backend**: Needs Kubernetes service DNS

**Solution**: Use different URLs for each context.

```yaml
# Frontend Deployment
env:
- name: NEXT_PUBLIC_API_URL
  value: "http://localhost:8000"  # Embedded in browser JavaScript
- name: API_URL
  value: "http://backend-service:8000"  # Used by Next.js API routes
```

**Frontend Code Pattern**:
```javascript
// Browser-side request (lib/api.ts)
const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/tasks`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
// Uses: localhost:8000 via port-forward ✅

// Server-side request (app/api/auth/route.ts)
const backendUrl = `${env.API_URL}/api/auth/sign-up`
const response = await fetch(backendUrl, { method: 'POST', body })
// Uses: http://backend-service:8000 via Kubernetes DNS ✅
```

### Service Discovery Flow

```
Frontend Pod sends request to: http://backend-service:8000
           ↓
Kubernetes DNS resolves "backend-service" to:
  → Service ClusterIP: 10.96.123.45
           ↓
Service forwards to healthy pod:
  → Backend Pod IP: 10.244.0.15:8000 ✅
```

### Health Check Pattern

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

**Difference**:
- **Liveness**: Restarts pod if failing (app crashed)
- **Readiness**: Removes from service if failing (app starting up)

---

## Troubleshooting Guide

### Issue 1: "failed to read dockerfile: no such file"

**Symptoms:**
```
ERROR: failed to solve: failed to read dockerfile: open Dockerfile.backend: no such file or directory
```

**Diagnosis:**
```bash
# Find actual Dockerfile locations
find . -name "Dockerfile" -type f
```

**Solution:**
```bash
# ✅ Build from component directory
cd backend && docker build -t app-backend:latest .

# ❌ Wrong: Build from root with wrong path
docker build -f docker/Dockerfile.backend .
```

---

### Issue 2: Frontend Build Environment Validation Failed

**Symptoms:**
```
❌ Environment validation failed:
- NEXT_PUBLIC_API_URL: must be a valid URL
- NEXT_PUBLIC_AUTH_SECRET: Required
```

**Root Cause**: Next.js requires `NEXT_PUBLIC_*` variables at **build time** (not runtime).

**Solution - Dockerfile Fix** (lines to add before `RUN npm run build`):
```dockerfile
# Declare build arguments
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_AUTH_SECRET=your-secret-here
ARG NEXT_PUBLIC_AUTH_URL=http://localhost:3000/api/auth

# Convert to environment variables (available during build)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_AUTH_SECRET=${NEXT_PUBLIC_AUTH_SECRET}
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}

# Now build succeeds
RUN npm run build
```

See `references/dockerfile-patterns.md#nextjs-env-vars` for complete pattern.

---

### Issue 3: Frontend 503 Error - "Authentication service unavailable"

**Symptoms:**
```javascript
POST http://localhost:3000/api/auth/sign-up 503 (Service Unavailable)
```

**Root Cause**: Frontend API route (Next.js server) trying to connect to `localhost:8000` from inside pod. `localhost` refers to the pod itself, not backend service.

**Diagnosis:**
```bash
# Check if API_URL is set in frontend pod
kubectl exec -n app deployment/frontend -- env | grep API_URL

# If empty or missing → Problem!
```

**Solution - Add API_URL to deployment**:
```yaml
# Frontend Deployment
env:
- name: API_URL
  value: "http://backend-service:8000"  # ← Add this!
```

**Apply fix:**
```bash
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/frontend -n app
```

---

### Issue 4: Pods Stuck in Pending State

**Symptoms:**
```bash
$ kubectl get pods -n app
NAME                READY   STATUS    RESTARTS   AGE
backend-xxx         0/1     Pending   0          2m
```

**Diagnosis:**
```bash
kubectl describe pod -n app backend-xxx | grep -A 10 Events

# Look for:
# - "Insufficient memory"
# - "Insufficient cpu"
# - "ImagePullBackOff"
```

**Solutions:**

**Insufficient Resources:**
```bash
minikube stop
minikube start --memory=8192 --cpus=4
```

**Image Not Found:**
```bash
# Verify images in Minikube
eval $(minikube docker-env)
docker images | grep <project>

# Rebuild if missing
cd backend && docker build -t app-backend:latest .
```

**Wrong imagePullPolicy:**
```yaml
# In deployment.yaml, ensure:
imagePullPolicy: Never  # Use local Minikube images
```

---

### Issue 5: Connection Refused (Port-Forward Inactive)

**Symptoms:**
```bash
$ curl http://localhost:8000/health
curl: (7) Failed to connect to localhost port 8000: Connection refused
```

**Diagnosis:**
```bash
# Check port-forward processes
ps aux | grep "port-forward"

# If no results → Port-forward not running
```

**Solution:**
```bash
# Restart port-forwarding
kubectl port-forward -n app svc/backend 8000:8000 &
kubectl port-forward -n app svc/frontend 3000:3000 &

# Or use automated script
./scripts/port-forward.sh
```

**Persistent Solution** (use screen/tmux):
```bash
screen -S port-forward
./scripts/port-forward.sh
# Press Ctrl+A, then D to detach

# Reattach later:
screen -r port-forward
```

---

### Issue 6: JWT 401 Unauthorized

**Symptoms:**
```bash
$ curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
{"detail":"Unauthorized"}
```

**Diagnosis:**
```bash
# Check if token is set
echo $TOKEN

# Decode JWT to check expiration
echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null
```

**Solutions:**

**Token Expired:**
```bash
# Get new token (re-login)
curl -X POST http://localhost:8000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}'

# Extract token
TOKEN=$(echo $response | jq -r '.token')
```

**Missing "Bearer" Prefix:**
```bash
# ❌ Wrong
-H "Authorization: $TOKEN"

# ✅ Correct
-H "Authorization: Bearer $TOKEN"
```

---

### Issue 7: Pods CrashLoopBackOff

**Symptoms:**
```bash
$ kubectl get pods -n app
NAME                READY   STATUS             RESTARTS   AGE
backend-xxx         0/1     CrashLoopBackOff   5          5m
```

**Diagnosis:**
```bash
# Check pod logs
kubectl logs -n app backend-xxx --tail=100

# Common errors:
# - "connection to server at ... failed" → Database connection
# - "ModuleNotFoundError" → Dependencies missing
# - "KeyError: 'DATABASE_URL'" → Environment variable missing
```

**Solutions:**

**Database Connection:**
```bash
# Verify DATABASE_URL secret
kubectl get secret -n app app-secrets -o jsonpath='{.data.database-url}' | base64 -d

# If wrong, recreate secret:
kubectl delete secret -n app app-secrets
kubectl create secret generic app-secrets \
  --from-literal=database-url='correct-url-here'

# Restart deployment
kubectl rollout restart deployment -n app backend
```

**Missing Dependencies:**
```bash
# Rebuild with fresh install
eval $(minikube docker-env)
docker build --no-cache -t app-backend:latest ./backend

kubectl rollout restart deployment -n app backend
```

---

## Security Checklist

### Secrets Management ✅

**Current Best Practices:**
- [x] Secrets stored in Kubernetes (not in code)
- [x] Environment variables loaded from `secretKeyRef`
- [x] No hardcoded credentials in Dockerfiles

**Production Recommendations:**
```yaml
# Use external secret management
# - HashiCorp Vault
# - AWS Secrets Manager
# - Sealed Secrets (for GitOps)

# Enable RBAC
kubectl create rolebinding app-secrets \
  --role=secret-reader \
  --serviceaccount=app:default \
  --namespace=app
```

### JWT Token Security ✅

**Current Implementation:**
- [x] Tokens signed with 43+ character secret
- [x] Expiration enforced (exp claim)
- [x] Validated on every protected endpoint

**Production Recommendations:**
```python
# Use RS256 (asymmetric) instead of HS256
import jwt
from datetime import datetime, timedelta

private_key = open("private.pem").read()
token = jwt.encode(
    {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=15),
        "iss": "app-backend",
        "aud": "app-frontend"
    },
    private_key,
    algorithm="RS256"
)
```

### Database Security ✅

**Current Implementation:**
- [x] SSL connection: `sslmode=require`
- [x] Connection string in Kubernetes secret

**Production Recommendations:**
```bash
# Use certificate verification
DATABASE_URL="postgresql://...?sslmode=verify-full&sslrootcert=/path/to/ca.pem"

# Connection pooling limits
MAX_CONNECTIONS=20
POOL_SIZE=10
```

### Network Policies 🔒

**Not Currently Implemented** - Add for production:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
  namespace: app
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Allow from frontend only
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8000
```

---

## Production Deployment Considerations

### Upgrade from Port-Forward to Ingress

**Current (Development):**
```
Browser → kubectl port-forward → ClusterIP Service → Pod
```

**Production:**
```
Browser → Ingress → Service → Pod
```

**Ingress Setup:**
```bash
# Enable Ingress addon
minikube addons enable ingress

# Create Ingress resource
kubectl apply -f k8s/ingress.yaml
```

See `references/ingress-template.yaml` for complete configuration.

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Monitoring and Observability

**Prometheus + Grafana:**
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack
```

**Logging (ELK Stack):**
```bash
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch
helm install kibana elastic/kibana
helm install filebeat elastic/filebeat
```

---

## Quick Reference Commands

### Deployment
```bash
# Build images in Minikube
eval $(minikube docker-env)
docker build -t app-backend:latest ./backend
docker build -t app-frontend:latest ./frontend

# Deploy
kubectl create namespace app
kubectl create secret generic app-secrets --from-env-file=.env
kubectl apply -f k8s/deployment.yaml

# Port-forward
kubectl port-forward -n app svc/backend 8000:8000 &
kubectl port-forward -n app svc/frontend 3000:3000 &
```

### Debugging
```bash
# Pod status
kubectl get pods -n app

# Pod logs
kubectl logs -n app deployment/backend --tail=50 -f

# Shell into pod
kubectl exec -n app -it deployment/backend -- /bin/sh

# Describe pod (events)
kubectl describe pod -n app <pod-name>

# Check secrets
kubectl get secrets -n app
kubectl get secret -n app app-secrets -o yaml
```

### Updates
```bash
# Rebuild image
eval $(minikube docker-env)
docker build -t app-backend:latest ./backend

# Restart deployment
kubectl rollout restart deployment -n app backend

# Check rollout status
kubectl rollout status deployment -n app backend

# Rollback if needed
kubectl rollout undo deployment -n app backend
```

### Cleanup
```bash
# Delete all resources
kubectl delete namespace app

# Stop Minikube
minikube stop

# Delete Minikube (removes all data)
minikube delete
```

---

## When to Use This Skill

✅ **Use when:**
- Deploying full-stack apps to local Kubernetes
- Need to solve Docker space issues (60GB+)
- Frontend builds fail with env var validation
- Pod-to-pod communication problems
- Want production-ready patterns (health checks, secrets, limits)

❌ **Don't use when:**
- Deploying to managed Kubernetes (GKE, EKS, AKS) - use cloud-specific skills
- Single container apps - use simpler Docker Compose
- Stateful apps requiring persistent volumes - see `k8s-stateful-deployment` skill
- CI/CD pipeline setup - see `k8s-cicd-integration` skill

---

## Reference Files

| File | Purpose |
|------|---------|
| `references/deployment-template.yaml` | Complete Kubernetes manifest template |
| `references/dockerfile-patterns.md` | Next.js, FastAPI, generic patterns with env vars |
| `references/port-forward-script.sh` | Production port-forward script |
| `references/troubleshooting-matrix.md` | Comprehensive error diagnosis matrix |
| `references/ingress-template.yaml` | Production Ingress configuration |
| `references/architecture-diagrams.md` | Visual architecture patterns |
| `references/security-hardening.md` | Production security recommendations |
