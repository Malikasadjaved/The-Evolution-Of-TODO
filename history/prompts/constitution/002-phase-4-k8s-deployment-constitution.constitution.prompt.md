---
id: 002
title: Create Phase 4 Kubernetes Deployment Constitution
stage: constitution
date: 2026-01-03
surface: agent
model: claude-sonnet-4-5
feature: kubernetes-deployment
branch: main
user: Asad Javed
command: /sp.constitution
labels: ["phase4", "kubernetes", "helm", "docker", "minikube", "aiops", "constitution"]
links:
  spec: specs/003-k8s-deployment/spec.md (to be created)
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/phase-4-constitution.md
tests:
  - Manual validation: Constitution structure follows template
  - Manual validation: All 12 principles defined with rationale
  - Manual validation: AIOps tools (kubectl-ai, kagent, Gordon) mandated
---

## Prompt

User requested to start Phase IV (Kubernetes Deployment) strictly following the hackathon document workflow:

**User Input:**
```
read the file C:\Users\HP\Downloads\Hackathon II - Todo Spec-Driven Development.md
in the file do we need to write the constitution for phase IV first?
follow the document to start with phase Iv strictly
```

**Context:**
- Phase IV deadline: January 4, 2026 (TOMORROW)
- Worth: 250 points + 200 bonus (Cloud-Native Blueprints)
- Current status: Phase I-III complete (450/1000 points earned)
- Required: Deploy Todo Chatbot (3 services) on Minikube using Helm charts

**Hackathon Document Workflow:**
The Agentic Dev Stack requires: **Constitution → Specify → Plan → Tasks → Implement**

From document Section "The Agentic Dev Stack":
> **Hierarchy**: `Constitution > Specify > Plan > Tasks`
>
> Every agent in this project MUST obey these rules:
> 1. Never generate code without a referenced Task ID
> 2. Never modify architecture without updating speckit.plan
> 3. Never propose features without updating speckit.specify
> 4. **Never change approach without updating speckit.constitution**

**Existing Constitutions:**
- Phase 1: `.specify/memory/constitution.md` (Console App)
- Phase 2: `.specify/memory/phase-2-constitution.md` (Full-Stack Web)
- Phase 3: `.specify/memory/phase-3-constitution.md` (AI Chatbot)
- Phase 4: ❌ MISSING

**Why Phase IV Needs New Constitution:**
Phase IV introduces entirely new domain (infrastructure/deployment) with distinct principles:
- Containerization (Docker multi-stage builds, image optimization)
- Kubernetes orchestration (Deployments, Services, ConfigMaps, Secrets)
- Helm charts (templating, values.yaml conventions)
- AIOps tools (kubectl-ai, kagent, Docker AI Gordon)
- Infrastructure as Code (declarative manifests, GitOps)

## Response snapshot

**Constitution Created:** `.specify/memory/phase-4-constitution.md` (Version 1.0.0)

**Structure (12 Core Principles):**

I. **Agentic Infrastructure Development** (NON-NEGOTIABLE)
   - NO manual Dockerfile/manifest writing
   - Mandatory AI tools: Docker AI (Gordon), kubectl-ai, kagent
   - Document all AI prompts in PHRs
   - Fallback policy if tools unavailable

II. **Container-First Architecture**
   - Multi-stage Dockerfiles (deps → builder → runtime)
   - Image optimization (<500MB backend, <300MB frontends)
   - Security hardening (non-root user, health checks)
   - Externalized configuration (no hardcoded URLs)

III. **Kubernetes-Native Design**
   - Resource types: Deployments (stateless), Services (networking), ConfigMaps, Secrets
   - Liveness/Readiness probes (mandatory)
   - Resource limits & requests (mandatory)
   - Pod disruption budgets

IV. **Helm Chart Standardization**
   - Chart structure: Chart.yaml, values.yaml, templates/
   - Templating best practices (use {{ .Values.* }})
   - Values files for environments (dev, prod)
   - Lint & dry-run validation

V. **Minikube Local Development**
   - Production-like config (4 CPUs, 8GB RAM)
   - Development-production parity
   - NodePort services for local access
   - Debugging tools (logs, exec, dashboard)

VI. **AIOps Integration** (MANDATORY)
   - kubectl-ai for manifest generation
   - kagent for cluster optimization
   - Docker AI (Gordon) for Dockerfile generation
   - Record ALL AI commands in PHRs

VII. **Infrastructure as Code (IaC)**
   - GitOps-ready (Git as single source of truth)
   - Declarative manifests (never imperative kubectl run)
   - Secret management (never commit secrets)
   - File organization (docker/, k8s/, helm-charts/, scripts/)

VIII. **Observability & Debugging**
   - Structured JSON logging (inherited from Phase III)
   - Health checks (/health, /ready)
   - Metrics collection (kubectl top, dashboard)
   - Debugging workflow (logs, describe, exec, events)

IX. **Resource Management**
   - CPU/memory limits for ALL containers
   - Default allocations defined (backend: 256Mi/250m requests)
   - Capacity planning for Minikube cluster
   - Autoscaling configuration (optional for Phase IV)

X. **Security & Secrets Management**
   - Non-root containers (USER appuser)
   - Kubernetes Secrets (not ConfigMaps)
   - Image scanning (docker scan, trivy)
   - Network policies (optional for Phase IV)

XI. **Deployment Validation & Rollback**
   - Pre-deployment: helm lint, dry-run, manifest validation
   - Post-deployment: smoke tests (health checks, curl tests)
   - Rolling update strategy (maxUnavailable: 0)
   - Rollback procedure (helm rollback)

XII. **Cloud-Native Blueprints & Reusable Skills**
   - Create Helm Chart Generator Skill
   - Create Kubernetes Deployment Blueprint
   - Create Docker Multi-Stage Builder Skill
   - **Earns Bonus Points (+200 Cloud-Native Blueprints)**

**Inherited from Phase III:**
- Stateless architecture (critical for K8s horizontal scaling)
- Health check endpoints (/health, /ready)
- Graceful shutdown (SIGTERM handling)
- Externalized configuration (environment variables)
- Structured logging (JSON format)

**Success Criteria (Phase IV Complete):**
1. ✅ All 3 Docker images built and optimized
2. ✅ Helm chart created with templates
3. ✅ Deployed on Minikube (all pods Running)
4. ✅ Health checks passing
5. ✅ Services accessible
6. ✅ AI tools used and documented
7. ✅ Infrastructure code committed
8. ✅ Deployment guide written
9. ✅ Smoke tests automated
10. ✅ Rollback tested
11. ✅ PHRs created
12. ✅ Demo video recorded (<90s)

**Points Potential:**
- Phase IV: 250 points
- Bonus (Cloud-Native Blueprints): +200 points
- **Total: 450 points**

## Outcome

- ✅ Impact: **CRITICAL MILESTONE** - Phase IV constitution created, establishes deployment principles for 450-point phase
- 🧪 Tests: Manual validation of constitution structure, principles completeness, AIOps tool requirements
- 📁 Files: 1 file created (phase-4-constitution.md, ~800 lines)
- 🔁 Next prompts: `/sp.specify` to create infrastructure specification, then `/sp.plan`, `/sp.tasks`, `/sp.implement`
- 🧠 Reflection: Constitution comprehensively covers containerization, Kubernetes, Helm, AIOps tools, and IaC principles. Inherits Phase III cloud-native requirements. Ready for spec writing.

## Evaluation notes (flywheel)

- Failure modes observed: None - followed strict workflow from hackathon document
- Graders run and results (PASS/FAIL):
  - Constitution structure validation: PASS
  - 12 principles defined with rationale: PASS
  - AIOps tools mandatory requirement: PASS
  - Inheritance from Phase III documented: PASS
  - Success criteria defined: PASS
- Prompt variant (if applicable): Standard `/sp.constitution` workflow
- Next experiment (smallest change to try): Proceed to `/sp.specify` to create infrastructure specification (specs/003-k8s-deployment/spec.md)
