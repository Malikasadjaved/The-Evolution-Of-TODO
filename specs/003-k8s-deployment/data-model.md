# Data Model: Kubernetes Infrastructure Resources

**Feature**: 003-k8s-deployment | **Date**: 2026-01-03
**Phase**: Phase 1 Design | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

## Summary

This document defines the Kubernetes infrastructure resources (Deployments, Services, ConfigMaps, Secrets) and their relationships for deploying the Todo application on Minikube.

**Note**: This is NOT database schema design. Application data models remain unchanged from Phase II/III. This documents infrastructure-as-code resources.

---

## Kubernetes Resource Topology

```
todo-app (Helm Release)
│
├── Namespace: default
│
├── ConfigMaps (non-secret configuration)
│   ├── backend-config
│   ├── frontend-web-config
│   └── frontend-chatbot-config
│
├── Secrets (sensitive data)
│   └── app-secrets (shared DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY)
│
├── Deployments (stateless applications)
│   ├── backend-deployment
│   │   ├── spec.replicas: 2
│   │   ├── selector.matchLabels: {app: backend}
│   │   └── template.spec.containers[0]:
│   │       ├── image: todo-backend:latest
│   │       ├── ports: [8000]
│   │       ├── env: (from ConfigMaps + Secrets)
│   │       ├── resources: {requests: 256Mi/250m, limits: 512Mi/500m}
│   │       ├── livenessProbe: GET /health
│   │       └── readinessProbe: GET /ready
│   │
│   ├── frontend-web-deployment
│   │   ├── spec.replicas: 2
│   │   ├── selector.matchLabels: {app: frontend-web}
│   │   └── template.spec.containers[0]:
│   │       ├── image: todo-frontend-web:latest
│   │       ├── ports: [3000]
│   │       ├── env: (from ConfigMaps + Secrets)
│   │       ├── resources: {requests: 128Mi/100m, limits: 256Mi/200m}
│   │       ├── livenessProbe: GET /
│   │       └── readinessProbe: GET /
│   │
│   └── frontend-chatbot-deployment
│       ├── spec.replicas: 2
│       ├── selector.matchLabels: {app: frontend-chatbot}
│       └── template.spec.containers[0]:
│           ├── image: todo-frontend-chatbot:latest
│           ├── ports: [3001]
│           ├── env: (from ConfigMaps + Secrets)
│           ├── resources: {requests: 128Mi/100m, limits: 256Mi/200m}
│           ├── livenessProbe: GET /
│           └── readinessProbe: GET /
│
└── Services (network exposure)
    ├── backend-service
    │   ├── type: ClusterIP (internal only)
    │   ├── selector: {app: backend}
    │   └── ports: [8000:8000]
    │
    ├── frontend-web-service
    │   ├── type: NodePort
    │   ├── selector: {app: frontend-web}
    │   └── ports: [3000:3000, nodePort: 30000]
    │
    └── frontend-chatbot-service
        ├── type: NodePort
        ├── selector: {app: frontend-chatbot}
        └── ports: [3001:3001, nodePort: 30001]
```

---

## Resource Definitions

### 1. Deployments

#### backend-deployment

**Purpose**: Manages 2 replicas of the FastAPI + MCP server application.

**Key Attributes**:
- **apiVersion**: `apps/v1`
- **kind**: `Deployment`
- **metadata**:
  - name: `backend`
  - labels: `{app: backend, tier: api, phase: iv}`
- **spec**:
  - replicas: `2`
  - selector.matchLabels: `{app: backend}`
  - strategy:
    - type: `RollingUpdate`
    - rollingUpdate:
      - maxUnavailable: `0` (zero downtime)
      - maxSurge: `1` (one extra pod during update)
  - template.metadata.labels: `{app: backend, tier: api}`
  - template.spec:
    - containers[0]:
      - name: `backend`
      - image: `todo-backend:latest`
      - imagePullPolicy: `IfNotPresent` (use Minikube Docker daemon)
      - ports[0]:
        - containerPort: `8000`
        - protocol: `TCP`
      - env: (see ConfigMap + Secret mapping below)
      - resources:
        - requests: `{memory: "256Mi", cpu: "250m"}`
        - limits: `{memory: "512Mi", cpu: "500m"}`
      - livenessProbe:
        - httpGet: `{path: /health, port: 8000}`
        - initialDelaySeconds: `10`
        - periodSeconds: `30`
        - timeoutSeconds: `3`
        - failureThreshold: `3`
      - readinessProbe:
        - httpGet: `{path: /ready, port: 8000}`
        - initialDelaySeconds: `5`
        - periodSeconds: `10`
        - timeoutSeconds: `3`
        - failureThreshold: `3`
    - securityContext:
      - runAsNonRoot: `true`
      - runAsUser: `1000`

**Relationships**:
- Depends on: `app-secrets`, `backend-config`
- Targeted by: `backend-service`

---

#### frontend-web-deployment

**Purpose**: Manages 2 replicas of the Next.js 16 web application.

**Key Attributes**:
- **apiVersion**: `apps/v1`
- **kind**: `Deployment`
- **metadata**:
  - name: `frontend-web`
  - labels: `{app: frontend-web, tier: frontend, phase: iv}`
- **spec**:
  - replicas: `2`
  - selector.matchLabels: `{app: frontend-web}`
  - strategy:
    - type: `RollingUpdate`
    - rollingUpdate:
      - maxUnavailable: `0`
      - maxSurge: `1`
  - template.metadata.labels: `{app: frontend-web, tier: frontend}`
  - template.spec:
    - containers[0]:
      - name: `frontend-web`
      - image: `todo-frontend-web:latest`
      - imagePullPolicy: `IfNotPresent`
      - ports[0]:
        - containerPort: `3000`
      - env: (see ConfigMap + Secret mapping)
      - resources:
        - requests: `{memory: "128Mi", cpu: "100m"}`
        - limits: `{memory: "256Mi", cpu: "200m"}`
      - livenessProbe:
        - httpGet: `{path: /, port: 3000}`
        - initialDelaySeconds: `15`
        - periodSeconds: `30`
      - readinessProbe:
        - httpGet: `{path: /, port: 3000}`
        - initialDelaySeconds: `10`
        - periodSeconds: `10`
    - securityContext:
      - runAsNonRoot: `true`
      - runAsUser: `1001`

**Relationships**:
- Depends on: `app-secrets`, `frontend-web-config`
- Targeted by: `frontend-web-service`

---

#### frontend-chatbot-deployment

**Purpose**: Manages 2 replicas of the Next.js 14 chatbot application.

**Key Attributes**:
- **apiVersion**: `apps/v1`
- **kind**: `Deployment`
- **metadata**:
  - name: `frontend-chatbot`
  - labels: `{app: frontend-chatbot, tier: frontend, phase: iv}`
- **spec**:
  - replicas: `2`
  - selector.matchLabels: `{app: frontend-chatbot}`
  - strategy:
    - type: `RollingUpdate`
    - rollingUpdate:
      - maxUnavailable: `0`
      - maxSurge: `1`
  - template.metadata.labels: `{app: frontend-chatbot, tier: frontend}`
  - template.spec:
    - containers[0]:
      - name: `frontend-chatbot`
      - image: `todo-frontend-chatbot:latest`
      - imagePullPolicy: `IfNotPresent`
      - ports[0]:
        - containerPort: `3001`
      - env: (see ConfigMap + Secret mapping)
      - resources:
        - requests: `{memory: "128Mi", cpu: "100m"}`
        - limits: `{memory: "256Mi", cpu: "200m"}`
      - livenessProbe:
        - httpGet: `{path: /, port: 3001}`
        - initialDelaySeconds: `15`
        - periodSeconds: `30`
      - readinessProbe:
        - httpGet: `{path: /, port: 3001}`
        - initialDelaySeconds: `10`
        - periodSeconds: `10`
    - securityContext:
      - runAsNonRoot: `true`
      - runAsUser: `1001`

**Relationships**:
- Depends on: `app-secrets`, `frontend-chatbot-config`
- Targeted by: `frontend-chatbot-service`

---

### 2. Services

#### backend-service

**Purpose**: Provides stable internal network endpoint for backend pods. Not externally accessible.

**Key Attributes**:
- **apiVersion**: `v1`
- **kind**: `Service`
- **metadata**:
  - name: `backend-service`
  - labels: `{app: backend, tier: api}`
- **spec**:
  - type: `ClusterIP` (internal only)
  - selector: `{app: backend}` (targets backend pods)
  - ports[0]:
    - name: `http`
    - protocol: `TCP`
    - port: `8000` (service port)
    - targetPort: `8000` (container port)

**Access**:
- Internal DNS: `backend-service.default.svc.cluster.local:8000`
- From frontend pods: `http://backend-service:8000`

**Relationships**:
- Targets: `backend-deployment` pods with label `app=backend`

---

#### frontend-web-service

**Purpose**: Exposes web UI externally via Minikube NodePort.

**Key Attributes**:
- **apiVersion**: `v1`
- **kind**: `Service`
- **metadata**:
  - name: `frontend-web-service`
  - labels: `{app: frontend-web, tier: frontend}`
- **spec**:
  - type: `NodePort` (external access)
  - selector: `{app: frontend-web}`
  - ports[0]:
    - name: `http`
    - protocol: `TCP`
    - port: `3000` (service port)
    - targetPort: `3000` (container port)
    - nodePort: `30000` (external access port)

**Access**:
- External: `minikube service frontend-web-service --url` → `http://192.168.49.2:30000`
- Internal: `http://frontend-web-service:3000`

**Relationships**:
- Targets: `frontend-web-deployment` pods with label `app=frontend-web`

---

#### frontend-chatbot-service

**Purpose**: Exposes chatbot UI externally via Minikube NodePort.

**Key Attributes**:
- **apiVersion**: `v1`
- **kind**: `Service`
- **metadata**:
  - name: `frontend-chatbot-service`
  - labels: `{app: frontend-chatbot, tier: frontend}`
- **spec**:
  - type: `NodePort`
  - selector: `{app: frontend-chatbot}`
  - ports[0]:
    - name: `http`
    - protocol: `TCP`
    - port: `3001`
    - targetPort: `3001`
    - nodePort: `30001`

**Access**:
- External: `minikube service frontend-chatbot-service --url` → `http://192.168.49.2:30001`
- Internal: `http://frontend-chatbot-service:3001`

**Relationships**:
- Targets: `frontend-chatbot-deployment` pods with label `app=frontend-chatbot`

---

### 3. ConfigMaps

#### backend-config

**Purpose**: Non-secret configuration for backend application.

**Key Attributes**:
- **apiVersion**: `v1`
- **kind**: `ConfigMap`
- **metadata**:
  - name: `backend-config`
  - labels: `{app: backend}`
- **data**:
  - `FRONTEND_URL`: `"http://localhost:3000"` (dev) or `"https://todo.example.com"` (prod)
  - `ALLOWED_ORIGINS`: `"http://localhost:3000"`
  - `LOG_LEVEL`: `"INFO"`
  - `ENVIRONMENT`: `"development"` or `"production"`

**Consumed By**: `backend-deployment` via `envFrom.configMapRef`

---

#### frontend-web-config

**Purpose**: Non-secret configuration for frontend-web application.

**Key Attributes**:
- **apiVersion**: `v1`
- **kind**: `ConfigMap`
- **metadata**:
  - name: `frontend-web-config`
- **data**:
  - `NEXT_PUBLIC_API_URL`: `"http://backend-service:8000"` (internal) or `"https://api.todo.example.com"` (prod)
  - `BETTER_AUTH_URL`: `"http://localhost:3000"` (dev)

**Consumed By**: `frontend-web-deployment` via `envFrom.configMapRef`

---

#### frontend-chatbot-config

**Purpose**: Non-secret configuration for frontend-chatbot application.

**Key Attributes**:
- **apiVersion**: `v1`
- **kind**: `ConfigMap`
- **metadata**:
  - name: `frontend-chatbot-config`
- **data**:
  - `VITE_API_URL`: `"http://backend-service:8000"`

**Consumed By**: `frontend-chatbot-deployment` via `envFrom.configMapRef`

---

### 4. Secrets

#### app-secrets

**Purpose**: Centralized storage for sensitive data shared across services.

**Key Attributes**:
- **apiVersion**: `v1`
- **kind**: `Secret`
- **type**: `Opaque`
- **metadata**:
  - name: `app-secrets`
  - labels: `{app: todo-app}`
- **data** (base64-encoded):
  - `DATABASE_URL`: `postgresql://user:pass@host/db` (Neon PostgreSQL connection string)
  - `BETTER_AUTH_SECRET`: `43-character secret key` (shared by backend and frontend-web)
  - `OPENAI_API_KEY`: `sk-...` (OpenAI API key for chatbot)

**Creation** (NOT committed to Git):
```bash
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=BETTER_AUTH_SECRET="..." \
  --from-literal=OPENAI_API_KEY="sk-..."
```

**Consumed By**:
- `backend-deployment`: All 3 secrets
- `frontend-web-deployment`: `BETTER_AUTH_SECRET`
- `frontend-chatbot-deployment`: `OPENAI_API_KEY`

**Security**:
- Never commit to version control (use secret.yaml.example template)
- Kubernetes encrypts Secrets at rest in etcd
- Access restricted by RBAC (default ServiceAccount has read-only access)

---

## Environment Variable Mapping

### Backend Container

| Variable | Source | Type | Value (dev) |
|----------|--------|------|-------------|
| `DATABASE_URL` | `app-secrets` | Secret | `postgresql://...` (Neon) |
| `BETTER_AUTH_SECRET` | `app-secrets` | Secret | `(43 chars)` |
| `OPENAI_API_KEY` | `app-secrets` | Secret | `sk-...` |
| `FRONTEND_URL` | `backend-config` | ConfigMap | `http://localhost:3000` |
| `ALLOWED_ORIGINS` | `backend-config` | ConfigMap | `http://localhost:3000` |
| `LOG_LEVEL` | `backend-config` | ConfigMap | `INFO` |
| `ENVIRONMENT` | `backend-config` | ConfigMap | `development` |

### Frontend-Web Container

| Variable | Source | Type | Value (dev) |
|----------|--------|------|-------------|
| `NEXT_PUBLIC_API_URL` | `frontend-web-config` | ConfigMap | `http://backend-service:8000` |
| `BETTER_AUTH_URL` | `frontend-web-config` | ConfigMap | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | `app-secrets` | Secret | `(same as backend)` |

### Frontend-Chatbot Container

| Variable | Source | Type | Value (dev) |
|----------|--------|------|-------------|
| `VITE_API_URL` | `frontend-chatbot-config` | ConfigMap | `http://backend-service:8000` |
| `VITE_OPENAI_API_KEY` | `app-secrets` | Secret | `sk-...` |

---

## Resource Capacity Planning

### Total Resource Requests (Minimum for Scheduling)

| Service | Pods | Memory Request | CPU Request | Total Memory | Total CPU |
|---------|------|----------------|-------------|--------------|-----------|
| Backend | 2 | 256Mi | 250m | 512Mi | 500m |
| Frontend-Web | 2 | 128Mi | 100m | 256Mi | 200m |
| Frontend-Chatbot | 2 | 128Mi | 100m | 256Mi | 200m |
| **TOTAL** | **6** | - | - | **1024Mi (1GB)** | **900m (0.9 CPU)** |

### Total Resource Limits (Maximum Allowed)

| Service | Pods | Memory Limit | CPU Limit | Total Memory | Total CPU |
|---------|------|--------------|-----------|--------------|-----------|
| Backend | 2 | 512Mi | 500m | 1024Mi (1GB) | 1000m (1 CPU) |
| Frontend-Web | 2 | 256Mi | 200m | 512Mi | 400m (0.4 CPU) |
| Frontend-Chatbot | 2 | 256Mi | 200m | 512Mi | 400m (0.4 CPU) |
| **TOTAL** | **6** | - | - | **2048Mi (2GB)** | **1800m (1.8 CPU)** |

### Minikube Cluster Capacity

| Resource | Allocated | Available for Apps | Usage % |
|----------|-----------|-------------------|---------|
| CPUs | 4 | 3 (1 reserved for system) | 60% (1.8 / 3) |
| Memory | 8GB | 6GB (2GB reserved for system) | 33% (2GB / 6GB) |

**Status**: ✅ PASS - Within 70% target capacity (Phase IV constitution requirement).

---

## State Transitions & Lifecycle

### Deployment Rollout Sequence

1. **Initial State**: No resources exist
2. **Secret Creation**: `kubectl create secret generic app-secrets ...` (manual)
3. **Helm Install**: `helm install todo-app ./helm-charts/todo-app`
4. **Resource Creation**:
   - ConfigMaps created first
   - Deployments created (Pending → ContainerCreating → Running)
   - Services created (endpoints populated when pods Ready)
5. **Rolling Update** (when image changes):
   - New pods created (maxSurge: 1)
   - Wait for new pods to be Ready (readiness probe passes)
   - Old pods terminated (maxUnavailable: 0 ensures no downtime)
6. **Rollback**: `helm rollback todo-app` → reverts to previous release

### Pod Lifecycle

1. **Pending**: Scheduled to node, waiting for image pull
2. **ContainerCreating**: Image pulled, container starting
3. **Running**: Container running, health checks executing
   - Liveness probe failure → Container restarted
   - Readiness probe failure → Removed from Service endpoints (no traffic)
4. **Terminating**: SIGTERM sent, graceful shutdown (30s grace period)
5. **CrashLoopBackOff**: Repeated failures, exponential backoff restarts

---

## Validation Rules

### Deployment Constraints

- **Replicas**: Must be >= 2 (high availability)
- **ImagePullPolicy**: `IfNotPresent` for Minikube (avoid registry pull)
- **Resources**: Requests < Limits (guaranteed vs maximum)
- **Probes**: Both liveness and readiness required (Phase IV constitution)
- **Security**: `runAsNonRoot: true` and `runAsUser: 1000+` (non-root user)

### Service Constraints

- **Selector**: Must match Deployment labels exactly
- **TargetPort**: Must match container port
- **NodePort**: Range 30000-32767 (avoid conflicts)

### ConfigMap/Secret Constraints

- **Secrets**: Never commit to Git (use `.gitignore`, provide template only)
- **ConfigMap**: No sensitive data (use Secrets instead)
- **Naming**: Consistent prefix (`backend-`, `frontend-web-`, `frontend-chatbot-`)

---

## Relationships & Dependencies

```mermaid
graph TD
    A[app-secrets] -->|DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY| B[backend-deployment]
    C[backend-config] -->|FRONTEND_URL, LOG_LEVEL| B
    B -->|labeled app=backend| D[backend-service]

    E[frontend-web-config] -->|NEXT_PUBLIC_API_URL| F[frontend-web-deployment]
    A -->|BETTER_AUTH_SECRET| F
    F -->|labeled app=frontend-web| G[frontend-web-service]

    H[frontend-chatbot-config] -->|VITE_API_URL| I[frontend-chatbot-deployment]
    A -->|OPENAI_API_KEY| I
    I -->|labeled app=frontend-chatbot| J[frontend-chatbot-service]

    G -->|external access| K[User Browser]
    J -->|external access| K
    K -->|API calls| D
```

---

## Next Steps (Phase 1 Continuation)

1. **Generate API Contracts** (`contracts/` directory):
   - Helm chart values.yaml schema
   - Resource templates contract
   - Service endpoint contracts

2. **Create Quickstart Guide** (`quickstart.md`):
   - Minikube installation and setup
   - Docker image building
   - Helm chart deployment
   - Service access and verification

3. **Update Agent Context**:
   - Add Kubernetes, Helm, Docker technologies
   - Enable kubectl-ai, kagent usage in future prompts

---

**Phase 1 Data Model Complete**: All infrastructure resources defined. Proceed to contracts and quickstart.
