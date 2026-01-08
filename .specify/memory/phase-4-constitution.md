<!--
Sync Impact Report:
- Version change: NEW → 1.0.0
- Created: 2026-01-03
- Reason: NEW constitution - Phase IV Kubernetes Deployment requires distinct deployment principles
- Context: Extends Phase III cloud-native architecture with containerization and orchestration
- New sections:
  - I. Agentic Infrastructure Development (AI-driven deployment with kubectl-ai, kagent, Gordon)
  - II. Container-First Architecture (Docker multi-stage builds, image optimization)
  - III. Kubernetes-Native Design (StatefulSets, Services, ConfigMaps, Secrets)
  - IV. Helm Chart Standardization (templates, values.yaml, chart.yaml conventions)
  - V. Minikube Local Development (development-production parity)
  - VI. AIOps Integration (kubectl-ai, kagent, Docker AI Gordon mandatory usage)
  - VII. Infrastructure as Code (declarative manifests, GitOps ready)
  - VIII. Observability & Debugging (logs, metrics, health checks, debugging workflows)
  - IX. Resource Management (limits, requests, autoscaling policies)
  - X. Security & Secrets (non-root containers, secrets management, RBAC)
  - XI. Deployment Validation (smoke tests, rollback procedures)
  - XII. Cloud-Native Blueprints (reusable Helm chart skills)
- Inherited from Phase III:
  - Stateless architecture guarantee (critical for K8s horizontal scaling)
  - Health check endpoints (/health, /ready)
  - Graceful shutdown (SIGTERM handling)
  - Externalized configuration (environment variables)
  - Structured logging (JSON format for log aggregation)
- Phase III dependencies: All Phase III cloud-native requirements MUST be implemented
- Breaking changes: None - pure infrastructure layer addition
- Templates requiring updates:
  - ⚠ Create deployment-spec-template.md for infrastructure specifications
  - ⚠ Create deployment-plan-template.md for K8s architecture planning
  - ⚠ Create deployment-tasks-template.md for atomic deployment tasks
  - ✅ Reuse PHR template for infrastructure work documentation
- Follow-up TODOs:
  - Install kubectl-ai and kagent tools
  - Enable Docker AI (Gordon) in Docker Desktop Beta
  - Setup Minikube cluster
  - Create Helm chart blueprints for common patterns
  - Define resource limits based on load testing
-->

# Phase 4: Kubernetes Deployment Constitution v1.0.0

## Project Overview

**Objective:** Deploy the Phase III Todo Chatbot (all 3 services: backend, frontend-web, frontend-chatbot) on a local Kubernetes cluster using Minikube, Helm Charts, and AI-assisted DevOps tools.

**Development Approach:** Agentic Dev Stack workflow using Claude Code, Spec-Kit Plus, and AIOps:
1. **Write Infrastructure Specification** → Define deployment architecture and resource requirements
2. **Generate Deployment Plan** → Design Kubernetes manifests, Helm charts, and service topology
3. **Break into Deployment Tasks** → Create atomic, testable deployment steps
4. **Implement via AI Tools** → Use kubectl-ai, kagent, and Docker AI (Gordon) to generate configs
5. **Deploy & Validate** → Test on Minikube, verify health, document deployment process

**Inheritance:** This constitution extends Phase III (AI Chatbot) cloud-native requirements. All Phase III principles remain in effect for application code.

---

## Core Principles

### I. Agentic Infrastructure Development (NON-NEGOTIABLE)

**NO human shall write Dockerfiles, Kubernetes manifests, or Helm charts manually.**

All infrastructure code MUST be generated through AI-assisted tools:

**Mandatory AI Tools:**
1. **Docker AI (Gordon)** - Dockerfile generation and optimization
   - Command: `docker ai "Create a multi-stage Dockerfile for FastAPI application"`
   - Use for: Image build optimization, layer caching strategies, security hardening
   - Enable: Docker Desktop 4.53+ → Settings → Beta features → Docker AI

2. **kubectl-ai** - Kubernetes manifest generation
   - Command: `kubectl-ai "deploy the todo backend with 2 replicas"`
   - Use for: Deployments, Services, ConfigMaps, Secrets generation
   - Install: Follow https://github.com/GoogleCloudPlatform/kubectl-ai

3. **kagent** - Cluster operations and optimization
   - Command: `kagent "analyze the cluster health"`
   - Use for: Resource optimization, troubleshooting, scaling recommendations
   - Install: Follow https://github.com/kagent-dev/kagent

4. **Claude Code** - Helm chart generation and complex configurations
   - Use Task tool with `general-purpose` agent for multi-file chart generation
   - Generate: chart.yaml, values.yaml, templates/ directory structure

**Workflow Rules:**
- ✅ Use AI tools FIRST before any manual editing
- ✅ AI-generated configs are the baseline - refine only if necessary
- ✅ Document AI prompts in PHRs (what you asked, what it generated, what you modified)
- ❌ Never write infrastructure code from scratch manually
- ❌ Never copy-paste Dockerfiles/manifests from tutorials without AI validation

**Rationale:** Demonstrates AI-native infrastructure workflow. AI tools encode best practices and prevent security/performance anti-patterns. This is a **Hackathon Bonus Requirement** (+200 points for Cloud-Native Blueprints).

---

### II. Container-First Architecture

**All 3 services MUST be containerized following 12-factor app principles.**

Services to containerize:
1. **Backend** (FastAPI + MCP Server)
2. **Frontend-Web** (Next.js 16)
3. **Frontend-Chatbot** (Next.js 14)

**Dockerfile Requirements:**

**Multi-Stage Builds (Mandatory):**
```dockerfile
# Stage 1: Dependencies (cached layer)
FROM python:3.13-slim AS deps
...

# Stage 2: Build (compile, bundle)
FROM deps AS builder
...

# Stage 3: Production (minimal runtime)
FROM python:3.13-slim AS runtime
COPY --from=builder ...
```

**Image Optimization:**
- Use official slim/alpine base images (python:3.13-slim, node:20-alpine)
- Minimize layers: Combine RUN commands with &&
- Leverage layer caching: COPY requirements.txt before COPY src/
- Remove build artifacts in final stage (keep only runtime dependencies)
- Target image size: <500MB for backend, <300MB for frontends

**Security Hardening:**
- Run as non-root user (USER appuser)
- No secrets in image layers (use environment variables)
- Pin dependency versions (requirements.txt, package.json)
- Scan images with `docker scan` or Trivy

**Health Check Integration:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

**Environment Variables:**
- Externalize ALL configuration (DATABASE_URL, API_URL, OPENAI_API_KEY)
- No hardcoded localhost URLs (use env vars with defaults)
- Support development and production modes via ENV variable

**Rationale:** Multi-stage builds reduce attack surface and image size. Non-root containers are Kubernetes security best practice. Externalized config enables same image for dev/staging/prod.

---

### III. Kubernetes-Native Design

**Deployments MUST be designed for Kubernetes orchestration, not Docker Compose.**

**Resource Types:**

**Deployments (for stateless services):**
- Backend: Deployment with 2 replicas (horizontal scaling ready)
- Frontend-Web: Deployment with 2 replicas
- Frontend-Chatbot: Deployment with 2 replicas

**Services (for networking):**
- backend-service: ClusterIP, port 8000 → backend pods
- frontend-web-service: NodePort, port 3000 → frontend-web pods (external access)
- frontend-chatbot-service: NodePort, port 3001 → frontend-chatbot pods (external access)

**ConfigMaps (for non-secret config):**
- backend-config: API_URL, FRONTEND_URL, LOG_LEVEL
- frontend-web-config: NEXT_PUBLIC_API_URL
- frontend-chatbot-config: VITE_API_URL

**Secrets (for sensitive data):**
- backend-secrets: DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY
- No secrets in ConfigMaps or manifest files
- Use kubectl create secret or Helm values encryption

**Liveness & Readiness Probes (Mandatory):**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10
```

**Resource Limits & Requests (Mandatory):**
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

**Pod Disruption Budgets:**
- minAvailable: 1 (ensure at least 1 replica during rolling updates)

**Rationale:** Probes enable self-healing. Resource limits prevent noisy neighbor issues. Services abstract pod IPs for stable networking. ConfigMaps/Secrets decouple config from code.

---

### IV. Helm Chart Standardization

**Deployment MUST use Helm 3 for templating and release management.**

**Chart Structure (Required):**
```
helm-charts/
└── todo-app/
    ├── Chart.yaml           # Metadata (name, version, dependencies)
    ├── values.yaml          # Default configuration values
    ├── values-dev.yaml      # Minikube overrides (optional)
    ├── values-prod.yaml     # Production overrides (optional)
    ├── templates/
    │   ├── _helpers.tpl     # Template helpers (labels, names)
    │   ├── backend-deployment.yaml
    │   ├── backend-service.yaml
    │   ├── frontend-web-deployment.yaml
    │   ├── frontend-web-service.yaml
    │   ├── frontend-chatbot-deployment.yaml
    │   ├── frontend-chatbot-service.yaml
    │   ├── configmap.yaml
    │   ├── secret.yaml      # Template only - values from external source
    │   ├── ingress.yaml     # Optional: for domain-based routing
    │   └── NOTES.txt        # Post-install instructions
    └── .helmignore          # Files to exclude from package
```

**Chart.yaml Requirements:**
```yaml
apiVersion: v2
name: todo-app
description: Full-stack todo application with AI chatbot
version: 1.0.0           # Chart version (semantic versioning)
appVersion: "phase-4"    # Application version
dependencies: []         # List if using subcharts (none for Phase IV)
```

**values.yaml Structure:**
```yaml
global:
  environment: development

backend:
  image:
    repository: todo-backend
    tag: latest
    pullPolicy: IfNotPresent
  replicaCount: 2
  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"
  service:
    type: ClusterIP
    port: 8000

frontendWeb:
  image:
    repository: todo-frontend-web
    tag: latest
  replicaCount: 2
  service:
    type: NodePort
    port: 3000
    nodePort: 30000

frontendChatbot:
  image:
    repository: todo-frontend-chatbot
    tag: latest
  replicaCount: 2
  service:
    type: NodePort
    port: 3001
    nodePort: 30001

secrets:
  databaseUrl: ""       # Populated externally
  betterAuthSecret: ""  # Populated externally
  openaiApiKey: ""      # Populated externally
```

**Templating Best Practices:**
- Use `{{ .Values.backend.replicaCount }}` for all configurable values
- Use `{{ include "todo-app.fullname" . }}` for resource names
- Use `{{ .Chart.Name }}-{{ .Chart.Version }}` for versioned labels
- Validate chart: `helm lint helm-charts/todo-app`
- Test rendering: `helm template todo-app helm-charts/todo-app --debug`

**Installation Commands:**
```bash
# Install
helm install todo-app ./helm-charts/todo-app -f ./helm-charts/todo-app/values-dev.yaml

# Upgrade
helm upgrade todo-app ./helm-charts/todo-app

# Rollback
helm rollback todo-app 1
```

**Rationale:** Helm enables versioned, repeatable deployments. Templates allow single chart for dev/staging/prod. Values files separate config from structure. Rollback capability is critical for production.

---

### V. Minikube Local Development

**Local deployment MUST use Minikube with production-like configuration.**

**Minikube Setup:**
```bash
# Start Minikube cluster
minikube start --cpus=4 --memory=8192 --disk-size=20g --driver=docker

# Enable addons
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard

# Verify cluster
kubectl cluster-info
kubectl get nodes
```

**Development-Production Parity:**
- Use same Helm chart for Minikube and cloud (different values files)
- Use same Docker images (tag: latest for dev, semantic version for prod)
- Same environment variable names (different values)
- Same resource names (namespace separation: dev vs prod)

**Minikube-Specific Configurations:**
- Use NodePort services (LoadBalancer not needed locally)
- Mount local directories for rapid iteration (optional):
  ```bash
  minikube mount ./backend:/mnt/backend
  ```
- Use Minikube Docker daemon for faster image loading:
  ```bash
  eval $(minikube docker-env)
  docker build -t todo-backend:latest ./backend
  ```

**Access Services:**
```bash
# Get service URLs
minikube service frontend-web-service --url
minikube service frontend-chatbot-service --url

# Port forwarding (alternative)
kubectl port-forward svc/backend-service 8000:8000
```

**Debugging Tools:**
```bash
# Pod logs
kubectl logs -f deployment/backend

# Exec into pod
kubectl exec -it deployment/backend -- /bin/bash

# Dashboard
minikube dashboard
```

**Cleanup:**
```bash
# Delete deployment
helm uninstall todo-app

# Stop cluster
minikube stop

# Delete cluster
minikube delete
```

**Rationale:** Minikube provides free Kubernetes environment for learning. Development-production parity reduces deployment surprises. Local testing accelerates iteration.

---

### VI. AIOps Integration (MANDATORY)

**ALL Kubernetes operations MUST be performed or validated with AI tools.**

**kubectl-ai Usage (Required Operations):**
```bash
# Deployment generation
kubectl-ai "create a deployment for FastAPI backend with 2 replicas, port 8000"

# Service creation
kubectl-ai "expose the backend deployment as a ClusterIP service"

# Scaling
kubectl-ai "scale the frontend-web deployment to 3 replicas"

# Troubleshooting
kubectl-ai "check why the backend pods are failing"
kubectl-ai "show me the logs of the last crashed pod"

# Resource optimization
kubectl-ai "what are the recommended resource limits for my backend deployment?"
```

**kagent Usage (Required Operations):**
```bash
# Cluster health analysis
kagent "analyze the cluster health and identify issues"

# Resource utilization
kagent "show me resource utilization across all pods"

# Optimization recommendations
kagent "optimize resource allocation for my deployments"

# Security scan
kagent "scan for security issues in my cluster"
```

**Docker AI (Gordon) Usage:**
```bash
# Dockerfile generation
docker ai "Create a multi-stage Dockerfile for a FastAPI app with poetry dependencies"

# Image optimization
docker ai "How can I reduce the size of my Python Docker image?"

# Security hardening
docker ai "What security best practices should I apply to my Dockerfile?"

# Debugging
docker ai "Why is my container failing to start?"
```

**Documentation Requirements:**
- Record ALL AI prompts in PHRs (exact command, response summary, action taken)
- Create "AI-Generated Infrastructure" section in README.md
- List AI tools used, commands executed, and results
- Include AI tool versions: `kubectl-ai --version`, `kagent version`, `docker --version`

**Fallback Policy:**
- If kubectl-ai unavailable: Use Claude Code to generate YAML manifests
- If kagent unavailable: Use `kubectl top`, `kubectl describe` for manual analysis
- If Docker AI unavailable: Use Claude Code to generate Dockerfiles
- Document fallback usage in PHR

**Rationale:** Demonstrates cutting-edge AIOps workflow. AI tools provide intelligent defaults and catch configuration errors. **Required for Hackathon Bonus Points (+200 points Cloud-Native Blueprints).**

---

### VII. Infrastructure as Code (IaC)

**ALL infrastructure definitions MUST be declarative, version-controlled, and GitOps-ready.**

**File Organization:**
```
The-Evolution-Of-TODO/
├── docker/
│   ├── backend.Dockerfile          # Multi-stage backend image
│   ├── frontend-web.Dockerfile     # Next.js 16 production image
│   ├── frontend-chatbot.Dockerfile # Next.js 14 production image
│   └── .dockerignore               # Exclude node_modules, .git, etc.
├── k8s/
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-web-deployment.yaml
│   ├── frontend-web-service.yaml
│   ├── frontend-chatbot-deployment.yaml
│   ├── frontend-chatbot-service.yaml
│   ├── configmap.yaml
│   ├── secret.yaml.example         # Template (never commit real secrets)
│   └── namespace.yaml              # Optional: separate namespace
├── helm-charts/
│   └── todo-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-dev.yaml
│       ├── values-prod.yaml
│       └── templates/
│           └── ...
├── scripts/
│   ├── build-images.sh             # Build all Docker images
│   ├── deploy-minikube.sh          # Deploy to Minikube
│   ├── cleanup.sh                  # Remove all resources
│   └── health-check.sh             # Verify deployment health
└── docs/
    ├── DEPLOYMENT.md               # Deployment guide
    └── TROUBLESHOOTING.md          # Common issues and fixes
```

**GitOps Principles:**
- Git is single source of truth for infrastructure state
- Changes go through PR review (even for AI-generated configs)
- Commit messages: `infra(k8s): add backend deployment with 2 replicas`
- Tag releases: `v1.0.0-k8s` (infrastructure versioning)
- Never apply configs that aren't in Git

**Declarative Manifests:**
- Use YAML (never imperative `kubectl run` commands)
- All manifests MUST be reproducible (no manual `kubectl edit`)
- Use `kubectl apply -f` (not `kubectl create`)
- Validate before apply: `kubectl apply --dry-run=client -f manifest.yaml`

**Secret Management:**
- Never commit secrets to Git
- Use `.gitignore` for `secret.yaml`, `.env` files
- Document secret creation in `DEPLOYMENT.md`:
  ```bash
  kubectl create secret generic backend-secrets \
    --from-literal=DATABASE_URL="..." \
    --from-literal=OPENAI_API_KEY="..."
  ```
- Use Helm values file encryption (helm-secrets plugin) for production

**Rationale:** IaC enables reproducible deployments, change tracking, and disaster recovery. GitOps workflow aligns with modern DevOps practices. Separation of secrets from code prevents credential leaks.

---

### VIII. Observability & Debugging

**Deployments MUST be observable with logs, metrics, and tracing.**

**Structured Logging (Inherited from Phase III):**
- All services emit JSON logs to stdout/stderr
- Log aggregation: `kubectl logs -f deployment/backend | jq`
- Include: timestamp, level, message, user_id, request_id
- No PII in logs (mask emails, tokens)

**Health Checks (Mandatory):**
```python
# backend/src/api/main.py
@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/ready")
async def ready():
    # Check database connectivity
    # Check OpenAI API connectivity
    return {"status": "ready", "checks": {...}}
```

**Metrics Collection:**
- CPU/Memory: Minikube metrics-server addon
- View: `kubectl top pods`
- View: `minikube dashboard` (Kubernetes Dashboard)

**Debugging Workflow:**
```bash
# 1. Check pod status
kubectl get pods

# 2. Describe failing pod
kubectl describe pod <pod-name>

# 3. View logs
kubectl logs -f <pod-name>

# 4. Exec into container
kubectl exec -it <pod-name> -- /bin/bash

# 5. Check events
kubectl get events --sort-by='.lastTimestamp'

# 6. AI-assisted troubleshooting
kubectl-ai "why is my backend pod in CrashLoopBackOff?"
```

**Common Issues Documentation:**
Create `docs/TROUBLESHOOTING.md` with:
- ImagePullBackOff → Check image name/tag
- CrashLoopBackOff → Check logs, health checks, secrets
- Pending → Check resource requests vs node capacity
- OOMKilled → Increase memory limits

**Rationale:** Observability is critical for production readiness. Structured logs enable log aggregation. Health checks enable self-healing. Metrics inform scaling decisions.

---

### IX. Resource Management

**Resource limits and requests MUST be defined for ALL containers.**

**Default Resource Allocation:**

**Backend (FastAPI + MCP):**
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"       # 0.25 cores
  limits:
    memory: "512Mi"
    cpu: "500m"       # 0.5 cores
```

**Frontend-Web (Next.js 16):**
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

**Frontend-Chatbot (Next.js 14):**
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

**Autoscaling (Optional for Phase IV, Mandatory for Phase V):**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Capacity Planning:**
- Minikube cluster: 4 CPUs, 8GB RAM total
- Reserve 1 CPU, 2GB for system pods (kube-system)
- Available: 3 CPUs, 6GB for applications
- Calculate: (2 backend + 2 web + 2 chatbot) × resource requests < available

**Resource Monitoring:**
```bash
# Check resource usage
kubectl top nodes
kubectl top pods

# Identify resource hogs
kubectl top pods --sort-by=memory
kubectl top pods --sort-by=cpu
```

**Rationale:** Resource limits prevent runaway containers from starving other services. Requests ensure pod scheduling on nodes with sufficient capacity. Proper sizing reduces costs and improves reliability.

---

### X. Security & Secrets Management

**Containers MUST run as non-root with minimal privileges.**

**Container Security:**
```dockerfile
# Create non-root user
RUN adduser --disabled-password --gecos "" appuser

# Switch to non-root
USER appuser

# Read-only filesystem (optional)
securityContext:
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1000
```

**Secret Management:**
```bash
# Create secret (never commit)
kubectl create secret generic backend-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=BETTER_AUTH_SECRET="..." \
  --from-literal=OPENAI_API_KEY="sk-..."

# Mount secret in deployment
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: backend-secrets
        key: DATABASE_URL
```

**Network Policies (Optional for Phase IV):**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
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
    ports:
    - protocol: TCP
      port: 8000
```

**RBAC (Role-Based Access Control):**
- Default ServiceAccount has minimal permissions
- Create custom ServiceAccount if pods need K8s API access
- Principle of least privilege

**Image Scanning:**
```bash
# Scan images for vulnerabilities
docker scan todo-backend:latest
trivy image todo-backend:latest
```

**Rationale:** Running as non-root mitigates container breakout attacks. Secrets in Kubernetes Secrets (not ConfigMaps) enable encryption at rest. Network policies implement zero-trust networking.

---

### XI. Deployment Validation & Rollback

**Every deployment MUST pass smoke tests before marking as successful.**

**Pre-Deployment Validation:**
```bash
# 1. Lint Helm chart
helm lint helm-charts/todo-app

# 2. Dry-run deployment
helm install --dry-run --debug todo-app ./helm-charts/todo-app

# 3. Validate Kubernetes manifests
kubectl apply --dry-run=client -f k8s/
```

**Post-Deployment Smoke Tests:**
```bash
#!/bin/bash
# scripts/health-check.sh

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=backend --timeout=120s
kubectl wait --for=condition=ready pod -l app=frontend-web --timeout=120s
kubectl wait --for=condition=ready pod -l app=frontend-chatbot --timeout=120s

# Test health endpoints
BACKEND_URL=$(minikube service backend-service --url)
curl -f $BACKEND_URL/health || exit 1

# Test web UI
FRONTEND_URL=$(minikube service frontend-web-service --url)
curl -f $FRONTEND_URL || exit 1

# Test chatbot UI
CHATBOT_URL=$(minikube service frontend-chatbot-service --url)
curl -f $CHATBOT_URL || exit 1

echo "✅ All services healthy!"
```

**Rolling Update Strategy:**
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 0       # No downtime
    maxSurge: 1             # One extra pod during update
```

**Rollback Procedure:**
```bash
# View deployment history
helm history todo-app

# Rollback to previous release
helm rollback todo-app

# Rollback to specific revision
helm rollback todo-app 2

# Verify rollback
kubectl get pods
./scripts/health-check.sh
```

**Failure Scenarios:**
- **ImagePullBackOff**: Check image name, ensure Minikube Docker daemon used
- **CrashLoopBackOff**: Check logs, secrets, environment variables
- **Readiness probe failed**: Check /ready endpoint, database connectivity
- **OOMKilled**: Increase memory limits

**Rationale:** Automated validation catches errors before they impact users. Rolling updates enable zero-downtime deployments. Quick rollback minimizes incident duration.

---

### XII. Cloud-Native Blueprints & Reusable Skills

**Create reusable Helm chart generation skills for future phases.**

**Agent Skills to Create:**

**1. Helm Chart Generator Skill** (`.specify/skills/helm-chart-gen.skill.md`):
```markdown
# Helm Chart Generator Skill

## Purpose
Generate production-ready Helm chart for multi-service applications.

## Inputs
- Service list (name, image, port, replicas)
- Resource requirements (CPU, memory)
- Environment variables (config, secrets)

## Outputs
- Complete Helm chart directory structure
- Templates for Deployment, Service, ConfigMap, Secret
- values.yaml with sensible defaults

## Usage
Ask Claude Code: "Use the helm-chart-gen skill to create a chart for 3 services: backend, frontend-web, frontend-chatbot"
```

**2. Kubernetes Deployment Blueprint** (`.specify/blueprints/k8s-deployment.blueprint.md`):
```markdown
# Kubernetes Deployment Blueprint

## Pattern
Standard Deployment for stateless service with health checks, resource limits, and horizontal scaling.

## Template Variables
- SERVICE_NAME
- IMAGE_REPOSITORY
- REPLICA_COUNT
- PORT
- MEMORY_REQUEST
- CPU_REQUEST

## Generated Artifacts
- deployment.yaml
- service.yaml
- hpa.yaml (optional)
```

**3. Docker Multi-Stage Builder Skill** (`.specify/skills/docker-multistage.skill.md`):
```markdown
# Docker Multi-Stage Builder Skill

## Purpose
Generate optimized multi-stage Dockerfiles following security best practices.

## Capabilities
- Python (FastAPI, Django, Flask)
- Node.js (Next.js, React, Express)
- Language-specific optimizations

## Security Features
- Non-root user creation
- Minimal base images (slim, alpine)
- Layer caching optimization
- HEALTHCHECK integration
```

**Blueprint Directory Structure:**
```
.specify/
├── skills/
│   ├── helm-chart-gen.skill.md      # Helm chart generator
│   ├── docker-multistage.skill.md   # Dockerfile generator
│   └── k8s-troubleshoot.skill.md    # Debugging assistant
└── blueprints/
    ├── k8s-deployment.blueprint.md  # Deployment pattern
    ├── k8s-service.blueprint.md     # Service pattern
    └── k8s-configmap.blueprint.md   # ConfigMap pattern
```

**Usage in Development:**
```bash
# Generate Helm chart
"Use the helm-chart-gen skill to create a chart for todo-app with 3 services"

# Generate Dockerfile
"Use the docker-multistage skill to create a FastAPI Dockerfile with poetry"

# Debug deployment
"Use the k8s-troubleshoot skill to analyze why my backend pod is failing"
```

**Rationale:** Reusable blueprints accelerate Phase V deployment. Skills capture Phase IV learnings for future projects. **Earns Hackathon Bonus Points (+200 Cloud-Native Blueprints).**

---

## Code Quality Standards

### Infrastructure Code Validation

**Dockerfile Linting:**
```bash
# Hadolint (Dockerfile linter)
hadolint docker/backend.Dockerfile
```

**Kubernetes Manifest Validation:**
```bash
# Kubeval (schema validation)
kubeval k8s/*.yaml

# Helm lint
helm lint helm-charts/todo-app
```

**YAML Formatting:**
- Use 2-space indentation (Kubernetes convention)
- No tabs (spaces only)
- Comments for non-obvious configurations
- Alphabetize keys within sections (consistency)

### Documentation

**Required Documentation:**
1. **DEPLOYMENT.md** - Step-by-step deployment guide
2. **ARCHITECTURE.md** - Service topology, network diagram
3. **TROUBLESHOOTING.md** - Common issues and fixes
4. **SCRIPTS.md** - Explanation of all automation scripts

**README.md Updates:**
- Add "Deployment" section with Minikube quickstart
- List AI tools used (kubectl-ai, kagent, Docker AI)
- Include architecture diagram (draw.io or Mermaid)

---

## Development Workflow

### Phase IV Implementation Process

1. **Infrastructure Specification** (`specs/003-k8s-deployment/spec.md`):
   - Define services to deploy
   - Specify resource requirements
   - Document network topology
   - List AI tools to use

2. **Deployment Planning** (`specs/003-k8s-deployment/plan.md`):
   - Design Helm chart structure
   - Plan Dockerfile multi-stage builds
   - Define ConfigMaps/Secrets strategy
   - Map service dependencies

3. **Task Breakdown** (`specs/003-k8s-deployment/tasks.md`):
   - T1: Generate Dockerfiles with Docker AI
   - T2: Build and test Docker images
   - T3: Generate K8s manifests with kubectl-ai
   - T4: Create Helm chart with Claude Code
   - T5: Deploy to Minikube
   - T6: Validate deployment with smoke tests
   - T7: Document deployment process
   - T8: Create rollback procedures

4. **Implementation via AI Tools**:
   - Use Docker AI for Dockerfile generation
   - Use kubectl-ai for manifest generation
   - Use kagent for optimization
   - Use Claude Code for Helm chart creation

5. **Validation & Documentation**:
   - Test all services on Minikube
   - Document AI prompts in PHRs
   - Create deployment guide
   - Record demo video

### Git Workflow

**Commit Message Convention:**
```
<type>(k8s|docker|helm): <description>

Examples:
feat(docker): add multi-stage Dockerfile for backend
feat(k8s): add backend deployment with health checks
feat(helm): create todo-app chart with 3 services
docs(k8s): add deployment guide for Minikube
fix(docker): reduce backend image size from 1GB to 450MB
```

**Branch Strategy:**
- Feature branch: `feature/phase-4-k8s-deployment`
- Never commit secrets to Git
- Tag final release: `v1.0.0-k8s`

---

## Governance

**This constitution extends Phase III cloud-native requirements and serves as the authoritative source for Phase IV Kubernetes deployment.**

### Prerequisites (Phase III Compliance)

Before starting Phase IV, verify Phase III implemented:
- ✅ Stateless architecture (no in-memory sessions)
- ✅ Health check endpoints (/health, /ready)
- ✅ Graceful shutdown (SIGTERM handling)
- ✅ Externalized configuration (environment variables)
- ✅ Structured logging (JSON format)

If any Phase III requirement is missing, implement it BEFORE containerization.

### Amendment Procedure

- Amendments require: clear rationale, impact analysis, user approval
- Version bumps follow semantic versioning:
  - MAJOR: Breaking changes to deployment architecture
  - MINOR: New deployment pattern, new tool integration
  - PATCH: Clarifications, configuration refinements
- All amendments MUST update dependent templates (deployment-spec, deployment-plan, deployment-tasks)

### Compliance

- All deployment code MUST be AI-generated with documented prompts
- Deviations from AI recommendations MUST be justified in PHR
- Manual infrastructure code MUST be approved and documented
- Helm charts MUST pass `helm lint`
- Dockerfiles MUST pass `hadolint` or Docker AI validation
- Deployments MUST pass smoke tests before marking as complete

### Versioning & Dates

**Version**: 1.0.0 | **Created**: 2026-01-03 | **Last Amended**: 2026-01-03

---

## Success Criteria

Phase IV is complete when:

1. ✅ All 3 Docker images built and optimized (<500MB backend, <300MB frontends)
2. ✅ Helm chart created with templates for all services
3. ✅ Deployed successfully on Minikube (all pods Running)
4. ✅ Health checks passing (/health returns 200)
5. ✅ Services accessible via NodePort or port-forward
6. ✅ AI tools used and documented (kubectl-ai, kagent, Docker AI)
7. ✅ Infrastructure code committed to Git
8. ✅ Deployment guide written (DEPLOYMENT.md)
9. ✅ Smoke tests automated (scripts/health-check.sh)
10. ✅ Rollback procedure tested and documented
11. ✅ PHRs created for all AI-assisted infrastructure generation
12. ✅ Demo video recorded (<90 seconds) showing deployment process

**Points Earned**: 250 (Phase IV) + 200 (Cloud-Native Blueprints Bonus) = **450 points**

**Ready for Phase V**: Kafka integration, Dapr sidecars, cloud deployment (DigitalOcean DOKS)
