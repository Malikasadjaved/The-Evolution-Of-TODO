# Quick Reference Card

Essential commands for Kubernetes full-stack deployment. Bookmark this page!

---

## Initial Setup (One-Time)

```bash
# Start Minikube
minikube start --driver=docker --memory=4096 --cpus=2

# Point to Minikube Docker
eval $(minikube docker-env)

# Build images
docker build -t app-backend:latest ./backend
docker build -t app-frontend:latest ./frontend

# Create namespace
kubectl create namespace app

# Create secrets
kubectl create secret generic app-secrets \
  --namespace=app \
  --from-literal=database-url='postgresql://...' \
  --from-literal=auth-secret='your-secret-here'

# Deploy
kubectl apply -f k8s/deployment.yaml

# Setup port-forward
kubectl port-forward -n app svc/backend 8000:8000 &
kubectl port-forward -n app svc/frontend 3000:3000 &
```

---

## Daily Commands

### Check Status
```bash
# Pods
kubectl get pods -n app

# Services
kubectl get services -n app

# All resources
kubectl get all -n app
```

### View Logs
```bash
# Backend (follow)
kubectl logs -n app -f deployment/backend

# Frontend (follow)
kubectl logs -n app -f deployment/frontend

# Last 50 lines
kubectl logs -n app deployment/backend --tail=50
```

### Restart Services
```bash
# Rebuild image
eval $(minikube docker-env)
docker build -t app-backend:latest ./backend

# Restart deployment
kubectl rollout restart deployment -n app backend

# Check status
kubectl rollout status deployment -n app backend
```

### Port-Forward
```bash
# Start
kubectl port-forward -n app svc/backend 8000:8000 &
kubectl port-forward -n app svc/frontend 3000:3000 &

# Check
ps aux | grep port-forward

# Stop
kill $(jobs -p | grep port-forward)
```

---

## Troubleshooting Commands

### Pods Pending/Failing
```bash
# Describe pod (see events)
kubectl describe pod -n app <pod-name>

# Check resource usage
kubectl top pods -n app  # Requires metrics-server

# Increase Minikube resources
minikube stop
minikube start --memory=8192 --cpus=4
```

### Application Errors
```bash
# Exec into pod
kubectl exec -n app -it deployment/backend -- /bin/sh

# Check environment variables
kubectl exec -n app deployment/frontend -- env | grep API_URL

# Test database connection
kubectl exec -n app deployment/backend -- \
  python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')"
```

### Secret Issues
```bash
# View secrets
kubectl get secrets -n app

# Decode secret value
kubectl get secret -n app app-secrets \
  -o jsonpath='{.data.database-url}' | base64 -d

# Recreate secret
kubectl delete secret -n app app-secrets
kubectl create secret generic app-secrets \
  --from-literal=database-url='new-value'
```

### Image Issues
```bash
# List Minikube images
eval $(minikube docker-env)
docker images | grep app

# Remove old images
docker rmi app-backend:old-tag

# Rebuild without cache
docker build --no-cache -t app-backend:latest ./backend
```

---

## Cleanup Commands

### Soft Reset
```bash
# Delete pods (recreate automatically)
kubectl delete pods -n app --all

# Restart all deployments
kubectl rollout restart deployment -n app backend
kubectl rollout restart deployment -n app frontend
```

### Hard Reset
```bash
# Delete namespace (removes everything)
kubectl delete namespace app

# Recreate
kubectl create namespace app
kubectl create secret generic app-secrets --from-env-file=.env
kubectl apply -f k8s/deployment.yaml
```

### Complete Cleanup
```bash
# Delete Minikube (removes all data)
minikube delete

# Restart fresh
minikube start --driver=docker --memory=4096 --cpus=2
```

---

## Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Kubernetes shortcuts
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kga='kubectl get all'
alias kl='kubectl logs -f'
alias kd='kubectl describe'
alias ke='kubectl exec -it'

# Minikube shortcuts
alias mk='minikube'
alias mkstart='minikube start --driver=docker --memory=4096 --cpus=2'
alias mkenv='eval $(minikube docker-env)'

# Project-specific
alias kapp='kubectl -n app'
alias klback='kubectl logs -n app -f deployment/backend'
alias klfront='kubectl logs -n app -f deployment/frontend'
```

Usage after adding aliases:
```bash
kapp get pods  # Instead of: kubectl get pods -n app
klback  # Instead of: kubectl logs -n app -f deployment/backend
```

---

## Environment Variables Reference

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_SECRET=<43-char-secret>
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth
```

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
BETTER_AUTH_SECRET=<43-char-secret>
BETTER_AUTH_URL=http://localhost:8000/api/auth
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=sk-proj-...  # Optional
```

### Kubernetes Deployment (Dual API URL)
```yaml
# Frontend container env
- name: NEXT_PUBLIC_API_URL
  value: "http://localhost:8000"  # Browser requests
- name: API_URL
  value: "http://backend:8000"  # Server-side requests
```

---

## Health Check URLs

After port-forward is active:

| Service | URL | Expected Response |
|---------|-----|-------------------|
| Backend Health | http://localhost:8000/health | `{"status":"healthy"}` |
| Backend API Docs | http://localhost:8000/docs | Swagger UI |
| Frontend | http://localhost:3000 | Landing page |
| Frontend Dashboard | http://localhost:3000/dashboard | Dashboard (after login) |

---

## Common Error Patterns

| Error | Quick Fix |
|-------|-----------|
| `ImagePullBackOff` | Check `imagePullPolicy: Never` |
| `CrashLoopBackOff` | Check logs: `kubectl logs -n app <pod>` |
| `Pending` | Increase Minikube resources |
| `Connection refused` | Restart port-forward |
| `503 Service Unavailable` | Add `API_URL` to frontend deployment |
| `401 Unauthorized` | Token expired, re-login |

---

## Performance Monitoring

```bash
# Pod resource usage (requires metrics-server)
kubectl top pods -n app

# Node resource usage
kubectl top nodes

# Watch pod status
kubectl get pods -n app --watch

# Describe node
kubectl describe node minikube
```

---

## Production Readiness Checklist

Before deploying to production:

- [ ] Replace port-forward with Ingress/LoadBalancer
- [ ] Add TLS certificates (cert-manager + Let's Encrypt)
- [ ] Implement HorizontalPodAutoscaler (HPA)
- [ ] Add PersistentVolumeClaims (if needed)
- [ ] Setup monitoring (Prometheus + Grafana)
- [ ] Configure logging (ELK/Loki)
- [ ] Add NetworkPolicies for pod isolation
- [ ] Use external secret manager (Vault/AWS Secrets Manager)
- [ ] Implement pod security policies
- [ ] Set up CI/CD pipeline (GitHub Actions/GitLab CI)
- [ ] Configure resource quotas
- [ ] Add pod disruption budgets
- [ ] Implement database backup strategy
- [ ] Setup alerting (PagerDuty/Opsgenie)
- [ ] Document runbooks for common issues

---

## Useful kubectl Commands

```bash
# Get resource in YAML
kubectl get deployment -n app backend -o yaml

# Get resource in JSON
kubectl get deployment -n app backend -o json

# Get specific field
kubectl get deployment -n app backend -o jsonpath='{.spec.replicas}'

# Watch resource changes
kubectl get pods -n app --watch

# Port-forward to pod (not service)
kubectl port-forward -n app pod/<pod-name> 8000:8000

# Copy files from pod
kubectl cp -n app <pod-name>:/path/to/file ./local-file

# Copy files to pod
kubectl cp -n app ./local-file <pod-name>:/path/to/file

# Run command in pod
kubectl exec -n app deployment/backend -- ls -la

# Get events
kubectl get events -n app --sort-by='.lastTimestamp'

# Scale deployment
kubectl scale deployment -n app backend --replicas=3

# Update image
kubectl set image deployment -n app backend \
  backend=app-backend:new-tag

# Rollback deployment
kubectl rollout undo deployment -n app backend

# View rollout history
kubectl rollout history deployment -n app backend

# Pause rollout
kubectl rollout pause deployment -n app backend

# Resume rollout
kubectl rollout resume deployment -n app backend
```

---

## Docker Cleanup

```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Remove all build cache
docker builder prune -a

# Complete cleanup (WARNING: removes everything)
docker system prune -a --volumes

# Show disk usage
docker system df
```

---

## Minikube Useful Commands

```bash
# SSH into Minikube VM
minikube ssh

# View Minikube IP
minikube ip

# Open dashboard
minikube dashboard

# Enable addon
minikube addons enable ingress

# List addons
minikube addons list

# View cluster info
kubectl cluster-info

# Update context
minikube update-context

# Pause cluster (saves resources)
minikube pause

# Unpause cluster
minikube unpause

# View logs
minikube logs

# Profile management
minikube profile list
minikube start -p my-profile
minikube profile my-profile
```

---

## Emergency Recovery

If everything is broken:

```bash
# 1. Complete cleanup
kubectl delete namespace app
minikube delete

# 2. Fresh start
minikube start --driver=docker --memory=8192 --cpus=4

# 3. Rebuild from scratch
eval $(minikube docker-env)
docker build --no-cache -t app-backend:latest ./backend
docker build --no-cache -t app-frontend:latest ./frontend

# 4. Redeploy
kubectl create namespace app
kubectl create secret generic app-secrets --from-env-file=.env --namespace=app
kubectl apply -f k8s/deployment.yaml

# 5. Wait for pods
kubectl wait --for=condition=ready pod -l app=backend -n app --timeout=300s
kubectl wait --for=condition=ready pod -l app=frontend -n app --timeout=300s

# 6. Setup port-forward
kubectl port-forward -n app svc/backend 8000:8000 &
kubectl port-forward -n app svc/frontend 3000:3000 &

# 7. Verify
curl http://localhost:8000/health
curl -I http://localhost:3000
```

---

## Quick Links

- Kubernetes Docs: https://kubernetes.io/docs/
- kubectl Cheat Sheet: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- Minikube Docs: https://minikube.sigs.k8s.io/docs/
- Docker Docs: https://docs.docker.com/
- Next.js Docs: https://nextjs.org/docs
- FastAPI Docs: https://fastapi.tiangolo.com/

---

**Print this page and keep it handy during development!**
