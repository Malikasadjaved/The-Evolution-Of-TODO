# Kubernetes Deployment Blueprint

**Version**: 1.0.0
**Target**: Stateless multi-service applications
**Environment**: Kubernetes 1.25+ (Minikube, EKS, GKE, AKS)
**Status**: Production-ready ✅

---

## Overview

This blueprint provides a complete, reusable pattern for deploying stateless microservices to Kubernetes with production-grade configuration, health monitoring, resource management, and automated rollback capabilities.

**Based on**: "Evolution of TODO" Phase IV Kubernetes Deployment (specs/003-k8s-deployment/)

**Applies to**:
- Multi-service applications (backend API + frontend UIs)
- Stateless service architectures
- Applications with external databases (PostgreSQL, etc.)
- Helm-managed deployments

---

## Blueprint Structure

```
project-root/
├── docker/                          # Container image definitions
│   ├── backend.Dockerfile           # FastAPI or Python backend
│   ├── frontend-web.Dockerfile      # Next.js web UI
│   └── frontend-api.Dockerfile      # Additional frontend services
│
├── k8s/                            # Raw Kubernetes manifests (reference)
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-web-deployment.yaml
│   ├── frontend-web-service.yaml
│   ├── secret.yaml.example
│   └── configmap.yaml.example
│
├── helm-charts/todo-app/           # Helm chart (preferred for deployment)
│   ├── Chart.yaml
│   ├── values.yaml                 # Default configuration
│   ├── values-dev.yaml             # Minikube/local overrides
│   ├── values-prod.yaml            # Production overrides
│   ├── templates/
│   │   ├── _helpers.tpl            # Common labels and selectors
│   │   ├── deployment-backend.yaml
│   │   ├── deployment-frontend-web.yaml
│   │   ├── service-backend.yaml
│   │   ├── service-frontend-web.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── NOTES.txt               # Post-install instructions
│   │   └── hpa.yaml                # Horizontal pod autoscaler
│
├── scripts/
│   ├── build-images.sh             # Build Docker images
│   ├── deploy-minikube.sh           # Full deployment automation
│   ├── health-check.sh              # Smoke tests post-deployment
│   ├── cleanup.sh                   # Cleanup/rollback
│   └── ai-gen/                      # AI-generated documentation
│       ├── docker-ai-prompts.md
│       ├── kubectl-ai-prompts.md
│       └── cluster-analysis.txt
│
├── docs/
│   ├── DEPLOYMENT.md                # Step-by-step deployment guide
│   ├── TROUBLESHOOTING.md           # Common issues and fixes
│   ├── ARCHITECTURE.md              # Service topology, network flow
│   └── ENVIRONMENT-SETUP.md         # Prerequisites, tools setup
│
└── .dockerignore                    # Docker build context optimization
```

---

## Core Components

### 1. Multi-Stage Docker Images
- Separate build and runtime stages
- Non-root user execution
- HEALTHCHECK instructions
- Target sizes: Backend <500MB, Frontends <300MB

### 2. Kubernetes Deployments
- RollingUpdate strategy (zero-downtime)
- Liveness + Readiness probes
- Resource requests AND limits
- ConfigMap + Secrets for configuration

### 3. Kubernetes Services
- Backend as ClusterIP (internal)
- Frontend as NodePort/LoadBalancer (external)
- Stateless (no session affinity)

### 4. Helm Charts
- Environment-specific values files
- One-command deployment
- Templated manifests

### 5. Health Monitoring
- Startup, Readiness, Liveness probes
- Application health endpoints (/health, /ready)
- Automatic pod restart on failure

### 6. Resource Management
- CPU/Memory requests for scheduling
- CPU/Memory limits to prevent starvation
- Total requests <70% node capacity (Phase IV constitution)

### 7. Horizontal Pod Autoscaling
- Scale based on CPU/Memory metrics
- Configurable min/max replicas
- Smooth scale-up and scale-down

### 8. Deployment Automation
- One-command deployment scripts
- Smoke tests post-deployment
- Easy rollback via Helm

---

## Key Patterns

### Pattern: Container Resource Sizing

```
Backend (FastAPI):
  Requests: 250m CPU, 256Mi memory
  Limits: 500m CPU, 512Mi memory

Frontend (Next.js):
  Requests: 100m CPU, 128Mi memory
  Limits: 200m CPU, 256Mi memory

2 Backend + 2 Frontend = 700m CPU, 768Mi memory requests
On 1 CPU, 2GB Minikube = 70% utilization ✅
```

### Pattern: Zero-Downtime Deployments

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1           # One extra pod during update
    maxUnavailable: 0     # Never take down all pods
```

### Pattern: Health-Based Orchestration

```yaml
# Prevents routing to starting/broken pods
readinessProbe:
  httpGet:
    path: /ready
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3

# Restarts stuck containers
livenessProbe:
  httpGet:
    path: /health
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
```

### Pattern: Configuration Externalization

```
ConfigMap: Non-secret configuration (FRONTEND_URL, LOG_LEVEL, etc.)
Secret: Sensitive data (DATABASE_URL, API_KEYS, etc.)
Both injected as environment variables at runtime
No hardcoding in container images
```

---

## Deployment Checklist

- [ ] Docker images built and tested locally
- [ ] Multi-stage build optimizes size
- [ ] Non-root user in container
- [ ] HEALTHCHECK instruction present
- [ ] Kubernetes manifests validated (helm lint)
- [ ] Resource requests + limits set
- [ ] Health probes configured
- [ ] ConfigMaps created for config
- [ ] Secrets created for sensitive data (not in git)
- [ ] Helm chart tested with values-dev.yaml
- [ ] Helm deployment succeeds
- [ ] All pods reach Running state
- [ ] Services have endpoints
- [ ] Health checks pass (smoke tests)
- [ ] DNS resolution works
- [ ] Port forwarding accessible
- [ ] Logs viewable via kubectl
- [ ] Rollback tested (helm rollback works)

---

## Common Operations

### Deploy Application
```bash
helm install todo-app helm-charts/todo-app -f helm-charts/todo-app/values-dev.yaml
```

### Update Deployment
```bash
helm upgrade todo-app helm-charts/todo-app -f helm-charts/todo-app/values-dev.yaml
```

### Rollback to Previous
```bash
helm rollback todo-app
```

### Scale Manual
```bash
kubectl scale deployment/backend --replicas=5
```

### Monitor Rollout
```bash
kubectl rollout status deployment/backend -w
```

### View Logs
```bash
kubectl logs -f deployment/backend
```

### Debug Pod
```bash
kubectl describe pod <pod-name>
kubectl exec -it <pod-name> -- /bin/bash
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Only limits, no requests | Scheduler can't guarantee resources | Set both requests and limits |
| Using `latest` tag in production | Rollbacks fail, versions unknown | Use specific version tags |
| No health probes | Dead containers stay running | Implement /health and /ready |
| All pods on one node | Node failure = total outage | Use 2+ replicas with affinity |
| Hardcoded configuration | Can't change without rebuilding | Use ConfigMap + Secrets |
| No resource limits | Pod can starve others | Set memory and CPU limits |
| Stateful services | Doesn't scale; loses data | Use databases for persistence |
| Manual deployments | Error-prone, inconsistent | Use Helm or CI/CD |

---

## References & Links

- **Kubernetes Docs**: https://kubernetes.io/docs/
- **Helm Docs**: https://helm.sh/docs/
- **This Skill**: `.claude/skills/k8s-troubleshooting/`
- **Phase IV Spec**: `specs/003-k8s-deployment/`
- **Example Manifests**: `helm-charts/todo-app/templates/`

---

**Status**: ✅ Production-Ready
**Last Updated**: 2025-01-08
**Based on**: Evolution of TODO Phase IV Kubernetes Deployment
