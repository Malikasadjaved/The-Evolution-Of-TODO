---
name: k8s-deployment
description: |
  Generate production-ready Kubernetes deployments with embedded cloud-native best practices.
  This skill should be used when users need to deploy applications to Kubernetes (Minikube, EKS, GKE, AKS).
  Handles StatefulSets, Deployments, Services, ConfigMaps, Secrets, resource management, health probes,
  security contexts, and environment-specific configurations. Works for any application stack.
---

# Kubernetes Deployment Builder

Generate production-ready Kubernetes deployment manifests following cloud-native best practices.

## What This Skill Does

- Creates Deployment/StatefulSet manifests with proper resource limits
- Generates Service definitions (ClusterIP, NodePort, LoadBalancer)
- Configures ConfigMaps for non-secret configuration
- Sets up Secret templates (never populates actual values)
- Implements health probes (liveness, readiness, startup)
- Applies security contexts (non-root, read-only filesystem)
- Adapts to environment (Minikube, cloud providers)

## What This Skill Does NOT Do

- Deploy to cluster (use kubectl/helm commands manually)
- Generate Helm charts (use helm-chart-gen skill instead)
- Troubleshoot existing deployments (use k8s-troubleshoot skill)
- Validate manifest quality (use k8s-manifest-validator skill)

---

## Before Implementation

Gather context to ensure successful deployment manifest generation:

| Source | Gather |
|--------|--------|
| **Codebase** | Existing Dockerfiles, current deployment manifests, application port/health endpoints |
| **Conversation** | Application name, target environment (Minikube/cloud), resource requirements, replicas |
| **Skill References** | K8s patterns from `references/` (deployment strategies, resource sizing, probe configuration) |
| **User Guidelines** | Team conventions (labels, annotations, naming), cluster constraints (resource limits, storage) |

Ensure all required context is gathered before generating manifests.
Only ask user for THEIR specific requirements (K8s expertise is embedded in this skill).

---

## Required Clarifications

Ask user for THEIR specific deployment context (not K8s knowledge):

### Application Context

**1. What application are you deploying?**
- Application name (e.g., "backend-api", "frontend-web")
- Container image name and tag (e.g., "myapp:v1.2.3")
- Exposed port(s) (e.g., 8000, 3000)

**2. What's your target environment?**
- Minikube (local development)
- Cloud provider (EKS, GKE, AKS)
- Bare-metal/on-premise

**3. What workload type?**
- Stateless API/web service → **Deployment**
- Stateful application (database, cache) → **StatefulSet**
- Background job/worker → **Deployment** (no Service)

### Resource Requirements

**4. Resource constraints?**
| Environment | CPU Request | Memory Request | CPU Limit | Memory Limit |
|-------------|-------------|----------------|-----------|--------------|
| **Development** | 100m | 128Mi | 200m | 256Mi |
| **Production** | 250m | 256Mi | 500m | 512Mi |
| **Resource-limited** | 50m | 64Mi | 100m | 128Mi |

Ask: "Which environment? Any custom resource needs?"

**5. Scaling requirements?**
- Single replica (dev, low traffic)
- Multiple replicas (production, high availability)
- Autoscaling (HPA with CPU/memory targets)

### Configuration

**6. Configuration needs?**
- Environment variables (non-secret): `LOG_LEVEL`, `FRONTEND_URL`, `ENVIRONMENT`
- Secrets: `DATABASE_URL`, `API_KEY`, `JWT_SECRET`
- ConfigMap files: `config.json`, `nginx.conf`

**7. Health check endpoints?**
- Liveness probe path (e.g., `/health`)
- Readiness probe path (e.g., `/ready` or `/health`)
- Startup probe needed? (for slow-starting apps)

---

## Output Specification

Generate these Kubernetes manifests:

### 1. Deployment or StatefulSet

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <app-name>
  labels:
    app: <app-name>
    version: <version>
spec:
  replicas: <replica-count>
  selector:
    matchLabels:
      app: <app-name>
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0  # Zero-downtime deployments
      maxSurge: 1
  template:
    metadata:
      labels:
        app: <app-name>
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: <container-name>
        image: <image>:<tag>
        imagePullPolicy: <policy>  # IfNotPresent (Minikube), Always (production)
        ports:
        - containerPort: <port>
          protocol: TCP
          name: http
        env:
        - name: <ENV_VAR>
          value: "<value>"
        - name: <SECRET_VAR>
          valueFrom:
            secretKeyRef:
              name: <secret-name>
              key: <secret-key>
        resources:
          requests:
            memory: "<memory-request>"
            cpu: "<cpu-request>"
          limits:
            memory: "<memory-limit>"
            cpu: "<cpu-limit>"
        livenessProbe:
          httpGet:
            path: /health
            port: <port>
          initialDelaySeconds: 10
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: <port>
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: false  # Set true if app doesn't write to disk
```

### 2. Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: <service-name>
  labels:
    app: <app-name>
spec:
  type: <service-type>  # ClusterIP (internal), NodePort (Minikube), LoadBalancer (cloud)
  selector:
    app: <app-name>
  ports:
  - name: http
    protocol: TCP
    port: <service-port>
    targetPort: <container-port>
    # nodePort: 30000  # Only for NodePort type
```

### 3. ConfigMap (if needed)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: <app-name>-config
data:
  LOG_LEVEL: "INFO"
  ENVIRONMENT: "production"
  # Add other non-secret config
```

### 4. Secret Template (never populate)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: <app-name>-secrets
type: Opaque
data:
  # Base64-encoded values (DO NOT populate in manifest)
  # Create separately with: kubectl create secret generic <name> --from-literal=KEY=value
  DATABASE_URL: <base64-value>
  API_KEY: <base64-value>
```

---

## Standards & Best Practices

### Security (Non-Negotiable)

- ✅ `runAsNonRoot: true` (security context)
- ✅ `runAsUser: 1000` (non-root UID)
- ✅ `allowPrivilegeEscalation: false` (container security)
- ✅ Secrets via `secretKeyRef` (never hardcoded)
- ✅ `imagePullPolicy: Always` for production (prevent stale images)

### Resource Management

- ✅ **Always** define `requests` AND `limits`
- ✅ CPU requests: 50m-250m (dev), 250m-500m (prod)
- ✅ Memory requests: 64Mi-256Mi (dev), 256Mi-512Mi (prod)
- ✅ Limits: 2x requests (e.g., 256Mi request → 512Mi limit)

### Health Probes

- ✅ **Liveness probe**: Restart if app is deadlocked (HTTP GET /health)
- ✅ **Readiness probe**: Remove from load balancer if not ready (HTTP GET /ready)
- ✅ **Startup probe**: For slow-starting apps (initialDelaySeconds: 60+)
- ✅ `failureThreshold: 3` (avoid flapping)

### Labels & Annotations

```yaml
labels:
  app: <name>                    # Required: service selector
  version: <version>              # Recommended: for rollouts
  component: <backend/frontend>   # Optional: architecture layer
  tier: <api/web/cache>          # Optional: logical tier
```

### Environment-Specific Patterns

| Environment | ImagePullPolicy | Service Type | Replicas | Resource Limits |
|-------------|-----------------|--------------|----------|-----------------|
| **Minikube** | IfNotPresent | NodePort | 1 | Lower (128Mi/100m) |
| **Cloud Dev** | Always | LoadBalancer | 1-2 | Medium (256Mi/250m) |
| **Production** | Always | LoadBalancer | 3+ | Higher (512Mi/500m) |

---

## Implementation Checklist

Before delivering manifests, verify:

### Manifest Structure
- [ ] Deployment/StatefulSet with proper `apiVersion: apps/v1`
- [ ] Service with correct selector (matches Deployment labels)
- [ ] ConfigMap for non-secret config (if needed)
- [ ] Secret template (never populated with actual values)

### Security
- [ ] `runAsNonRoot: true` in pod security context
- [ ] `runAsUser: 1000` (or other non-root UID)
- [ ] `allowPrivilegeEscalation: false` in container security context
- [ ] Secrets referenced via `secretKeyRef` (not hardcoded)

### Resource Management
- [ ] CPU requests defined (50m-500m)
- [ ] Memory requests defined (64Mi-512Mi)
- [ ] CPU limits defined (2x requests)
- [ ] Memory limits defined (2x requests)

### Health Probes
- [ ] Liveness probe configured (HTTP GET or exec)
- [ ] Readiness probe configured (HTTP GET or exec)
- [ ] `initialDelaySeconds` appropriate for app startup time
- [ ] `failureThreshold: 3` (avoid restart loops)

### Environment Adaptation
- [ ] `imagePullPolicy` matches environment (IfNotPresent for Minikube, Always for cloud)
- [ ] Service type matches environment (NodePort for Minikube, LoadBalancer for cloud)
- [ ] Resource limits appropriate for environment (lower for dev, higher for prod)

### Deployment Strategy
- [ ] `strategy.type: RollingUpdate` for zero-downtime
- [ ] `maxUnavailable: 0` (never have all pods down)
- [ ] `maxSurge: 1` (add one pod at a time)

---

## Common Patterns

See `references/deployment-patterns.md` for:
- StatefulSet patterns (persistent storage, ordered deployment)
- DaemonSet patterns (node-level agents)
- Job/CronJob patterns (batch processing, scheduled tasks)
- Init containers (pre-startup tasks)

See `references/resource-sizing.md` for:
- Right-sizing CPU/memory based on load testing
- Autoscaling (HPA) configuration
- Resource quotas and limit ranges

See `references/probe-configuration.md` for:
- Health check best practices
- Startup probe for slow apps (30+ second startup)
- Exec probes for non-HTTP services

---

## Reference Files

| File | When to Read |
|------|--------------|
| `references/deployment-patterns.md` | StatefulSet, DaemonSet, Job patterns |
| `references/resource-sizing.md` | CPU/memory calculations, autoscaling |
| `references/probe-configuration.md` | Health probe strategies |
| `references/security-contexts.md` | Pod/container security hardening |
| `references/service-types.md` | ClusterIP vs NodePort vs LoadBalancer |
| `references/anti-patterns.md` | Common Kubernetes mistakes to avoid |
| `assets/examples/` | Example manifests for common stacks |

---

## Example Usage

**User**: "Deploy my FastAPI backend on Minikube"

**Claude gathers**:
- Codebase: Finds `docker/backend.Dockerfile`, sees port 8000, `/health` endpoint
- Conversation: Asks about replicas (1 for dev), resources (limited cluster)
- References: Reads `deployment-patterns.md` for Deployment strategy
- User guidelines: Checks for existing label conventions

**Claude generates**:
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 1
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
      - name: backend
        image: backend:latest
        imagePullPolicy: IfNotPresent  # Minikube
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
---
# backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  type: NodePort  # Minikube
  selector:
    app: backend
  ports:
  - port: 8000
    targetPort: 8000
    nodePort: 30000
```

---

**Skill Type**: Builder | **Domain**: Kubernetes | **Version**: 2.0.0
