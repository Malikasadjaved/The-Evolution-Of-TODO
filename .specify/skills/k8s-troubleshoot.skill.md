# Skill: Kubernetes Troubleshooting Assistant

**Purpose:** Diagnose and resolve common Kubernetes deployment issues following Phase IV constitution observability requirements.

**When to Use:**
- Pods failing to start (CrashLoopBackOff, ImagePullBackOff)
- Services unreachable or timing out
- Resource exhaustion (OOMKilled, CPU throttling)
- Configuration issues (missing secrets, wrong env vars)

**Phase IV Constitution Reference:** Section VIII (Observability & Debugging)

---

## Common Issues & Solutions

### 1. ImagePullBackOff

**Symptoms:**
- Pod status: `ImagePullBackOff` or `ErrImagePull`
- Event: "Failed to pull image" or "image not found"

**Diagnosis Commands:**
```bash
kubectl describe pod <pod-name>
kubectl get events --sort-by='.lastTimestamp' | grep ImagePull
```

**Root Causes & Solutions:**

**A. Image not in Minikube Docker daemon:**
```bash
# Solution: Rebuild in Minikube context
eval $(minikube docker-env)
docker build -t todo-backend:latest -f docker/backend.Dockerfile ./backend
kubectl rollout restart deployment/backend
```

**B. Wrong image name/tag:**
```bash
# Check deployment manifest
kubectl get deployment backend -o yaml | grep image:

# Fix in values.yaml
backend:
  image:
    repository: todo-backend  # Must match Docker build tag
    tag: latest
```

**C. Image pull policy mismatch:**
```yaml
# For Minikube, use IfNotPresent
imagePullPolicy: IfNotPresent  # NOT Always
```

---

### 2. CrashLoopBackOff

**Symptoms:**
- Pod status: `CrashLoopBackOff`
- Pod restarts repeatedly
- Event: "Back-off restarting failed container"

**Diagnosis Commands:**
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # View crashed container logs
kubectl describe pod <pod-name>
```

**Root Causes & Solutions:**

**A. Missing environment variables:**
```bash
# Check logs for: "required environment variable not set"
kubectl logs <pod-name> | grep -i "environment\|env\|variable"

# Verify secret exists
kubectl get secret app-secrets
kubectl describe secret app-secrets

# Create missing secret
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="..." \
  --from-literal=BETTER_AUTH_SECRET="..." \
  --from-literal=OPENAI_API_KEY="..."
```

**B. Database connection failed:**
```bash
# Check DATABASE_URL is correct
kubectl exec <pod-name> -- env | grep DATABASE_URL

# Test database connectivity
kubectl exec <pod-name> -- curl -v <database-host>:<port>
```

**C. Application error (syntax, import):**
```bash
# View full stack trace
kubectl logs <pod-name> | tail -50

# Fix code error, rebuild image
docker build -t todo-backend:latest -f docker/backend.Dockerfile ./backend
kubectl rollout restart deployment/backend
```

**D. Health check failing too early:**
```yaml
# Increase initialDelaySeconds
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30  # Increased from 10
  periodSeconds: 30
```

---

### 3. Pending (Insufficient Resources)

**Symptoms:**
- Pod status: `Pending` (not Running)
- Event: "Insufficient CPU" or "Insufficient memory"

**Diagnosis Commands:**
```bash
kubectl describe pod <pod-name> | grep -A 10 "Events:"
kubectl top nodes  # Check available resources
kubectl describe nodes | grep -E "Allocatable|Allocated"
```

**Root Causes & Solutions:**

**A. Resource requests exceed node capacity:**
```bash
# Check total requests
kubectl describe nodes | grep -A 5 "Allocated resources"

# Reduce requests in values.yaml
backend:
  resources:
    requests:
      memory: "128Mi"  # Reduced from 256Mi
      cpu: "100m"      # Reduced from 250m
```

**B. Too many replicas:**
```yaml
# Reduce replica count
backend:
  replicaCount: 1  # Reduced from 2
```

**C. Minikube needs more resources:**
```bash
minikube stop
minikube start --cpus=6 --memory=12288  # Increased resources
```

---

### 4. OOMKilled (Out of Memory)

**Symptoms:**
- Pod status: `OOMKilled` (exit code 137)
- Container repeatedly killed and restarted

**Diagnosis Commands:**
```bash
kubectl describe pod <pod-name> | grep "Last State"
kubectl top pods  # Check current memory usage
```

**Solutions:**

**A. Increase memory limits:**
```yaml
resources:
  limits:
    memory: "1Gi"  # Increased from 512Mi
```

**B. Fix memory leak in application:**
```bash
# Profile application memory usage
kubectl exec <pod-name> -- ps aux
kubectl exec <pod-name> -- top -b -n 1
```

---

### 5. Service Unreachable

**Symptoms:**
- Cannot access service via `minikube service` or `kubectl port-forward`
- Connection timeout or refused

**Diagnosis Commands:**
```bash
kubectl get svc
kubectl get endpoints <service-name>
kubectl describe svc <service-name>
```

**Root Causes & Solutions:**

**A. Pod not ready:**
```bash
kubectl get pods  # Check all pods are Running and Ready 1/1
kubectl logs <pod-name>  # Check readiness probe errors
```

**B. Service selector mismatch:**
```bash
# Check service selector
kubectl get svc <service-name> -o yaml | grep -A 3 "selector:"

# Check pod labels
kubectl get pods --show-labels

# Fix: Ensure service selector matches pod labels
spec:
  selector:
    app: backend  # Must match pod label
```

**C. Wrong port configuration:**
```yaml
# Service port must match container port
service:
  ports:
  - port: 8000        # Service port
    targetPort: 8000  # Container port (must match)
```

**D. Firewall blocking NodePort:**
```bash
# Test with port-forward instead
kubectl port-forward svc/backend-service 8000:8000
curl http://localhost:8000/health
```

---

### 6. Readiness Probe Failed

**Symptoms:**
- Pod Running but not Ready (0/1)
- Event: "Readiness probe failed: HTTP probe failed"

**Diagnosis Commands:**
```bash
kubectl describe pod <pod-name> | grep -A 10 "Readiness:"
kubectl logs <pod-name>
```

**Root Causes & Solutions:**

**A. /ready endpoint not implemented:**
```python
# Add to backend/src/api/main.py
@app.get("/ready")
async def ready():
    # Check dependencies (database, APIs)
    return {"status": "ready"}
```

**B. Probe hitting wrong path/port:**
```yaml
readinessProbe:
  httpGet:
    path: /ready  # NOT /health
    port: 8000    # Match container port
```

**C. Dependency not ready (database):**
```bash
# Check database connectivity
kubectl exec <pod-name> -- curl -v <DATABASE_HOST>:<PORT>

# Add retry logic to /ready endpoint
```

---

## Debugging Workflow

### Step 1: Check Pod Status
```bash
kubectl get pods
# Look for: Pending, CrashLoopBackOff, ImagePullBackOff, OOMKilled
```

### Step 2: Describe Pod
```bash
kubectl describe pod <pod-name>
# Check: Events section, Status, Conditions
```

### Step 3: View Logs
```bash
kubectl logs -f <pod-name>
kubectl logs <pod-name> --previous  # If crashed
```

### Step 4: Check Events
```bash
kubectl get events --sort-by='.lastTimestamp' | tail -20
```

### Step 5: Exec into Container
```bash
kubectl exec -it <pod-name> -- /bin/bash
# Test: env vars, network connectivity, file permissions
```

### Step 6: Check Resource Usage
```bash
kubectl top pods
kubectl top nodes
```

### Step 7: AI-Assisted Troubleshooting
```bash
# Use kubectl-ai for intelligent diagnosis
kubectl-ai "why is my backend pod in CrashLoopBackOff?"

# Use kagent for cluster-wide issues
kagent "analyze cluster health and identify issues"
```

---

## Prevention Best Practices

### 1. Use Helm Dry-Run
```bash
helm install --dry-run --debug todo-app ./helm-charts/todo-app
```

### 2. Validate Manifests
```bash
kubectl apply --dry-run=client -f k8s/
kubeval k8s/*.yaml
```

### 3. Test Health Endpoints Locally
```bash
docker run -p 8000:8000 todo-backend:latest
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

### 4. Use Resource Requests/Limits
```yaml
# Always define both requests and limits
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### 5. Implement Graceful Shutdown
```python
# Handle SIGTERM signal
import signal

def shutdown_handler(signum, frame):
    logger.info("Received SIGTERM, shutting down...")
    # Close connections, flush logs
    sys.exit(0)

signal.signal(signal.SIGTERM, shutdown_handler)
```

---

## Quick Reference Table

| Issue | Command | Solution |
|-------|---------|----------|
| **ImagePullBackOff** | `kubectl describe pod <name>` | Rebuild in Minikube context |
| **CrashLoopBackOff** | `kubectl logs <name>` | Check logs for errors, verify secrets |
| **Pending** | `kubectl describe nodes` | Reduce resources or scale up cluster |
| **OOMKilled** | `kubectl top pods` | Increase memory limits |
| **Service Unreachable** | `kubectl get endpoints` | Check pod Ready status, verify selector |
| **Readiness Failed** | `kubectl logs <name>` | Implement /ready endpoint, check deps |

---

## References

- Phase IV Constitution: `.specify/memory/phase-4-constitution.md` (Section VIII)
- Troubleshooting Guide: `docs/TROUBLESHOOTING.md`
- Kubernetes Events: `kubectl get events --all-namespaces`

---

**Skill Version:** 1.0.0 | **Phase:** IV | **Last Updated:** 2026-01-03
