# Quickstart: Kubernetes Deployment on Minikube

**Feature**: 003-k8s-deployment | **Date**: 2026-01-03
**Phase**: Phase 1 Design | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)

## Summary

This quickstart guide provides step-by-step instructions to deploy all 3 services (backend, frontend-web, frontend-chatbot) on a local Minikube cluster using Helm charts.

**Estimated Time**: 15-20 minutes (first deployment)

---

## Prerequisites

### Required Software

- **Docker Desktop**: 24.0+ (for building images and Minikube driver)
- **Minikube**: 1.32+ (`minikube version`)
- **kubectl**: 1.28+ (`kubectl version --client`)
- **Helm**: 3.13+ (`helm version`)
- **Git**: For cloning repository
- **Node.js**: 20+ (for local frontend builds before Docker)
- **Python**: 3.13+ (for local backend verification)

### Optional AI DevOps Tools

- **Docker AI (Gordon)**: Docker Desktop Beta feature
- **kubectl-ai**: `brew install kubectl-ai` or download from releases
- **kagent**: Download from https://github.com/kagent-dev/kagent/releases

See [research.md](./research.md) Section 2 for detailed AI tool setup.

---

## Step 1: Start Minikube Cluster

```bash
# Start Minikube with sufficient resources
minikube start --cpus=4 --memory=8192 --disk-size=20g --driver=docker

# Verify cluster is running
minikube status
# Expected: host: Running, kubelet: Running, apiserver: Running

# Enable metrics-server addon (for resource monitoring)
minikube addons enable metrics-server

# Enable dashboard addon (optional, for UI)
minikube addons enable dashboard

# Verify nodes are ready
kubectl get nodes
# Expected: minikube   Ready   control-plane   1m   v1.28.x
```

---

## Step 2: Use Minikube Docker Daemon

**Important**: Use Minikube's Docker daemon to avoid pushing images to external registry.

```bash
# Set Docker environment variables (Linux/macOS)
eval $(minikube docker-env)

# Set Docker environment variables (Windows PowerShell)
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Verify you're using Minikube Docker
docker ps  # Should show Kubernetes system containers

# To revert to local Docker daemon:
# eval $(minikube docker-env --unset)  # Linux/macOS
# & minikube docker-env --unset | Invoke-Expression  # Windows PowerShell
```

---

## Step 3: Build Docker Images

```bash
# Navigate to project root
cd D:\new project\Hackthon 2\To-do-app\The-Evolution-Of-TODO

# Build backend image
docker build -t todo-backend:latest -f docker/backend.Dockerfile ./backend

# Build frontend-web image
docker build -t todo-frontend-web:latest -f docker/frontend-web.Dockerfile ./frontend-web

# Build frontend-chatbot image
docker build -t todo-frontend-chatbot:latest -f docker/frontend-chatbot.Dockerfile ./frontend-chatbot

# Verify images are built
docker images | grep todo-
# Expected:
# todo-backend               latest    <image-id>    <timestamp>    <450MB
# todo-frontend-web          latest    <image-id>    <timestamp>    <280MB
# todo-frontend-chatbot      latest    <image-id>    <timestamp>    <280MB
```

**Troubleshooting**:
- If build fails, check Dockerfile paths and syntax
- Verify Node.js/Python versions in base images
- See [research.md](./research.md) Section 4 for multi-stage Dockerfile templates

---

## Step 4: Create Kubernetes Secrets

**Important**: Never commit secrets to Git. Create manually:

```bash
# Create secret with your actual values
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host.neon.tech/todo_db?sslmode=require" \
  --from-literal=BETTER_AUTH_SECRET="your-43-character-secret-key-from-env" \
  --from-literal=OPENAI_API_KEY="sk-your-openai-api-key-here"

# Verify secret exists (data will be base64-encoded and hidden)
kubectl get secrets app-secrets
kubectl describe secret app-secrets
# Expected: 3 keys (DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY)
```

**Get values from existing .env files**:
```bash
# Backend .env
cat backend/.env | grep DATABASE_URL
cat backend/.env | grep BETTER_AUTH_SECRET
cat backend/.env | grep OPENAI_API_KEY

# Frontend-web .env.local
cat frontend-web/.env.local | grep BETTER_AUTH_SECRET
```

---

## Step 5: Install Helm Chart

```bash
# Lint chart first (validate syntax)
helm lint ./helm-charts/todo-app

# Dry-run to see what resources will be created (without applying)
helm install --dry-run --debug todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml

# Install for real
helm install todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml

# Expected output:
# NAME: todo-app
# LAST DEPLOYED: <timestamp>
# NAMESPACE: default
# STATUS: deployed
# REVISION: 1
# NOTES:
# ...
```

---

## Step 6: Verify Deployment

```bash
# Check Helm release status
helm list
# Expected: todo-app   default   1   <timestamp>   deployed   todo-app-1.0.0   phase-4

# Check all pods are Running
kubectl get pods
# Expected (after ~2 minutes):
# backend-<hash>-<id>               1/1     Running   0     1m
# backend-<hash>-<id>               1/1     Running   0     1m
# frontend-web-<hash>-<id>          1/1     Running   0     1m
# frontend-web-<hash>-<id>          1/1     Running   0     1m
# frontend-chatbot-<hash>-<id>      1/1     Running   0     1m
# frontend-chatbot-<hash>-<id>      1/1     Running   0     1m

# Check services
kubectl get svc
# Expected:
# backend-service           ClusterIP   10.x.x.x     <none>        8000/TCP         1m
# frontend-web-service      NodePort    10.x.x.x     <none>        3000:30000/TCP   1m
# frontend-chatbot-service  NodePort    10.x.x.x     <none>        3001:30001/TCP   1m

# Check resource usage
kubectl top nodes
kubectl top pods
```

**Troubleshooting Pending Pods**:
```bash
# If pods stuck in Pending state:
kubectl describe pod <pod-name>
# Check: Events section for "Insufficient CPU" or "Insufficient memory"
# Solution: Reduce replica count or resource requests in values-dev.yaml

# If pods stuck in ImagePullBackOff:
kubectl describe pod <pod-name>
# Check: "Failed to pull image" error
# Solution: Verify image name/tag, ensure using Minikube Docker daemon
```

**Troubleshooting CrashLoopBackOff**:
```bash
# If pods in CrashLoopBackOff:
kubectl logs <pod-name>
# Check: Application error logs (missing env vars, database connection failed)
# Solution: Verify secrets exist, check DATABASE_URL, OPENAI_API_KEY

# Check specific service logs
kubectl logs -l app=backend --tail=50
kubectl logs -l app=frontend-web --tail=50
```

---

## Step 7: Access Services

### Get Service URLs

```bash
# Get frontend-web URL
minikube service frontend-web-service --url
# Expected: http://192.168.49.2:30000

# Get frontend-chatbot URL
minikube service frontend-chatbot-service --url
# Expected: http://192.168.49.2:30001

# Backend is internal only (ClusterIP) - access via port-forward:
kubectl port-forward svc/backend-service 8000:8000
# Expected: Forwarding from 127.0.0.1:8000 -> 8000
# Open: http://localhost:8000/health
```

### Test Health Endpoints

```bash
# Backend health check (via port-forward)
kubectl port-forward svc/backend-service 8000:8000 &
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

curl http://localhost:8000/ready
# Expected: {"status":"ready","checks":{...}}

# Frontend-web health check
FRONTEND_WEB_URL=$(minikube service frontend-web-service --url)
curl $FRONTEND_WEB_URL
# Expected: HTML response (Next.js landing page)

# Frontend-chatbot health check
FRONTEND_CHATBOT_URL=$(minikube service frontend-chatbot-service --url)
curl $FRONTEND_CHATBOT_URL
# Expected: HTML response (Chatbot UI)
```

---

## Step 8: Smoke Tests (Automated)

```bash
# Run smoke test script
./scripts/health-check.sh

# Expected output:
# ✅ Waiting for backend pods to be ready... Done
# ✅ Waiting for frontend-web pods to be ready... Done
# ✅ Waiting for frontend-chatbot pods to be ready... Done
# ✅ Backend health check: PASS
# ✅ Frontend-web accessible: PASS
# ✅ Frontend-chatbot accessible: PASS
# ✅ All services healthy!
```

If smoke tests fail, check logs:
```bash
kubectl logs -l app=backend --tail=100
kubectl logs -l app=frontend-web --tail=100
kubectl logs -l app=frontend-chatbot --tail=100
```

---

## Step 9: Open Kubernetes Dashboard (Optional)

```bash
# Start dashboard (opens browser automatically)
minikube dashboard

# Or get URL without opening:
minikube dashboard --url
```

**Dashboard Features**:
- View all pods, deployments, services
- Check resource utilization graphs
- View pod logs in UI
- Inspect ConfigMaps and Secrets

---

## Step 10: Use the Application

### Web UI (Frontend-Web)

1. Get URL: `minikube service frontend-web-service --url`
2. Open in browser: `http://192.168.49.2:30000`
3. Sign up / Login with Better Auth
4. Create tasks, view dashboard, use calendar

### Chatbot UI (Frontend-Chatbot)

1. Get URL: `minikube service frontend-chatbot-service --url`
2. Open in browser: `http://192.168.49.2:30001`
3. Try natural language: "Add task tomorrow: Buy groceries"
4. Chatbot uses MCP server to manage tasks via backend API

---

## Common Operations

### View Logs

```bash
# Stream all backend logs
kubectl logs -f -l app=backend

# View specific pod logs
kubectl logs <pod-name>

# View logs from crashed container (previous instance)
kubectl logs <pod-name> --previous
```

### Update Deployment

```bash
# Rebuild Docker image with changes
docker build -t todo-backend:latest -f docker/backend.Dockerfile ./backend

# Restart deployment to pick up new image
kubectl rollout restart deployment/backend

# Watch rollout status
kubectl rollout status deployment/backend

# Or use Helm upgrade
helm upgrade todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml
```

### Scale Deployment

```bash
# Scale backend to 3 replicas
kubectl scale deployment/backend --replicas=3

# Verify scaling
kubectl get pods -l app=backend

# Or update Helm values and upgrade
# Edit values-dev.yaml: backend.replicaCount: 3
helm upgrade todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml
```

### Rollback Deployment

```bash
# View Helm release history
helm history todo-app

# Rollback to previous release
helm rollback todo-app

# Rollback to specific revision
helm rollback todo-app 2

# Verify rollback
kubectl get pods
helm list
```

---

## Cleanup

### Uninstall Helm Chart

```bash
# Remove all resources
helm uninstall todo-app

# Verify resources deleted
kubectl get pods
kubectl get svc
# Expected: No todo-app resources

# Delete secret (manual cleanup)
kubectl delete secret app-secrets
```

### Stop Minikube

```bash
# Stop cluster (preserves state)
minikube stop

# Delete cluster entirely (removes all data)
minikube delete

# Verify deletion
minikube status
# Expected: "Profile 'minikube' not found"
```

### Reset Docker Environment

```bash
# Revert to local Docker daemon (Linux/macOS)
eval $(minikube docker-env --unset)

# Revert to local Docker daemon (Windows PowerShell)
& minikube docker-env --unset | Invoke-Expression

# Verify
docker ps  # Should NOT show Kubernetes containers
```

---

## Next Steps

After successful deployment:

1. **Performance Testing**: Use `kubectl top pods` to monitor resource usage
2. **Load Testing**: Send traffic to services, observe horizontal scaling (if HPA enabled)
3. **Failure Testing**: Delete pods, verify Kubernetes self-heals automatically
4. **Update Testing**: Change image, rollout update, verify zero downtime
5. **Rollback Testing**: Trigger failure, execute `helm rollback`, verify recovery

---

## Troubleshooting Guide

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **ImagePullBackOff** | Pods pending, "Failed to pull image" error | Verify image name/tag, use Minikube Docker daemon (`eval $(minikube docker-env)`) |
| **CrashLoopBackOff** | Pods restarting, exit code 1 | Check logs (`kubectl logs <pod>`), verify secrets, check DATABASE_URL |
| **Pending Pods** | Pods stuck in Pending state | Check resource requests vs node capacity (`kubectl describe nodes`), reduce replicas or limits |
| **OOMKilled** | Pods killed with exit code 137 | Increase memory limits in values.yaml, restart deployment |
| **Service Unreachable** | Cannot access NodePort services | Verify Minikube IP (`minikube ip`), check firewall, use `minikube service <name> --url` |
| **Readiness Probe Failed** | Pods not added to Service | Check /ready endpoint works, verify database connectivity, check logs |

**Full Troubleshooting Guide**: See [docs/TROUBLESHOOTING.md](../../../docs/TROUBLESHOOTING.md) (to be created in implementation phase).

---

**Quickstart Complete**: Deploy with `helm install todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml`
