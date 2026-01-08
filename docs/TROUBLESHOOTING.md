# Kubernetes Troubleshooting Guide

**Phase IV: Kubernetes Deployment - Common Issues & Solutions**

This guide provides systematic troubleshooting steps for common issues encountered during Kubernetes deployment of the Todo Application.

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Pod Issues](#pod-issues)
3. [Service Issues](#service-issues)
4. [Image Issues](#image-issues)
5. [Resource Issues](#resource-issues)
6. [Network Issues](#network-issues)
7. [Secret Issues](#secret-issues)
8. [Helm Issues](#helm-issues)
9. [Minikube Issues](#minikube-issues)
10. [Monitoring & Logs](#monitoring--logs)

---

## Quick Diagnostics

**Start here for any issue:**

```bash
# Check cluster status
minikube status

# Check all pods
kubectl get pods

# Check all services
kubectl get svc

# Check recent events
kubectl get events --sort-by='.lastTimestamp' | tail -20

# Check Helm release
helm list

# View pod logs
kubectl logs deployment/todo-app-backend
```

**Common Pod States:**

| State | Meaning | Section |
|-------|---------|---------|
| `Pending` | Waiting for resources | [Resource Issues](#resource-issues) |
| `ImagePullBackOff` | Cannot pull image | [Image Issues](#image-issues) |
| `CrashLoopBackOff` | Pod keeps crashing | [Pod Issues](#pod-issues) |
| `Running` but not ready | Health check failing | [Service Issues](#service-issues) |
| `Error` | Pod failed to start | [Pod Issues](#pod-issues) |

---

## Pod Issues

### Issue: CrashLoopBackOff

**Symptoms:**
- Pod status shows `CrashLoopBackOff`
- Pod restarts repeatedly

**Diagnosis:**

```bash
# Check logs from current container
kubectl logs <pod-name>

# Check logs from previous (crashed) container
kubectl logs <pod-name> --previous

# Check pod events
kubectl describe pod <pod-name>

# Check recent events
kubectl get events --field-selector involvedObject.name=<pod-name>
```

**Common Causes & Solutions:**

#### 1. Missing Environment Variables

**Error in logs:**
```
KeyError: 'DATABASE_URL'
ValueError: BETTER_AUTH_SECRET not set
```

**Solution:**

```bash
# Verify secret exists
kubectl get secret app-secrets

# Check secret keys (not values)
kubectl describe secret app-secrets

# Recreate secret with correct values
kubectl delete secret app-secrets

kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" \
  --from-literal=BETTER_AUTH_SECRET="your-43-character-secret-here" \
  --from-literal=OPENAI_API_KEY="sk-your-key-here"

# Restart pods
kubectl rollout restart deployment/todo-app-backend
kubectl rollout restart deployment/todo-app-frontend-web
kubectl rollout restart deployment/todo-app-frontend-chatbot
```

#### 2. Database Connection Failed

**Error in logs:**
```
sqlalchemy.exc.OperationalError: could not connect to server
Connection refused
Connection timed out
```

**Solution:**

```bash
# 1. Verify DATABASE_URL is correct
kubectl get secret app-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d
# Check: host, port, username, password, database name

# 2. Test database connection from pod
kubectl exec -it <pod-name> -- sh
# Inside pod:
python3 -c "import psycopg2; psycopg2.connect('postgresql://...')"

# 3. Check if database allows external connections
# For Neon PostgreSQL: Ensure IP allowlist includes your cluster IP
```

#### 3. Port Already in Use

**Error in logs:**
```
OSError: [Errno 98] Address already in use
```

**Solution:**

```bash
# Check if multiple pods have same port mapping (shouldn't happen with K8s)
kubectl get pods -o wide

# Restart deployment
kubectl rollout restart deployment/todo-app-backend
```

#### 4. Python Module Import Error

**Error in logs:**
```
ModuleNotFoundError: No module named 'fastapi'
ImportError: cannot import name 'ChatKit' from 'openai'
```

**Solution:**

```bash
# Rebuild Docker image with all dependencies
eval $(minikube docker-env)

docker build -t todo-backend:latest -f docker/backend.Dockerfile ./backend
docker build -t todo-frontend-chatbot:latest -f docker/frontend-chatbot.Dockerfile ./frontend-chatbot

# Force pod restart
kubectl rollout restart deployment/todo-app-backend
kubectl rollout restart deployment/todo-app-frontend-chatbot
```

---

### Issue: Pod Stuck in Pending

**Symptoms:**
- Pod status shows `Pending`
- Pod never transitions to `Running`

**Diagnosis:**

```bash
# Check pod description for events
kubectl describe pod <pod-name>

# Look for:
# - "Insufficient CPU"
# - "Insufficient memory"
# - "No nodes available"
```

**Solutions:**

#### 1. Insufficient Resources

```bash
# Check node capacity
kubectl describe nodes

# Check current resource usage
kubectl top nodes
kubectl top pods

# Option A: Reduce resource requests (values-dev.yaml)
backend:
  resources:
    requests:
      memory: "128Mi"  # Reduced
      cpu: "100m"      # Reduced

# Apply changes
helm upgrade todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml

# Option B: Increase Minikube resources
minikube stop
minikube start --cpus=6 --memory=12288
```

#### 2. No Nodes Available

```bash
# Check node status
kubectl get nodes

# If no nodes, restart Minikube
minikube stop
minikube start
```

---

### Issue: Readiness/Liveness Probe Failing

**Symptoms:**
- Pod shows `Running` but `0/1 Ready`
- Pod restarts periodically
- Logs show health check timeouts

**Diagnosis:**

```bash
kubectl describe pod <pod-name>
# Look for: "Readiness probe failed" or "Liveness probe failed"

# Check logs
kubectl logs <pod-name>
```

**Solutions:**

#### 1. Increase Probe Timeouts

```yaml
# values-dev.yaml
backend:
  livenessProbe:
    initialDelaySeconds: 60  # Increased from 30
    timeoutSeconds: 5
  readinessProbe:
    initialDelaySeconds: 30  # Increased from 15
    timeoutSeconds: 3
```

#### 2. Fix Health Endpoint

```bash
# Test health endpoint directly
kubectl port-forward pod/<pod-name> 8000:8000
curl http://localhost:8000/health

# Expected: {"status":"healthy"}
```

---

## Service Issues

### Issue: Service Not Accessible

**Symptoms:**
- `minikube service <name> --url` returns URL but browser shows error
- `Connection refused` or `Connection timeout`

**Diagnosis:**

```bash
# Check service
kubectl get svc todo-app-frontend-web

# Check endpoints (should show pod IPs)
kubectl get endpoints todo-app-frontend-web

# Check pod readiness
kubectl get pods -l app=frontend-web
```

**Solutions:**

#### 1. Pods Not Ready

```bash
# Wait for pods to be ready
kubectl wait --for=condition=Ready pods -l app=frontend-web --timeout=5m

# If timeout, check pod logs
kubectl logs deployment/todo-app-frontend-web
```

#### 2. Service Selector Mismatch

```bash
# Check service selector
kubectl describe svc todo-app-frontend-web | grep Selector

# Check pod labels
kubectl get pods --show-labels | grep frontend-web

# Selector and labels must match!
```

#### 3. Wrong Port Mapping

```bash
# Check service ports
kubectl describe svc todo-app-frontend-web

# Should show:
# - Port: 80 (service port)
# - TargetPort: 3000 (container port)
# - NodePort: 30000 (external access)
```

---

### Issue: Backend API Not Reachable from Frontend

**Symptoms:**
- Frontend loads but shows "API error"
- Browser console shows `net::ERR_CONNECTION_REFUSED`

**Diagnosis:**

```bash
# Check backend service DNS
kubectl exec -it <frontend-pod> -- sh
nslookup todo-app-backend
# Should resolve to ClusterIP

# Test backend connectivity
wget -O- http://todo-app-backend:8000/health
```

**Solutions:**

#### 1. Fix Backend URL in Frontend

**For Development (Minikube):**

```yaml
# values-dev.yaml
backend:
  env:
    - name: FRONTEND_URL
      value: "http://192.168.49.2:30000"  # Minikube IP

frontendWeb:
  env:
    - name: NEXT_PUBLIC_API_URL
      value: "http://todo-app-backend:8000"  # Internal DNS
```

**For Production:**

```yaml
# values.yaml
frontendWeb:
  env:
    - name: NEXT_PUBLIC_API_URL
      value: "https://api.yourdomain.com"  # External URL
```

#### 2. Enable CORS

```python
# backend/src/api/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.49.2:30000"],  # Minikube frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Image Issues

### Issue: ImagePullBackOff

**Symptoms:**
- Pod status shows `ImagePullBackOff` or `ErrImagePull`
- Pod never starts

**Diagnosis:**

```bash
kubectl describe pod <pod-name>
# Look for: "Failed to pull image" or "image not found"
```

**Common Causes & Solutions:**

#### 1. Image Not in Minikube Docker Daemon

**Root Cause:** Image built on host Docker, not Minikube Docker

**Solution:**

```bash
# Set Docker environment to Minikube (Linux/macOS)
eval $(minikube docker-env)

# Set Docker environment to Minikube (Windows PowerShell)
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Rebuild images
docker build -t todo-backend:latest -f docker/backend.Dockerfile ./backend
docker build -t todo-frontend-web:latest -f docker/frontend-web.Dockerfile ./frontend-web
docker build -t todo-frontend-chatbot:latest -f docker/frontend-chatbot.Dockerfile ./frontend-chatbot

# Verify images in Minikube
docker images | grep todo-

# Restart pods
kubectl rollout restart deployment/todo-app-backend
```

#### 2. Image Pull Policy Incorrect

```yaml
# values-dev.yaml (for local development)
backend:
  image:
    pullPolicy: IfNotPresent  # Don't pull from registry

# values.yaml (for production)
backend:
  image:
    pullPolicy: Always  # Always pull latest
```

---

## Resource Issues

### Issue: Out of Memory (OOMKilled)

**Symptoms:**
- Pod status shows `OOMKilled`
- Pod restarts frequently
- Logs show memory errors

**Diagnosis:**

```bash
# Check resource usage
kubectl top pods

# Check pod events
kubectl describe pod <pod-name>
# Look for: "OOMKilled"
```

**Solutions:**

#### 1. Increase Memory Limits

```yaml
# values-dev.yaml
backend:
  resources:
    limits:
      memory: "1Gi"  # Increased from 512Mi
```

#### 2. Optimize Application Memory

```python
# backend/src/api/main.py
# Add gunicorn with memory limits
# CMD gunicorn src.api.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --max-requests 1000 --max-requests-jitter 100
```

---

### Issue: CPU Throttling

**Symptoms:**
- Application slow/unresponsive
- High CPU usage but not crashing

**Diagnosis:**

```bash
kubectl top pods
# Check if CPU usage is at limit
```

**Solutions:**

```yaml
# values-dev.yaml
backend:
  resources:
    limits:
      cpu: "1000m"  # Increased from 500m
```

---

## Network Issues

### Issue: DNS Resolution Failing

**Symptoms:**
- Services cannot reach each other
- Logs show "unknown host" errors

**Diagnosis:**

```bash
# Test DNS from pod
kubectl exec -it <pod-name> -- sh
nslookup todo-app-backend
nslookup kubernetes.default

# Check CoreDNS pods
kubectl get pods -n kube-system | grep coredns
```

**Solutions:**

```bash
# Restart CoreDNS
kubectl rollout restart -n kube-system deployment/coredns

# If still failing, restart Minikube
minikube stop
minikube start
```

---

## Secret Issues

### Issue: Secret Not Found

**Symptoms:**
- Pod logs show environment variable errors
- `kubectl describe pod` shows "Secret not found"

**Diagnosis:**

```bash
kubectl get secrets
kubectl describe secret app-secrets
```

**Solutions:**

```bash
# Create secret
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=BETTER_AUTH_SECRET="..." \
  --from-literal=OPENAI_API_KEY="sk-..."

# Verify
kubectl get secret app-secrets -o yaml

# Restart pods
kubectl rollout restart deployment/todo-app-backend
```

---

### Issue: Secret Values Incorrect

**Symptoms:**
- Authentication fails
- Database connection fails
- API calls return 401 errors

**Diagnosis:**

```bash
# Decode secret values
kubectl get secret app-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d
kubectl get secret app-secrets -o jsonpath='{.data.BETTER_AUTH_SECRET}' | base64 -d

# Compare with original .env files
cat backend/.env
```

**Solutions:**

```bash
# Delete and recreate secret
kubectl delete secret app-secrets

# Get values from .env files
export DATABASE_URL=$(grep DATABASE_URL backend/.env | cut -d '=' -f2-)
export BETTER_AUTH_SECRET=$(grep BETTER_AUTH_SECRET backend/.env | cut -d '=' -f2-)
export OPENAI_API_KEY=$(grep OPENAI_API_KEY backend/.env | cut -d '=' -f2-)

# Create secret
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  --from-literal=OPENAI_API_KEY="$OPENAI_API_KEY"
```

---

## Helm Issues

### Issue: Helm Install Failed

**Symptoms:**
- `helm install` returns error
- Release not created

**Diagnosis:**

```bash
# Lint chart
helm lint ./helm-charts/todo-app

# Dry-run to see errors
helm install --dry-run --debug todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml
```

**Common Causes:**

#### 1. Invalid YAML Syntax

```bash
# Check YAML syntax
yamllint ./helm-charts/todo-app/values-dev.yaml
```

#### 2. Missing Values

```bash
# Check template rendering
helm template todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml
```

---

### Issue: Helm Upgrade Failed

**Symptoms:**
- `helm upgrade` returns error
- Release in failed state

**Solutions:**

```bash
# Check release status
helm list
helm status todo-app

# Rollback to previous version
helm rollback todo-app

# If rollback fails, uninstall and reinstall
helm uninstall todo-app
helm install todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml
```

---

## Minikube Issues

### Issue: Minikube Won't Start

**Symptoms:**
- `minikube start` hangs or fails
- Error: "Unable to start VM"

**Solutions:**

#### 1. Delete and Recreate Cluster

```bash
minikube delete
minikube start --cpus=4 --memory=8192 --driver=docker
```

#### 2. Change Driver

```bash
# If Docker driver fails, try VirtualBox or Hyper-V
minikube start --driver=virtualbox

# Or
minikube start --driver=hyperv
```

---

### Issue: Minikube Dashboard Not Loading

**Symptoms:**
- `minikube dashboard` hangs
- Browser shows "Connection refused"

**Solutions:**

```bash
# Enable dashboard addon
minikube addons enable dashboard

# Get URL without opening browser
minikube dashboard --url

# Access via port-forward
kubectl proxy
# Then open: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/
```

---

## Monitoring & Logs

### Collect All Diagnostic Info

**For Bug Reports:**

```bash
# Create diagnostics directory
mkdir -p diagnostics

# Cluster info
kubectl cluster-info > diagnostics/cluster-info.txt
kubectl get all > diagnostics/all-resources.txt
kubectl top nodes > diagnostics/node-usage.txt
kubectl top pods > diagnostics/pod-usage.txt

# Logs
kubectl logs deployment/todo-app-backend > diagnostics/backend-logs.txt
kubectl logs deployment/todo-app-frontend-web > diagnostics/frontend-web-logs.txt
kubectl logs deployment/todo-app-frontend-chatbot > diagnostics/chatbot-logs.txt

# Events
kubectl get events --sort-by='.lastTimestamp' > diagnostics/events.txt

# Helm
helm list > diagnostics/helm-releases.txt
helm status todo-app > diagnostics/helm-status.txt

# Package diagnostics
tar -czf diagnostics-$(date +%Y%m%d-%H%M%S).tar.gz diagnostics/
```

---

### Enable Debug Logging

**Backend:**

```yaml
# values-dev.yaml
backend:
  env:
    - name: LOG_LEVEL
      value: "DEBUG"
```

**Frontend:**

```yaml
frontendWeb:
  env:
    - name: NODE_ENV
      value: "development"
```

---

## Nuclear Option: Complete Reset

**When all else fails:**

```bash
# 1. Delete Helm release
helm uninstall todo-app

# 2. Delete all resources
kubectl delete all --all

# 3. Delete secrets
kubectl delete secret app-secrets

# 4. Delete Minikube cluster
minikube delete

# 5. Start fresh
minikube start --cpus=4 --memory=8192 --driver=docker

# 6. Redeploy
bash scripts/deploy-minikube.sh
```

---

## Additional Resources

- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Architecture Diagram:** `docs/ARCHITECTURE.md`
- **Phase IV Constitution:** `.specify/memory/phase-4-constitution.md`
- **Health Check Script:** `scripts/health-check.sh`

---

**Troubleshooting Guide Complete** | Phase IV: Kubernetes Deployment
