# ADR 002: Minikube for Phase IV Local Kubernetes Deployment

**Date**: 2026-01-03
**Status**: Accepted
**Context**: Phase IV Kubernetes Deployment
**Decision Makers**: Claude Code + User

---

## Context

Phase IV requires deploying the Todo application to Kubernetes. The application consists of 3 services (backend, frontend-web, frontend-chatbot) that need orchestration, scaling, and configuration management.

**Deployment Target Options**:
1. Local Kubernetes (Minikube, kind, k3d, Docker Desktop Kubernetes)
2. Cloud Managed Kubernetes (AKS, GKE, EKS, DOKS)
3. Hybrid (local dev, cloud staging/prod)

**Phase IV Constitution Requirements**:
- Development-production parity (Section V)
- Reproducible deployments
- Helm chart standardization
- Resource capacity planning (6 pods, ~2GB RAM, ~1.8 CPU)

---

## Decision

**We will use Minikube for Phase IV local Kubernetes deployment.**

### Minikube Configuration
- **CPUs**: 4
- **Memory**: 8GB
- **Disk**: 20GB
- **Driver**: Docker (container-based nodes)
- **Addons**: metrics-server, dashboard

**Rationale**: Minikube provides a full Kubernetes cluster locally, free of cost, with production-like features (multi-node support, ingress, persistent volumes) ideal for development and learning.

---

## Options Considered

### Option 1: Minikube - **SELECTED**
- **Pros**:
  - ✅ Full Kubernetes API compatibility
  - ✅ Free, no cloud costs
  - ✅ Multi-node support (can simulate production topology)
  - ✅ Rich addon ecosystem (metrics-server, dashboard, ingress)
  - ✅ Excellent documentation and community support
  - ✅ Works on Windows, macOS, Linux
  - ✅ Docker driver uses existing Docker Desktop installation
- **Cons**:
  - ⚠️ Requires 4 CPUs, 8GB RAM (acceptable for modern dev machines)
  - ⚠️ Limited to local network (no external ingress without tunneling)
- **Decision**: **ACCEPTED** - Best for learning, development, and Phase IV hackathon requirements

### Option 2: kind (Kubernetes in Docker)
- **Pros**:
  - Lightweight (runs in Docker containers)
  - Fast startup (~30 seconds)
  - Good for CI/CD testing
- **Cons**:
  - Less feature-rich than Minikube (fewer addons)
  - No built-in dashboard
  - Less beginner-friendly
- **Decision**: **REJECTED** - Minikube's addons and dashboard provide better developer experience

### Option 3: k3d (k3s in Docker)
- **Pros**:
  - Extremely lightweight (k3s is minimal Kubernetes)
  - Very fast startup
  - Good for edge computing scenarios
- **Cons**:
  - Not full Kubernetes (k3s has some API differences)
  - Less addons than Minikube
  - Smaller community
- **Decision**: **REJECTED** - Want full Kubernetes API for production parity

### Option 4: Docker Desktop Kubernetes
- **Pros**:
  - Built into Docker Desktop (no separate install)
  - Simple toggle in settings
- **Cons**:
  - Single-node only (no multi-node simulation)
  - Limited addons
  - Resource intensive (runs alongside Docker)
  - Less flexibility than Minikube
- **Decision**: **REJECTED** - Minikube offers more features and flexibility

### Option 5: Cloud Managed Kubernetes (AKS/GKE/EKS)
- **Pros**:
  - Production-like environment
  - Managed control plane
  - Cloud-native integrations (load balancers, storage)
- **Cons**:
  - **Costs money** ($2-5/day for cluster + resources)
  - Requires cloud account setup
  - Slower iteration (image push, pull, deploy latency)
  - Network egress charges
  - Overkill for Phase IV (local development)
- **Decision**: **REJECTED FOR PHASE IV** - Reserved for Phase V (cloud deployment)

### Option 6: Hybrid (Minikube dev + Cloud staging)
- **Pros**:
  - Best of both worlds (local dev speed + cloud staging)
  - Same Helm charts work in both environments
- **Cons**:
  - More complexity
  - Requires managing two environments
  - Cloud costs
- **Decision**: **DEFERRED TO PHASE V** - Phase IV focuses on local deployment mastery

---

## Rationale

### Learning Value
- Minikube provides full Kubernetes experience (pods, services, deployments, configmaps, secrets, ingress, persistent volumes)
- Hackathon judges can see complete Kubernetes deployment workflow
- Skills transfer directly to cloud Kubernetes (AKS, GKE, EKS)

### Cost Efficiency
- **$0 cost** - runs locally on developer's machine
- No cloud account required
- No egress charges, no load balancer costs

### Development Velocity
- **Fast iteration**: Build image → deploy → test cycle ~1-2 minutes
- No image push/pull to external registry (uses Minikube Docker daemon)
- Instant rollback with `helm rollback`
- Easy debugging: `kubectl logs`, `kubectl exec`, `minikube dashboard`

### Resource Adequacy
- Application requires: 1GB RAM requests, 2GB RAM limits, 0.9 CPU requests, 1.8 CPU limits
- Minikube cluster (4 CPUs, 8GB RAM) provides: 3 CPUs and 6GB RAM for apps (after system overhead)
- **Usage**: 60% CPU, 33% RAM - well within 70% target ✅

### Production Parity
- Same Helm charts work in Minikube and cloud Kubernetes
- Same kubectl commands
- Same YAML manifests
- **Development-production parity** (Phase IV constitution Section V)

---

## Consequences

### Positive
- ✅ Zero cost for Phase IV development and hackathon demo
- ✅ Full Kubernetes feature set (production parity)
- ✅ Fast iteration cycle (local builds, instant deployment)
- ✅ Comprehensive learning experience (all Kubernetes concepts)
- ✅ Easy troubleshooting (logs, exec, dashboard)
- ✅ Reproducible environment (minikube start with same config)

### Negative
- ⚠️ Not accessible from external network (NodePort requires Minikube IP)
- ⚠️ Single-machine limitation (can't distribute across multiple physical machines)
- ⚠️ Local resource constraints (limited by developer's laptop specs)

### Neutral
- Requires Minikube installation (one-time setup, ~5 minutes)
- Minikube cluster persists across reboots (`minikube stop` / `minikube start`)
- Can run multiple Minikube profiles for different projects

---

## Implementation

### Setup Commands
```bash
# Install Minikube (macOS)
brew install minikube

# Install Minikube (Windows)
choco install minikube

# Install Minikube (Linux)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start cluster
minikube start --cpus=4 --memory=8192 --disk-size=20g --driver=docker

# Enable addons
minikube addons enable metrics-server
minikube addons enable dashboard

# Verify
kubectl get nodes
# Expected: minikube   Ready   control-plane   1m   v1.28.x
```

### Accessing Services
```bash
# NodePort services (external access)
minikube service frontend-web-service --url
# Output: http://192.168.49.2:30000

# Port forwarding (for ClusterIP services)
kubectl port-forward svc/backend-service 8000:8000

# Dashboard
minikube dashboard
```

---

## Migration Path to Cloud (Phase V)

When transitioning to cloud in Phase V:

1. **Same Helm Chart**: Use existing `helm-charts/todo-app/` with production values file
2. **Cloud-Specific Values**: Create `values-prod.yaml` with:
   - LoadBalancer service type (instead of NodePort)
   - Ingress with TLS certificates
   - Cloud storage classes for persistent volumes
   - Higher replica counts (auto-scaling)
3. **Image Registry**: Push images to cloud registry (ECR, GCR, ACR)
4. **DNS Configuration**: Map custom domain to Ingress load balancer
5. **Monitoring**: Add Prometheus, Grafana for observability

**Effort Estimate**: 2-3 hours (Helm charts remain 95% unchanged)

---

## Alternatives for Future Consideration

### Phase V (Cloud Deployment):
- **DigitalOcean Kubernetes (DOKS)**: $12/month managed cluster (cheapest option)
- **Azure Kubernetes Service (AKS)**: Free control plane, pay for nodes (~$50/month)
- **Google Kubernetes Engine (GKE)**: Autopilot mode (pay per pod resource)
- **AWS EKS**: $0.10/hour control plane + EC2 instances (~$70/month)

### Phase VI (Production Hardening):
- Multi-region deployment with GeoDNS
- Service mesh (Istio, Linkerd) for advanced traffic management
- GitOps automation (Flux, ArgoCD) for continuous deployment

---

## References

- Phase IV Constitution Section V: Minikube Local Development
- Minikube Documentation: https://minikube.sigs.k8s.io/docs/
- Kubernetes Documentation: https://kubernetes.io/docs/
- Quickstart Guide: `specs/003-k8s-deployment/quickstart.md`

---

**Decision**: ACCEPTED | **Reviewed by**: User | **Implemented in**: Phase IV Development
