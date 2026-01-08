# Kubernetes Architecture

**Phase IV: Todo Application Kubernetes Deployment Architecture**

This document describes the Kubernetes architecture, service topology, and component interactions for the Todo Application.

---

## Table of Contents

1. [Overview](#overview)
2. [Service Topology](#service-topology)
3. [Component Architecture](#component-architecture)
4. [Network Architecture](#network-architecture)
5. [Data Flow](#data-flow)
6. [Resource Management](#resource-management)
7. [Security Architecture](#security-architecture)
8. [Scaling Strategy](#scaling-strategy)

---

## Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Minikube Cluster                         │
│                      (4 CPUs, 8GB RAM)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐│
│  │   Frontend-Web   │  │ Frontend-Chatbot │  │    Backend    ││
│  │   (Next.js)      │  │     (React)      │  │   (FastAPI)   ││
│  │                  │  │                  │  │               ││
│  │  Replicas: 2     │  │  Replicas: 2     │  │  Replicas: 2  ││
│  │  Port: 3000      │  │  Port: 3001      │  │  Port: 8000   ││
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘│
│           │                     │                     │        │
│  ┌────────▼─────────────────────▼─────────────────────▼──────┐ │
│  │              Kubernetes Services (ClusterIP)             │ │
│  │  - todo-app-frontend-web (NodePort 30000)               │ │
│  │  - todo-app-frontend-chatbot (NodePort 30001)           │ │
│  │  - todo-app-backend (ClusterIP)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ External Database Connection
                               ▼
                    ┌──────────────────────┐
                    │   Neon PostgreSQL    │
                    │   (Cloud Hosted)     │
                    │                      │
                    │  Tables:             │
                    │  - users             │
                    │  - tasks             │
                    │  - tags              │
                    │  - conversations     │
                    │  - messages          │
                    └──────────────────────┘
```

---

## Service Topology

### Kubernetes Resources

| Resource Type | Name | Replicas | Port | Access |
|--------------|------|----------|------|--------|
| **Deployment** | `todo-app-backend` | 2 | 8000 | Internal |
| **Deployment** | `todo-app-frontend-web` | 2 | 3000 | NodePort 30000 |
| **Deployment** | `todo-app-frontend-chatbot` | 2 | 3001 | NodePort 30001 |
| **Service** | `todo-app-backend` | - | 8000 | ClusterIP |
| **Service** | `todo-app-frontend-web` | - | 80 → 3000 | NodePort |
| **Service** | `todo-app-frontend-chatbot` | - | 80 → 3001 | NodePort |
| **Secret** | `app-secrets` | - | - | Environment |
| **ConfigMap** | `todo-app-config` (optional) | - | - | Configuration |
| **HPA** | `todo-app-backend-hpa` | 2-5 | - | Auto-scaling |

---

### Service Communication

```
┌─────────────────────────────────────────────────────────────┐
│                      User Access Layer                       │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
  [Web Browser]    [Chat Interface]   [API Client]
        │                 │                 │
        │                 │                 │
        ▼                 ▼                 ▼
  http://192.168.49.2:30000  http://192.168.49.2:30001  http://localhost:8000
        │                 │                 │
┌───────▼─────────────────▼─────────────────▼───────────────┐
│               Minikube NodePort Layer                      │
│  - Exposes services to external network                    │
│  - Load balances across pod replicas                       │
└────────────────────────────────────────────────────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌────────────────┐  ┌─────────────────┐  ┌──────────────┐
│ Frontend-Web   │  │ Frontend-Chatbot│  │   Backend    │
│   Service      │  │     Service     │  │   Service    │
│  (NodePort)    │  │   (NodePort)    │  │ (ClusterIP)  │
└────────────────┘  └─────────────────┘  └──────────────┘
        │                 │                 │
        │                 │                 │
        │                 └─────────┐       │
        │                           │       │
        └───────────────────────────┼───────┘
                                    │
                         ┌──────────▼─────────┐
                         │   Backend Pods     │
                         │   (Load Balanced)  │
                         └──────────┬─────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  Neon PostgreSQL     │
                         │  (External)          │
                         └──────────────────────┘
```

---

## Component Architecture

### 1. Backend (FastAPI)

**Deployment Spec:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-app-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: todo-backend:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_URL
        - name: BETTER_AUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: BETTER_AUTH_SECRET
        - name: FRONTEND_URL
          value: "http://192.168.49.2:30000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 15
          periodSeconds: 5
```

**Responsibilities:**
- REST API endpoints (`/api/tasks`, `/api/auth`, etc.)
- JWT authentication middleware
- Database CRUD operations
- MCP server for AI chatbot
- Health checks (`/health`)

**Dependencies:**
- Neon PostgreSQL (external)
- Secret: `app-secrets` (DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY)

---

### 2. Frontend-Web (Next.js)

**Deployment Spec:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-app-frontend-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend-web
  template:
    metadata:
      labels:
        app: frontend-web
    spec:
      containers:
      - name: frontend-web
        image: todo-frontend-web:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "http://todo-app-backend:8000"
        - name: BETTER_AUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: BETTER_AUTH_SECRET
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 5
```

**Responsibilities:**
- Modern UI/UX dashboard
- Task management interface
- Calendar widget
- JWT token management (localStorage)
- API client with auto-token attachment

**Dependencies:**
- Backend service: `todo-app-backend:8000` (internal DNS)
- Secret: `app-secrets` (BETTER_AUTH_SECRET)

---

### 3. Frontend-Chatbot (React)

**Deployment Spec:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-app-frontend-chatbot
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend-chatbot
  template:
    metadata:
      labels:
        app: frontend-chatbot
    spec:
      containers:
      - name: frontend-chatbot
        image: todo-frontend-chatbot:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3001
        env:
        - name: VITE_API_URL
          value: "http://todo-app-backend:8000"
        - name: VITE_OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: OPENAI_API_KEY
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3001
          initialDelaySeconds: 15
          periodSeconds: 5
```

**Responsibilities:**
- AI chat interface (OpenAI ChatKit)
- Natural language task creation
- MCP tool integration
- Conversation history

**Dependencies:**
- Backend service: `todo-app-backend:8000` (MCP server)
- Secret: `app-secrets` (OPENAI_API_KEY)

---

## Network Architecture

### Internal Communication (ClusterIP)

```
Frontend-Web Pod ──────┐
                       │
Frontend-Chatbot Pod ──┼──► Backend Service (ClusterIP)
                       │    ├─► Backend Pod 1
API Client ────────────┘    └─► Backend Pod 2
                                     │
                                     ▼
                            Neon PostgreSQL (External)
```

**Service DNS Resolution:**
- Backend: `todo-app-backend.default.svc.cluster.local:8000`
- Frontend-Web: `todo-app-frontend-web.default.svc.cluster.local:3000`
- Frontend-Chatbot: `todo-app-frontend-chatbot.default.svc.cluster.local:3001`

**Shortened DNS (same namespace):**
- Backend: `todo-app-backend:8000`

---

### External Access (NodePort)

```
User Browser
    │
    ├─► http://192.168.49.2:30000 ──► Frontend-Web NodePort
    │                                    │
    │                                    ▼
    │                           Frontend-Web Pod (port 3000)
    │
    └─► http://192.168.49.2:30001 ──► Frontend-Chatbot NodePort
                                         │
                                         ▼
                                Frontend-Chatbot Pod (port 3001)
```

**Port Mappings:**

| Service | Internal Port | NodePort | Minikube URL |
|---------|--------------|----------|--------------|
| Frontend-Web | 3000 | 30000 | http://192.168.49.2:30000 |
| Frontend-Chatbot | 3001 | 30001 | http://192.168.49.2:30001 |
| Backend | 8000 | - | Internal only (ClusterIP) |

---

## Data Flow

### 1. User Creates Task (Web UI)

```
┌──────────────┐
│ User Browser │
└──────┬───────┘
       │ 1. POST /api/{user_id}/tasks
       │    Authorization: Bearer <JWT>
       │    Body: {title, due_date, ...}
       ▼
┌─────────────────────┐
│ Frontend-Web Pod    │
│ (Next.js)           │
│ - Attach JWT token  │
│ - Validate input    │
└──────┬──────────────┘
       │ 2. POST http://todo-app-backend:8000/api/{user_id}/tasks
       │    Authorization: Bearer <JWT>
       ▼
┌─────────────────────┐
│ Backend Service     │
│ (ClusterIP)         │
│ - Load balances     │
└──────┬──────────────┘
       │ 3. Routes to Backend Pod
       ▼
┌─────────────────────┐
│ Backend Pod         │
│ (FastAPI)           │
│ - Verify JWT        │
│ - Extract user_id   │
│ - Validate data     │
└──────┬──────────────┘
       │ 4. INSERT INTO tasks
       ▼
┌─────────────────────┐
│ Neon PostgreSQL     │
│ (External)          │
│ - Store task        │
│ - Return task_id    │
└──────┬──────────────┘
       │ 5. Return task object
       ▼
┌─────────────────────┐
│ Frontend-Web Pod    │
│ - Update UI         │
│ - Show success      │
└──────┬──────────────┘
       │ 6. Display new task
       ▼
┌──────────────┐
│ User Browser │
└──────────────┘
```

---

### 2. User Creates Task (Chatbot)

```
┌──────────────┐
│ User Browser │
└──────┬───────┘
       │ 1. Chat: "Add task tomorrow: Buy groceries"
       ▼
┌─────────────────────┐
│ Frontend-Chatbot    │
│ (React + OpenAI)    │
│ - Send to OpenAI    │
└──────┬──────────────┘
       │ 2. OpenAI API call
       │    - Function: add_task
       │    - Args: {title, due_date}
       ▼
┌─────────────────────┐
│ OpenAI Agents SDK   │
│ - Parse intent      │
│ - Extract params    │
│ - Call MCP tool     │
└──────┬──────────────┘
       │ 3. POST http://todo-app-backend:8000/mcp/add_task
       │    Body: {title, due_date, priority, tags}
       ▼
┌─────────────────────┐
│ Backend Pod         │
│ (MCP Server)        │
│ - Validate data     │
│ - Create task       │
└──────┬──────────────┘
       │ 4. INSERT INTO tasks
       ▼
┌─────────────────────┐
│ Neon PostgreSQL     │
│ - Store task        │
└──────┬──────────────┘
       │ 5. Return task object
       ▼
┌─────────────────────┐
│ Backend Pod         │
│ - Format response   │
└──────┬──────────────┘
       │ 6. Return to OpenAI
       ▼
┌─────────────────────┐
│ OpenAI Agents SDK   │
│ - Generate response │
└──────┬──────────────┘
       │ 7. "Task added: Buy groceries for tomorrow"
       ▼
┌─────────────────────┐
│ Frontend-Chatbot    │
│ - Display message   │
└──────┬──────────────┘
       │ 8. Show confirmation
       ▼
┌──────────────┐
│ User Browser │
└──────────────┘
```

---

## Resource Management

### Resource Allocation

| Component | Requests (Memory/CPU) | Limits (Memory/CPU) | Replicas | Total Memory |
|-----------|----------------------|---------------------|----------|--------------|
| Backend | 256Mi / 250m | 512Mi / 500m | 2 | 1Gi |
| Frontend-Web | 256Mi / 250m | 512Mi / 500m | 2 | 1Gi |
| Frontend-Chatbot | 256Mi / 250m | 512Mi / 500m | 2 | 1Gi |
| **Total** | **1.5Gi / 1.5 CPUs** | **3Gi / 3 CPUs** | **6** | **3Gi** |

**Cluster Capacity:**
- Total: 8GB RAM, 4 CPUs
- Used: ~3Gi RAM, ~3 CPUs (37.5% memory, 75% CPU)
- Available: ~5Gi RAM, ~1 CPU
- Target: <70% capacity (within limits ✅)

---

### Auto-Scaling (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: todo-app-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: todo-app-backend
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Scaling Behavior:**
- CPU >70%: Scale up (add pod)
- CPU <50%: Scale down (remove pod, if >minReplicas)
- Memory >80%: Scale up
- Min replicas: 2 (high availability)
- Max replicas: 5 (resource limit)

---

## Security Architecture

### 1. Secret Management

```
┌─────────────────────────────────────────┐
│       Kubernetes Secret (Base64)        │
│  - DATABASE_URL                          │
│  - BETTER_AUTH_SECRET                    │
│  - OPENAI_API_KEY                        │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
      ▼           ▼           ▼
┌─────────┐ ┌──────────┐ ┌──────────────┐
│ Backend │ │Frontend  │ │Frontend      │
│   Pods  │ │Web Pods  │ │Chatbot Pods  │
└─────────┘ └──────────┘ └──────────────┘
```

**Security Practices:**
- Secrets stored in Kubernetes (base64 encoded)
- Injected as environment variables at runtime
- Never committed to Git
- Rotation supported (update secret → restart pods)

---

### 2. Network Policies (Optional)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend-web
    - podSelector:
        matchLabels:
          app: frontend-chatbot
    ports:
    - protocol: TCP
      port: 8000
```

**Restrictions:**
- Backend only accepts traffic from frontend pods
- External access blocked (ClusterIP)
- Database connection allowed (egress)

---

### 3. RBAC (Role-Based Access Control)

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: todo-app-sa
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: todo-app-role
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: todo-app-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: todo-app-role
subjects:
- kind: ServiceAccount
  name: todo-app-sa
```

**Permissions:**
- Service account for pods
- Read-only access to secrets
- No cluster-admin privileges

---

## Scaling Strategy

### Vertical Scaling

**Increase pod resources:**

```yaml
resources:
  requests:
    memory: "512Mi"  # Increased from 256Mi
    cpu: "500m"      # Increased from 250m
  limits:
    memory: "1Gi"    # Increased from 512Mi
    cpu: "1000m"     # Increased from 500m
```

**When to use:**
- Single-threaded workloads
- High memory usage per request
- Limited by CPU-bound operations

---

### Horizontal Scaling

**Increase replica count:**

```yaml
spec:
  replicas: 5  # Increased from 2
```

**When to use:**
- Stateless applications (all our services)
- High concurrent request load
- Load can be distributed evenly

**Auto-scaling with HPA:**
- Automatically adjusts replicas based on CPU/memory
- Responds to traffic spikes
- Reduces cost during low traffic

---

### Cluster Scaling

**Increase Minikube resources:**

```bash
minikube stop
minikube start --cpus=8 --memory=16384 --disk-size=40g
```

**When to use:**
- All pods at capacity
- HPA cannot scale further
- Need more node resources

---

## Deployment Workflow

### CI/CD Pipeline (Future)

```
┌────────────┐
│ Git Push   │
└──────┬─────┘
       │
       ▼
┌────────────────┐
│ GitHub Actions │
│ - Run tests    │
│ - Build images │
│ - Push to ECR  │
└──────┬─────────┘
       │
       ▼
┌────────────────┐
│ Helm Upgrade   │
│ - Update chart │
│ - Rolling      │
│   update       │
└──────┬─────────┘
       │
       ▼
┌────────────────┐
│ Health Check   │
│ - Verify pods  │
│ - Run tests    │
└──────┬─────────┘
       │
       ▼
┌────────────────┐
│ Success/       │
│ Rollback       │
└────────────────┘
```

---

## Monitoring & Observability

### Metrics Collection

```
┌─────────────────────────────────────┐
│      Kubernetes Metrics Server       │
│  (minikube addons enable metrics-    │
│   server)                            │
└─────────────┬───────────────────────┘
              │
      ┌───────┼───────┐
      │       │       │
      ▼       ▼       ▼
  ┌──────┐ ┌──────┐ ┌──────┐
  │ Node │ │ Pod  │ │ Pod  │
  │      │ │      │ │      │
  └──────┘ └──────┘ └──────┘
```

**Available Metrics:**
- `kubectl top nodes`: CPU/Memory usage per node
- `kubectl top pods`: CPU/Memory usage per pod
- Dashboard: Real-time visualization

---

## High Availability

### Pod Redundancy

- **2 replicas minimum** for all services
- **Anti-affinity rules** (spread across nodes in multi-node clusters)
- **Health checks** (liveness + readiness probes)

### Self-Healing

- **Liveness probes**: Restart crashed containers
- **Readiness probes**: Remove unhealthy pods from service
- **Auto-restart**: Kubernetes restarts failed pods automatically

### Rolling Updates

```bash
# Zero-downtime deployment
helm upgrade todo-app ./helm-charts/todo-app

# Kubernetes strategy:
# 1. Start new pod (v2)
# 2. Wait for readiness
# 3. Terminate old pod (v1)
# 4. Repeat for all replicas
```

---

## Disaster Recovery

### Backup Strategy

1. **Database Backups** (Neon PostgreSQL automated)
2. **Helm Release History** (`helm history todo-app`)
3. **Kubernetes Manifests** (Git repository)
4. **Secrets Backup** (external secure storage)

### Recovery Procedure

```bash
# 1. Restore database from Neon backup

# 2. Recreate cluster
minikube start --cpus=4 --memory=8192

# 3. Recreate secrets
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="..." \
  --from-literal=BETTER_AUTH_SECRET="..." \
  --from-literal=OPENAI_API_KEY="..."

# 4. Redeploy from Helm chart
helm install todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml

# 5. Verify
bash scripts/health-check.sh
```

---

## Performance Optimization

### 1. Image Optimization

- Multi-stage Docker builds (reduce image size)
- Layer caching (faster builds)
- Minimal base images (Alpine Linux where possible)

### 2. Resource Tuning

- Adjusted requests/limits based on actual usage
- HPA thresholds optimized for traffic patterns
- Node resources allocated efficiently

### 3. Database Optimization

- Connection pooling (SQLAlchemy)
- Indexed queries (user_id, created_at)
- Read replicas (future enhancement)

---

## Additional Resources

- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Troubleshooting Guide:** `docs/TROUBLESHOOTING.md`
- **Phase IV Constitution:** `.specify/memory/phase-4-constitution.md`
- **Helm Charts:** `helm-charts/todo-app/`
- **Kubernetes Manifests:** `k8s/`

---

**Architecture Documentation Complete** | Phase IV: Kubernetes Deployment
