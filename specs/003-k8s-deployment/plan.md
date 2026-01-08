# Implementation Plan: Kubernetes Deployment for Todo Application

**Branch**: `003-k8s-deployment` | **Date**: 2026-01-03 | **Spec**: [specs/003-k8s-deployment/spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-k8s-deployment/spec.md`

**Note**: This plan implements Phase IV constitution requirements with AI-assisted infrastructure generation.

## Summary

Deploy all 3 services (backend FastAPI, frontend-web Next.js 16, frontend-chatbot Next.js 14) on Minikube using Helm charts. Use AI tools (kubectl-ai, kagent, Docker AI Gordon) for infrastructure generation following Phase IV constitution. Achieve containerization with multi-stage Dockerfiles (<500MB backend, <300MB frontends), Kubernetes orchestration with 2 replicas per service, externalized configuration via ConfigMaps/Secrets, and automated health monitoring with liveness/readiness probes.

## Technical Context

**Infrastructure Type**: Kubernetes deployment (Minikube local cluster)
**Container Runtime**: Docker 24.0+
**Orchestration**: Kubernetes 1.28+ (Minikube)
**Package Manager**: Helm 3
**AI DevOps Tools**: kubectl-ai, kagent, Docker AI (Gordon) - **MANDATORY per Phase IV constitution**
**Base Images**: python:3.13-slim (backend), node:20-alpine (frontends)
**Build Strategy**: Multi-stage Dockerfiles for image optimization
**Configuration**: Kubernetes ConfigMaps (non-secret), Secrets (sensitive data)
**Networking**: ClusterIP (backend internal), NodePort (frontends external access)
**Health Checks**: Liveness probes (/health), Readiness probes (/ready)
**Resource Limits**: Backend (512Mi memory, 500m CPU), Frontends (256Mi memory, 200m CPU)
**Replicas**: 2 per service (horizontal scaling ready)
**Storage**: External Neon PostgreSQL (no in-cluster database)
**Target Platform**: Minikube cluster (4 CPUs, 8GB RAM)
**Project Type**: Infrastructure (deployment layer for existing web application)
**Performance Goals**: All pods Running state within 2 minutes, health checks 200 OK within 30s
**Constraints**: Image size <500MB (backend), <300MB (frontends); Total resource usage <70% cluster capacity
**Scale/Scope**: 3 services, 6 pods total (2 replicas × 3 services), single Helm chart deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Phase IV Constitution (v1.0.0) - Kubernetes Deployment Requirements:**

✅ **I. Agentic Infrastructure Development (NON-NEGOTIABLE)**
- Status: PLANNED - Will use Docker AI (Gordon), kubectl-ai, and kagent for all infrastructure generation
- Evidence: PHRs will document all AI tool prompts and outputs
- Compliance: No manual Dockerfile/manifest creation without AI baseline

✅ **II. Container-First Architecture**
- Status: COMPLIANT - Multi-stage Dockerfiles planned for all 3 services
- Target: <500MB backend, <300MB frontends
- Security: Non-root user, no hardcoded secrets, health checks integrated

✅ **III. Kubernetes-Native Design**
- Status: COMPLIANT - Deployments (2 replicas each), Services (ClusterIP + NodePort), ConfigMaps, Secrets
- Probes: Liveness (/health) and Readiness (/ready) for all services
- Resources: Requests and limits defined per Phase IV constitution

✅ **IV. Helm Chart Standardization**
- Status: PLANNED - Single Helm chart (todo-app) with templates for all resources
- Structure: Chart.yaml, values.yaml, values-dev.yaml, templates/ directory
- Validation: helm lint + dry-run before installation

✅ **V. Minikube Local Development**
- Status: PLANNED - 4 CPUs, 8GB RAM cluster with metrics-server and dashboard addons
- Parity: Same Helm chart for dev/prod (different values files)

✅ **VI. AIOps Integration (MANDATORY)**
- Status: PLANNED - kubectl-ai, kagent, Docker AI usage documented in PHRs
- Fallback: Claude Code for generation if AI tools unavailable

✅ **VII. Infrastructure as Code (IaC)**
- Status: COMPLIANT - All configs in Git (docker/, k8s/, helm-charts/ directories)
- GitOps: Declarative YAML, no imperative kubectl run commands
- Secrets: .gitignore for secret.yaml, documented external creation

✅ **VIII. Observability & Debugging**
- Status: INHERITED FROM PHASE III - Health checks (/health, /ready) already implemented
- Logging: Structured JSON logs to stdout (Phase III requirement)

✅ **IX. Resource Management**
- Status: COMPLIANT - Requests/limits defined, total usage <70% cluster capacity
- Calculation: (2 backend + 2 web + 2 chatbot) × requests = 1.4 CPUs, 1.5GB RAM < 3 CPUs, 6GB available

✅ **X. Security & Secrets Management**
- Status: COMPLIANT - Non-root containers, Secrets for DATABASE_URL/OPENAI_API_KEY/BETTER_AUTH_SECRET
- Image scanning: docker scan or Trivy validation

✅ **XI. Deployment Validation & Rollback**
- Status: PLANNED - Smoke tests (scripts/health-check.sh), helm rollback procedure
- Strategy: RollingUpdate with maxUnavailable: 0 (zero downtime)

✅ **XII. Cloud-Native Blueprints & Reusable Skills**
- Status: PLANNED - Create helm-chart-gen.skill.md, docker-multistage.skill.md
- Bonus Points: +200 for Cloud-Native Blueprints implementation

**Phase III Prerequisite Verification:**
✅ Stateless architecture (no in-memory sessions) - VERIFIED (uses external Neon database)
✅ Health check endpoints (/health, /ready) - VERIFIED (implemented in Phase II/III)
✅ Graceful shutdown (SIGTERM handling) - NEEDS VERIFICATION (will check in research phase)
✅ Externalized configuration (environment variables) - VERIFIED (Phase II .env pattern)
✅ Structured logging (JSON format) - NEEDS VERIFICATION (will check in research phase)

**GATE RESULT**: ✅ PASS - All Phase IV constitution requirements aligned. Proceed to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/003-k8s-deployment/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output: AI tools setup, Phase III verification
├── data-model.md        # Phase 1 output: Infrastructure resources (Deployments, Services, ConfigMaps, Secrets)
├── quickstart.md        # Phase 1 output: Minikube setup, deployment, access instructions
├── contracts/           # Phase 1 output: Helm chart values schema, resource contracts
└── tasks.md             # Phase 2 output: (/sp.tasks command - NOT created by /sp.plan)
```

### Infrastructure Code (repository root)

```text
The-Evolution-Of-TODO/
├── docker/                           # Phase IV: Container images (NEW)
│   ├── backend.Dockerfile            # Multi-stage FastAPI + MCP server
│   ├── frontend-web.Dockerfile       # Multi-stage Next.js 16 production build
│   ├── frontend-chatbot.Dockerfile   # Multi-stage Next.js 14 production build
│   └── .dockerignore                 # Exclude node_modules, .git, tests
│
├── k8s/                              # Phase IV: Kubernetes manifests (NEW)
│   ├── backend-deployment.yaml       # Backend Deployment (2 replicas, probes, resources)
│   ├── backend-service.yaml          # ClusterIP Service for internal communication
│   ├── frontend-web-deployment.yaml  # Frontend-web Deployment
│   ├── frontend-web-service.yaml     # NodePort Service (port 30000)
│   ├── frontend-chatbot-deployment.yaml
│   ├── frontend-chatbot-service.yaml # NodePort Service (port 30001)
│   ├── configmap.yaml                # Non-secret config (API URLs, log levels)
│   ├── secret.yaml.example           # Secret template (never commit actual secrets)
│   └── namespace.yaml                # Optional: todo-app namespace
│
├── helm-charts/                      # Phase IV: Helm packaging (NEW)
│   └── todo-app/
│       ├── Chart.yaml                # Chart metadata (name, version, dependencies)
│       ├── values.yaml               # Default configuration values
│       ├── values-dev.yaml           # Minikube overrides
│       ├── values-prod.yaml          # Production overrides (Phase V)
│       ├── templates/
│       │   ├── _helpers.tpl          # Template helpers (labels, resource names)
│       │   ├── backend-deployment.yaml
│       │   ├── backend-service.yaml
│       │   ├── frontend-web-deployment.yaml
│       │   ├── frontend-web-service.yaml
│       │   ├── frontend-chatbot-deployment.yaml
│       │   ├── frontend-chatbot-service.yaml
│       │   ├── configmap.yaml
│       │   ├── secret.yaml           # Template only (values from external source)
│       │   ├── ingress.yaml          # Optional: domain-based routing (Phase V)
│       │   └── NOTES.txt             # Post-install instructions
│       └── .helmignore               # Exclude .git, .DS_Store, etc.
│
├── scripts/                          # Phase IV: Automation scripts (NEW)
│   ├── build-images.sh               # Build all 3 Docker images
│   ├── deploy-minikube.sh            # Start Minikube, deploy Helm chart
│   ├── cleanup.sh                    # Remove all K8s resources
│   ├── health-check.sh               # Smoke tests (verify /health endpoints)
│   └── ai-gen/                       # AI tool prompts and outputs
│       ├── docker-ai-prompts.md      # Docker AI (Gordon) commands
│       ├── kubectl-ai-prompts.md     # kubectl-ai commands
│       └── kagent-prompts.md         # kagent commands
│
├── docs/                             # Phase IV: Deployment documentation (NEW)
│   ├── DEPLOYMENT.md                 # Step-by-step Minikube deployment guide
│   ├── TROUBLESHOOTING.md            # Common issues (ImagePullBackOff, CrashLoopBackOff)
│   └── ARCHITECTURE.md               # Service topology, network diagram
│
├── backend/                          # Phase II/III: Existing application code
│   ├── src/
│   │   ├── api/
│   │   │   ├── main.py               # Health check endpoints already exist
│   │   │   └── ...
│   │   └── mcp/
│   └── tests/
│
├── frontend-web/                     # Phase II/III: Existing Next.js 16 app
│   ├── app/
│   ├── components/
│   └── ...
│
├── frontend-chatbot/                 # Phase III: Existing Next.js 14 chatbot
│   ├── app/
│   ├── components/
│   └── ...
│
├── .specify/                         # Phase I: Preserved
│   └── memory/
│       ├── constitution.md           # Phase I
│       ├── phase-2-constitution.md   # Phase II
│       └── phase-4-constitution.md   # Phase IV (this deployment)
│
├── specs/                            # Spec-Kit Plus specifications
│   └── 003-k8s-deployment/
│       └── (files listed above)
│
└── history/                          # Prompt History Records
    ├── adr/                          # Architecture Decision Records
    └── prompts/
        └── 003-k8s-deployment/       # PHRs for this feature
```

**Structure Decision**: Infrastructure-as-Code layout with clear separation of Docker images (docker/), Kubernetes manifests (k8s/), Helm charts (helm-charts/), and automation scripts (scripts/). Existing application code (backend/, frontend-web/, frontend-chatbot/) remains unchanged. All infrastructure definitions are declarative YAML in version control. Secrets are templated but never committed.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected.** All Phase IV constitution requirements are met without exceptions.

---

## Phase 0: Outline & Research

### Unknowns from Technical Context

Based on the Technical Context section, the following items require research:

1. **Phase III Cloud-Native Verification**
   - NEEDS CLARIFICATION: Graceful shutdown (SIGTERM handling) implementation status
   - NEEDS CLARIFICATION: Structured logging (JSON format) implementation status
   - Research task: Verify backend/frontend-web/frontend-chatbot implement Phase III requirements

2. **AI Tools Setup & Configuration**
   - NEEDS CLARIFICATION: Docker AI (Gordon) installation and beta feature enablement
   - NEEDS CLARIFICATION: kubectl-ai installation and authentication
   - NEEDS CLARIFICATION: kagent installation and cluster connection
   - Research task: Document AI tool setup procedures and version verification

3. **Existing Application Containerization Readiness**
   - NEEDS CLARIFICATION: Current backend startup command and port configuration
   - NEEDS CLARIFICATION: Frontend build processes (Next.js 14 vs 16 differences)
   - NEEDS CLARIFICATION: Environment variable dependencies (complete list for all services)
   - Research task: Audit application code for containerization blockers

4. **Resource Sizing and Optimization**
   - NEEDS CLARIFICATION: Current application memory usage (baseline measurements)
   - NEEDS CLARIFICATION: Image layer optimization strategies for Next.js production builds
   - Research task: Best practices for Node.js alpine images, Python slim images

### Research Tasks

#### Task 1: Verify Phase III Cloud-Native Compliance

**Objective**: Confirm all 3 services implement Phase III cloud-native requirements (stateless, health checks, graceful shutdown, externalized config, structured logging).

**Actions**:
1. Read backend/src/api/main.py - verify /health and /ready endpoints exist
2. Read backend graceful shutdown implementation (SIGTERM signal handler)
3. Check backend logging format (JSON structured logs)
4. Verify frontend-web and frontend-chatbot have no session state
5. Check all services use environment variables (no hardcoded config)

**Expected Output**: List of Phase III requirements with PASS/FAIL status and remediation steps if needed.

#### Task 2: AI DevOps Tools Setup Research

**Objective**: Document installation, configuration, and verification procedures for kubectl-ai, kagent, and Docker AI (Gordon).

**Actions**:
1. Research Docker AI (Gordon) beta feature requirements (Docker Desktop version, enable steps)
2. Research kubectl-ai installation methods (brew, go install, binary download)
3. Research kagent installation and cluster connection
4. Document version verification commands
5. Identify fallback strategies if tools unavailable

**Expected Output**: Step-by-step setup guide with installation commands, configuration files, and verification tests.

#### Task 3: Application Containerization Readiness Audit

**Objective**: Identify all dependencies, startup commands, build processes, and environment variables required for containerization.

**Actions**:
1. Document backend startup: uvicorn command, port, workers, reload settings
2. Document frontend-web build: next build, next start, env vars (NEXT_PUBLIC_*)
3. Document frontend-chatbot build: similar Next.js process
4. List all environment variables from .env files (backend, frontend-web, frontend-chatbot)
5. Identify file system dependencies (read-only vs read-write volumes)

**Expected Output**: Complete containerization manifest listing all dependencies, commands, ports, and environment variables per service.

#### Task 4: Multi-Stage Dockerfile Best Practices Research

**Objective**: Research optimal multi-stage Docker build patterns for Python FastAPI and Node.js Next.js applications to achieve target image sizes.

**Actions**:
1. Research Python slim vs alpine base images (trade-offs, size, compatibility)
2. Research Next.js standalone output mode for minimal production images
3. Research layer caching strategies (COPY package.json before COPY src/)
4. Research security hardening (non-root user creation, read-only filesystem)
5. Research HEALTHCHECK integration patterns

**Expected Output**: Multi-stage Dockerfile templates with best practices annotations for backend and frontends.

---

Now generating research.md...
