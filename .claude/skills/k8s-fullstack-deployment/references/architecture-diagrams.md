# Architecture Diagrams

Visual reference for Kubernetes full-stack deployment patterns.

---

## Complete Request Flow: User Signup

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       USER'S BROWSER                                     │
│                    http://localhost:3000                                 │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             │ kubectl port-forward
                             │ (localhost:3000 → pod:3000)
                             ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                   KUBERNETES CLUSTER (Minikube)                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                 Frontend Pod (Next.js)                             │ │
│  │                                                                    │ │
│  │  1. Browser POST /api/auth/sign-up                                │ │
│  │     ↓                                                              │ │
│  │  2. Next.js API Route: app/api/auth/[...all]/route.ts             │ │
│  │     ↓                                                              │ │
│  │  3. Uses env.API_URL (http://backend-service:8000)                │ │
│  │     ↓                                                              │ │
│  │  4. Proxies request to backend                                    │ │
│  └────────────────────────┬───────────────────────────────────────────┘ │
│                           │                                             │
│                           │ Kubernetes Service DNS                      │
│                           │ (backend-service:8000)                      │
│                           ↓                                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                 Backend Service (ClusterIP)                        │ │
│  │  ClusterIP: 10.96.123.45                                           │ │
│  │  Port: 8000                                                        │ │
│  │  Selector: app=backend                                             │ │
│  └────────────────────────┬───────────────────────────────────────────┘ │
│                           │                                             │
│                           │ Service routes to pod                       │
│                           ↓                                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                 Backend Pod (FastAPI)                              │ │
│  │  Pod IP: 10.244.0.15                                               │ │
│  │  Port: 8000                                                        │ │
│  │                                                                    │ │
│  │  5. FastAPI receives POST /api/auth/sign-up                       │ │
│  │     ↓                                                              │ │
│  │  6. Hash password (bcrypt)                                         │ │
│  │     ↓                                                              │ │
│  │  7. Save user to database                                          │ │
│  │     ↓                                                              │ │
│  │  8. Generate JWT token                                             │ │
│  │     ↓                                                              │ │
│  │  9. Return response                                                │ │
│  └────────────────────────┬───────────────────────────────────────────┘ │
│                           │                                             │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │
                            │ SSL Connection
                            │ (postgresql://...neon.tech)
                            ↓
                  ┌──────────────────────┐
                  │  Neon PostgreSQL     │
                  │  (Cloud Database)    │
                  │                      │
                  │  10. INSERT INTO     │
                  │      users (...)     │
                  │  11. Return user_id  │
                  └──────────────────────┘
```

**Response Flow (Returns Same Path):**
```
Backend Pod → Backend Service → Frontend Pod → Browser
```

---

## Dual API URL Strategy

### Problem: Two Types of Requests

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend Pod (Next.js)                                         │
│                                                                 │
│  Two execution contexts:                                        │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Browser JavaScript (client-side)                       │   │
│  │ - Runs in user's browser                               │   │
│  │ - Uses NEXT_PUBLIC_API_URL                             │   │
│  │ - Example: fetch(`${NEXT_PUBLIC_API_URL}/api/tasks`)   │   │
│  │ - Must use localhost:8000 (via port-forward)           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Next.js Server (server-side)                           │   │
│  │ - Runs inside Kubernetes pod                           │   │
│  │ - Uses API_URL                                          │   │
│  │ - Example: fetch(`${API_URL}/api/auth/sign-up`)        │   │
│  │ - Must use backend-service:8000 (Kubernetes DNS)       │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Solution: Different URLs for Different Contexts

```yaml
# Frontend Deployment Environment Variables
env:
# For browser requests (embedded in JavaScript bundles)
- name: NEXT_PUBLIC_API_URL
  value: "http://localhost:8000"

# For server-side requests (Next.js API routes)
- name: API_URL
  value: "http://backend-service:8000"
```

**Flow Diagram:**

```
Browser Request Flow:
Browser → fetch(NEXT_PUBLIC_API_URL) → Port-Forward → Backend Pod ✅

Server Request Flow:
Browser → Frontend Pod API Route → fetch(API_URL) → K8s Service → Backend Pod ✅
```

---

## Kubernetes Service Discovery

### How Kubernetes DNS Works

```
Frontend Pod sends request to: http://backend-service:8000
              ↓
┌─────────────────────────────────────────┐
│ Kubernetes DNS (kube-dns/CoreDNS)      │
│                                         │
│ Resolves "backend-service" to:         │
│ backend-service.app.svc.cluster.local  │
│              ↓                          │
│ Returns ClusterIP: 10.96.123.45        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Backend Service (ClusterIP)             │
│ ClusterIP: 10.96.123.45:8000            │
│                                         │
│ Selector: app=backend                   │
│              ↓                          │
│ Finds all pods with label app=backend  │
└─────────────────────────────────────────┘
              ↓
      Load balances to:
              ↓
┌─────────────────────────────────────────┐
│ Backend Pod #1                          │
│ IP: 10.244.0.15:8000                    │
│ Status: Ready (1/1)                     │
└─────────────────────────────────────────┘
```

**Full DNS Resolution:**
```
backend-service
  ↓ (same namespace)
backend-service.app
  ↓ (add service suffix)
backend-service.app.svc
  ↓ (add cluster domain)
backend-service.app.svc.cluster.local
  ↓ (resolve to ClusterIP)
10.96.123.45:8000
  ↓ (forward to pod)
10.244.0.15:8000 ✅
```

---

## Storage Optimization: Minikube-Native Builds

### Before: Duplicate Storage (60GB+)

```
┌────────────────────────────────────────┐
│  Host Machine                          │
│                                        │
│  Docker Daemon:                        │
│  ├── app-backend:latest (15GB)        │
│  ├── app-frontend:latest (12GB)       │
│  └── Base images (3GB)                 │
│                                        │
│  Total: 30GB                           │
└────────────────────────────────────────┘
              ↓
        docker save | minikube image load
              ↓
┌────────────────────────────────────────┐
│  Minikube VM                           │
│                                        │
│  Docker Daemon:                        │
│  ├── app-backend:latest (15GB) ← DUP! │
│  ├── app-frontend:latest (12GB) ← DUP!│
│  └── Base images (3GB) ← DUP!          │
│                                        │
│  Total: 30GB                           │
└────────────────────────────────────────┘

Grand Total: 60GB (duplicate storage)
```

### After: Single Storage (30GB)

```
┌────────────────────────────────────────┐
│  Host Machine                          │
│                                        │
│  Docker Daemon:                        │
│  (empty - only OS images)              │
│                                        │
│  Total: ~3GB                           │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Minikube VM                           │
│                                        │
│  eval $(minikube docker-env)           │
│  docker build... ← Builds HERE         │
│                                        │
│  Docker Daemon:                        │
│  ├── app-backend:latest (15GB)        │
│  ├── app-frontend:latest (12GB)       │
│  └── Base images (3GB)                 │
│                                        │
│  Total: 30GB                           │
└────────────────────────────────────────┘

Grand Total: 33GB (50% savings!)
```

**Command Sequence:**
```bash
# Point shell to Minikube Docker
eval $(minikube docker-env)

# Verify context
echo $DOCKER_HOST  # tcp://192.168.49.2:2376

# Build images (stored only in Minikube)
docker build -t app-backend:latest ./backend
docker build -t app-frontend:latest ./frontend

# Images immediately available to K8s (no load needed)
kubectl apply -f k8s/deployment.yaml
```

---

## Health Check Flow

### Liveness Probe vs Readiness Probe

```
┌──────────────────────────────────────────────────────────────────┐
│  Backend Pod                                                     │
│                                                                  │
│  Container starts                                                │
│  ↓                                                               │
│  initialDelaySeconds: 10s (grace period)                         │
│  ↓                                                               │
│  ┌─────────────────────────────┐   ┌──────────────────────────┐│
│  │ Readiness Probe             │   │ Liveness Probe           ││
│  │ Purpose: Ready to serve?    │   │ Purpose: Still alive?    ││
│  │ Interval: 10s               │   │ Interval: 30s            ││
│  │                             │   │                          ││
│  │ GET /health                 │   │ GET /health              ││
│  │  ↓                          │   │  ↓                       ││
│  │ 200 OK?                     │   │ 200 OK?                  ││
│  │  ↓ YES                      │   │  ↓ YES                   ││
│  │ Add to Service endpoints    │   │ Keep running             ││
│  │  ↓ NO                       │   │  ↓ NO (3x failures)      ││
│  │ Remove from Service         │   │ RESTART POD              ││
│  └─────────────────────────────┘   └──────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Example Scenarios:**

**Scenario 1: App Starting Up**
```
Time:  0s   5s   10s  15s  20s
       │    │    │    │    │
Ready: ✗    ✗    ✓    ✓    ✓  ← Takes 10s to start
Alive: -    -    ✓    ✓    ✓  ← Doesn't check until 10s

Action: Pod not added to Service until 10s mark
```

**Scenario 2: App Becomes Unhealthy**
```
Time:  0s   30s  60s  90s  120s
       │    │    │    │    │
Ready: ✓    ✓    ✗    ✗    ✗  ← Fails immediately
Alive: ✓    ✓    ✓    ✗    ✗  ← Fails after 3 retries

Action:
- 60s: Removed from Service (no new requests)
- 120s: Pod restarted (liveness failed 3x)
```

---

## Network Communication Patterns

### Pattern 1: Browser → Backend (Direct)

```
Browser (localhost:3000)
    │ fetch(`${NEXT_PUBLIC_API_URL}/api/tasks`)
    │ = fetch('http://localhost:8000/api/tasks')
    ↓
kubectl port-forward (localhost:8000 → pod:8000)
    ↓
Backend Pod :8000
    ↓
FastAPI Route: @router.get("/api/tasks")
    ↓
Response returns same path
```

**Use Case:** Client-side API calls (React components)

---

### Pattern 2: Frontend Server → Backend (Proxied)

```
Browser (localhost:3000)
    │ fetch('/api/auth/sign-up')
    ↓
kubectl port-forward (localhost:3000 → pod:3000)
    ↓
Frontend Pod :3000
    │ Next.js API Route: app/api/auth/[...all]/route.ts
    │ fetch(`${env.API_URL}/api/auth/sign-up`)
    │ = fetch('http://backend-service:8000/api/auth/sign-up')
    ↓
Kubernetes DNS resolves "backend-service"
    ↓
Backend Service (ClusterIP: 10.96.123.45:8000)
    ↓
Backend Pod :8000
    │ FastAPI Route: @router.post("/api/auth/sign-up")
    ↓
Response returns same path
```

**Use Case:** Authentication, server-side data fetching

---

### Pattern 3: Pod → External Service

```
Backend Pod
    │ requests.get('https://api.external.com/data')
    ↓
Kubernetes Network Policy (if configured)
    ↓
Egress Gateway (if configured)
    ↓
External API
    ↓
Response returns
```

---

## Port-Forward Architecture

### How kubectl port-forward Works

```
┌──────────────────────────────────────────────────────────────┐
│  localhost (your machine)                                    │
│                                                              │
│  Browser sends: GET http://localhost:8000/health            │
│                              ↓                               │
│  kubectl port-forward process listens on localhost:8000     │
│                              ↓                               │
│  Establishes tunnel to Kubernetes API server                │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ HTTPS connection
                         │ (kubectl → kube-apiserver)
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  Kubernetes API Server                                       │
│                                                              │
│  Receives port-forward request                              │
│                              ↓                               │
│  Forwards to kubelet on node                                │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ gRPC connection
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  kubelet (Minikube node)                                     │
│                                                              │
│  Forwards to pod's container                                │
│                              ↓                               │
│  Establishes connection to pod:8000                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ TCP connection
                         ↓
┌──────────────────────────────────────────────────────────────┐
│  Backend Pod :8000                                           │
│                                                              │
│  Receives: GET /health                                       │
│  Returns: {"status":"healthy"}                               │
└──────────────────────────────────────────────────────────────┘
```

**Advantages:**
- ✅ Simple setup (no Ingress/LoadBalancer needed)
- ✅ Works with ClusterIP services (no external IP)
- ✅ Secure (uses kubectl auth)
- ✅ Predictable ports (always localhost:X)

**Disadvantages:**
- ❌ Requires kubectl port-forward process running
- ❌ Not suitable for production (use Ingress)
- ❌ Single connection (can't load balance)
- ❌ Disconnects on network timeout

---

## Complete Technology Stack

```
┌──────────────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                              │
│  React Components, HTML, CSS, JavaScript                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                 FRONTEND (Next.js 16.0.10)                       │
│  Framework: Next.js (App Router)                                 │
│  Language: TypeScript 5.x                                        │
│  UI Library: React 19                                            │
│  Styling: Tailwind CSS 3.4+                                      │
│  State: React Query (TanStack Query)                             │
│  Auth: Better Auth (JWT)                                         │
│  Animations: Framer Motion                                       │
│  Build: Turbopack                                                │
└────────────────────────┬─────────────────────────────────────────┘
                         │ REST API (JSON)
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI)                               │
│  Framework: FastAPI 0.110+                                       │
│  Language: Python 3.11                                           │
│  Server: Uvicorn (ASGI)                                          │
│  ORM: SQLAlchemy 2.0                                             │
│  Validation: Pydantic V2                                         │
│  Auth: Better Auth (JWT signing)                                 │
│  Password: bcrypt                                                │
└────────────────────────┬─────────────────────────────────────────┘
                         │ PostgreSQL protocol (SSL)
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│              DATABASE (Neon PostgreSQL)                          │
│  Type: PostgreSQL 16                                             │
│  Hosting: Neon.tech (Cloud)                                      │
│  Connection: SSL (sslmode=require)                               │
│  Tables: users, tasks, tags                                      │
└──────────────────────────────────────────────────────────────────┘

INFRASTRUCTURE:
┌──────────────────────────────────────────────────────────────────┐
│              KUBERNETES (Minikube)                               │
│  Container Runtime: Docker                                       │
│  Orchestrator: Kubernetes 1.28.3                                 │
│  Networking: CNI (Container Network Interface)                   │
│  DNS: CoreDNS                                                    │
│  Secrets: Kubernetes Secrets (base64 encoded)                    │
│  Access: kubectl port-forward                                    │
└──────────────────────────────────────────────────────────────────┘

DEVELOPMENT TOOLS:
- Docker: Multi-stage builds
- Node.js: 20.9.0+
- npm: Package management
- Python: Virtual environment (venv)
- Git: Version control
```

---

## Security Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                         │
└──────────────────────────────────────────────────────────────────┘

1. User Signup/Login
   ↓
2. Backend hashes password (bcrypt, cost=12)
   ↓
3. Store in database (never plain text)
   ↓
4. Generate JWT token:
   {
     "user_id": "uuid",
     "email": "user@example.com",
     "exp": timestamp + 24h,
     "iat": timestamp
   }
   ↓
5. Sign token with BETTER_AUTH_SECRET (43 chars)
   ↓
6. Return token to frontend
   ↓
7. Frontend stores in localStorage
   ↓
8. Future requests include: Authorization: Bearer <token>
   ↓
9. Backend verifies signature + expiration
   ↓
10. If valid → Allow request
    If expired → 401 Unauthorized
    If invalid → 401 Unauthorized

┌──────────────────────────────────────────────────────────────────┐
│                     SECRETS MANAGEMENT                           │
└──────────────────────────────────────────────────────────────────┘

Sensitive Data:
├── DATABASE_URL (PostgreSQL connection string)
├── BETTER_AUTH_SECRET (JWT signing key)
├── OPENAI_API_KEY (Optional)
└── Other API keys

Storage:
├── Development: .env files (gitignored)
├── Kubernetes: Kubernetes Secrets (base64 encoded)
└── Production: External secret manager (Vault, AWS Secrets Manager)

Access Control:
├── Pods: Read via secretKeyRef
├── Developers: kubectl get secret (requires auth)
└── CI/CD: Injected via environment variables
```

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Scalable pod-to-pod communication
- ✅ Secure secret management
- ✅ Efficient storage usage
- ✅ Production-ready health checks
- ✅ Predictable local development
