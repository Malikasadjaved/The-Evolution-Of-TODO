# Feature Specification: Kubernetes Deployment for Todo Application

**Feature Branch**: `003-k8s-deployment`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Deploy all 3 services (backend FastAPI, frontend-web Next.js 16, frontend-chatbot Next.js 14) on Minikube using Helm charts. Use AI tools (kubectl-ai, kagent, Docker AI Gordon) for infrastructure generation. Follow phase-4-constitution.md requirements."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Container Images Built and Ready (Priority: P1)

As a DevOps engineer, I need all three application services packaged as optimized container images so that they can be deployed to any container orchestration platform.

**Why this priority**: Without containerized applications, no deployment can happen. This is the foundational requirement that enables all subsequent deployment steps.

**Independent Test**: Can be fully tested by building each Docker image, running it locally with `docker run`, and verifying the application starts successfully and responds to health check endpoints.

**Acceptance Scenarios**:

1. **Given** Dockerfile exists for backend service, **When** image is built, **Then** image size is under 500MB and container starts successfully
2. **Given** Dockerfile exists for frontend-web service, **When** image is built, **Then** image size is under 300MB and Next.js application serves on port 3000
3. **Given** Dockerfile exists for frontend-chatbot service, **When** image is built, **Then** image size is under 300MB and application is accessible
4. **Given** all images are built, **When** containers run locally, **Then** health check endpoints return successful responses

---

### User Story 2 - Local Kubernetes Cluster Operational (Priority: P1)

As a developer, I need a functional local Kubernetes cluster so that I can deploy and test the application in an environment that mirrors production.

**Why this priority**: The deployment target must exist and be configured before any application deployment can occur. This provides the runtime environment.

**Independent Test**: Can be fully tested by starting Minikube, verifying cluster nodes are ready, and confirming essential addons (metrics-server, dashboard) are running.

**Acceptance Scenarios**:

1. **Given** Minikube is installed, **When** cluster is started with 4 CPUs and 8GB RAM, **Then** cluster status shows "Running" and nodes are "Ready"
2. **Given** cluster is running, **When** metrics-server addon is enabled, **Then** `kubectl top nodes` returns resource utilization data
3. **Given** cluster is running, **When** dashboard addon is enabled, **Then** Kubernetes dashboard UI is accessible
4. **Given** cluster has sufficient resources, **When** checking available capacity, **Then** at least 3 CPUs and 6GB RAM available for application workloads

---

### User Story 3 - Application Deployed via Helm Chart (Priority: P1)

As a platform engineer, I need the entire multi-service application deployed using a single Helm chart so that I can manage all components as a cohesive release with versioning and rollback capabilities.

**Why this priority**: Helm provides the deployment abstraction layer that enables reproducible, versioned deployments across environments. This is the primary deployment mechanism for Phase IV.

**Independent Test**: Can be fully tested by installing the Helm chart, verifying all pods reach Running status, and confirming services are accessible via NodePort or port-forwarding.

**Acceptance Scenarios**:

1. **Given** Helm chart is created with templates for all services, **When** chart is installed with `helm install todo-app`, **Then** all pods (backend, frontend-web, frontend-chatbot) transition to Running state within 2 minutes
2. **Given** application is deployed, **When** accessing backend service endpoint, **Then** `/health` endpoint returns 200 OK
3. **Given** application is deployed, **When** accessing frontend services via NodePort, **Then** web UI and chatbot UI are accessible and functional
4. **Given** deployment is successful, **When** `helm list` is executed, **Then** todo-app release shows status "deployed"

---

### User Story 4 - Configuration Externalized and Secrets Secured (Priority: P2)

As a security-conscious operator, I need application configuration separated from container images and sensitive data stored securely so that the same images can be used across environments without exposing credentials.

**Why this priority**: Security and environment portability are critical for production readiness. ConfigMaps and Secrets enable the 12-factor app principle of config externalization.

**Independent Test**: Can be fully tested by deploying the application with different ConfigMap values for development vs production mode, and verifying secrets are not visible in pod specifications or image layers.

**Acceptance Scenarios**:

1. **Given** ConfigMaps exist for non-secret configuration, **When** pods are created, **Then** environment variables are injected from ConfigMaps
2. **Given** Secrets exist for sensitive data (DB credentials, API keys), **When** pods are created, **Then** secrets are mounted as environment variables and not visible in `kubectl describe pod`
3. **Given** same container images, **When** deployed with different values files (dev vs prod), **Then** applications behave correctly for respective environments
4. **Given** secrets are created, **When** attempting to read secret data, **Then** values are base64 encoded and require explicit decoding

---

### User Story 5 - Health Monitoring and Self-Healing Enabled (Priority: P2)

As a reliability engineer, I need automated health checks and self-healing capabilities so that unhealthy containers are automatically restarted without manual intervention.

**Why this priority**: Kubernetes liveness and readiness probes enable automated failure detection and recovery, which are essential for production-grade deployments.

**Independent Test**: Can be fully tested by intentionally breaking a service (e.g., killing the backend process), observing Kubernetes restart the pod automatically, and verifying service recovery.

**Acceptance Scenarios**:

1. **Given** liveness probes are configured, **When** a container process crashes, **Then** Kubernetes restarts the container automatically within 30 seconds
2. **Given** readiness probes are configured, **When** a pod is not ready (health check failing), **Then** Kubernetes removes pod from service load balancing until ready
3. **Given** health check endpoints exist, **When** probes execute, **Then** HTTP GET requests to `/health` and `/ready` return appropriate status codes
4. **Given** pod is unhealthy, **When** restart count increases, **Then** pod events show clear failure reason (CrashLoopBackOff, readiness failure, etc.)

---

### User Story 6 - Resource Limits Enforced for Stability (Priority: P2)

As a cluster administrator, I need CPU and memory limits defined for all containers so that resource-hungry processes cannot starve other services or crash the cluster.

**Why this priority**: Resource limits prevent noisy neighbor issues and ensure fair resource allocation across services. Critical for multi-tenant environments.

**Independent Test**: Can be fully tested by deploying pods with resource limits, attempting to exceed limits (memory bomb, CPU stress), and verifying Kubernetes enforces constraints (OOMKilled, CPU throttling).

**Acceptance Scenarios**:

1. **Given** resource requests are defined, **When** pods are scheduled, **Then** Kubernetes only schedules pods on nodes with sufficient available resources
2. **Given** memory limits are defined, **When** a container attempts to exceed limit, **Then** container is killed with OOMKilled status and restarted
3. **Given** CPU limits are defined, **When** a container attempts to use more CPU, **Then** CPU usage is throttled to limit
4. **Given** resource utilization metrics, **When** `kubectl top pods` is executed, **Then** current CPU/memory usage is displayed and below limits

---

### User Story 7 - AI-Assisted Infrastructure Generation (Priority: P3)

As a developer using AI DevOps tools, I want to generate Dockerfiles and Kubernetes manifests using AI assistants (kubectl-ai, kagent, Docker AI Gordon) so that I follow best practices without manual configuration authoring.

**Why this priority**: Demonstrates cutting-edge AIOps workflow and earns bonus points. While valuable, the core deployment can succeed with manually-authored configs if AI tools are unavailable.

**Independent Test**: Can be fully tested by executing AI tool commands (e.g., `kubectl-ai "create deployment for backend"`), capturing generated YAML, validating syntax, and applying to cluster successfully.

**Acceptance Scenarios**:

1. **Given** Docker AI (Gordon) is available, **When** prompted to create Dockerfile for FastAPI app, **Then** multi-stage Dockerfile is generated with security best practices
2. **Given** kubectl-ai is installed, **When** prompted to create deployment YAML, **Then** valid Kubernetes manifest is generated with appropriate resource limits
3. **Given** kagent is available, **When** cluster health analysis is requested, **Then** optimization recommendations are provided (resource allocation, pod distribution)
4. **Given** AI-generated configs, **When** applied to cluster, **Then** deployments succeed without syntax errors

---

### User Story 8 - Deployment Validation and Rollback Capability (Priority: P3)

As a release manager, I need automated post-deployment validation and one-command rollback capability so that failed deployments can be quickly reverted without data loss or extended downtime.

**Why this priority**: Reduces deployment risk and enables continuous delivery. Rollback capability is a safety net for production changes.

**Independent Test**: Can be fully tested by deploying a breaking change (e.g., misconfigured environment variable), observing smoke tests fail, executing `helm rollback`, and verifying services return to previous working state.

**Acceptance Scenarios**:

1. **Given** new deployment is applied, **When** smoke tests execute, **Then** all critical endpoints are validated (health checks, sample API calls)
2. **Given** smoke tests fail, **When** deployment is deemed unhealthy, **Then** clear failure indicators are displayed (pod status, events, logs)
3. **Given** failed deployment, **When** `helm rollback todo-app` is executed, **Then** application returns to previous release version within 1 minute
4. **Given** rollback is complete, **When** smoke tests re-run, **Then** all tests pass with previous release

---

### Edge Cases

- **What happens when Minikube cluster runs out of resources?**
  - Pods remain in Pending state with "Insufficient CPU" or "Insufficient memory" events
  - Resource requests prevent over-scheduling; cluster gracefully degrades rather than crashing
  - Mitigation: Monitor resource utilization, set appropriate limits, scale cluster resources

- **How does system handle network connectivity loss during deployment?**
  - ImagePullBackOff errors occur if container images cannot be pulled
  - Kubernetes retries image pull with exponential backoff
  - Mitigation: Pre-pull images to Minikube Docker daemon, use local image registry

- **What happens when secrets are missing or misconfigured?**
  - Pods fail to start with CrashLoopBackOff
  - Application logs show clear error (e.g., "DATABASE_URL not set")
  - Mitigation: Validate secrets exist before deployment, use init containers for pre-flight checks

- **How does system handle conflicting port assignments (NodePort collision)?**
  - Service creation fails with "port already allocated" error
  - Kubernetes prevents port conflicts at API server level
  - Mitigation: Use dynamic NodePort allocation or specify unique ports in values.yaml

- **What happens during rolling updates with zero downtime requirement?**
  - RollingUpdate strategy ensures old pods remain until new pods are ready
  - maxUnavailable: 0 prevents any downtime
  - Mitigation: Configure readiness probes correctly, use PodDisruptionBudgets

## Requirements *(mandatory)*

### Functional Requirements

**Containerization**:

- **FR-001**: System MUST package backend FastAPI application as container image under 500MB
- **FR-002**: System MUST package frontend-web Next.js application as container image under 300MB
- **FR-003**: System MUST package frontend-chatbot Next.js application as container image under 300MB
- **FR-004**: Container images MUST use multi-stage builds to minimize final image size
- **FR-005**: Container images MUST run as non-root user for security compliance
- **FR-006**: Container images MUST include HEALTHCHECK instruction for monitoring

**Kubernetes Resources**:

- **FR-007**: System MUST deploy backend service as Kubernetes Deployment with 2 replicas
- **FR-008**: System MUST deploy frontend-web service as Kubernetes Deployment with 2 replicas
- **FR-009**: System MUST deploy frontend-chatbot service as Kubernetes Deployment with 2 replicas
- **FR-010**: Each Deployment MUST define liveness probe targeting application health endpoint
- **FR-011**: Each Deployment MUST define readiness probe targeting application ready endpoint
- **FR-012**: System MUST create ClusterIP Service for backend (internal communication only)
- **FR-013**: System MUST create NodePort Service for frontend-web (external access on port 30000)
- **FR-014**: System MUST create NodePort Service for frontend-chatbot (external access on port 30001)

**Configuration Management**:

- **FR-015**: System MUST externalize non-secret configuration via Kubernetes ConfigMaps
- **FR-016**: System MUST store sensitive data (DATABASE_URL, OPENAI_API_KEY, BETTER_AUTH_SECRET) in Kubernetes Secrets
- **FR-017**: ConfigMaps MUST include environment-specific settings (API URLs, log levels)
- **FR-018**: Secrets MUST be mounted as environment variables in pod specifications
- **FR-019**: Container images MUST NOT contain hardcoded environment-specific values

**Resource Management**:

- **FR-020**: Backend pods MUST define CPU request of 250m and limit of 500m
- **FR-021**: Backend pods MUST define memory request of 256Mi and limit of 512Mi
- **FR-022**: Frontend pods MUST define CPU request of 100m and limit of 200m
- **FR-023**: Frontend pods MUST define memory request of 128Mi and limit of 256Mi
- **FR-024**: Total resource requests MUST fit within Minikube cluster capacity (3 CPUs, 6GB RAM available)

**Helm Chart Packaging**:

- **FR-025**: System MUST provide Helm chart with Chart.yaml defining metadata (name, version, description)
- **FR-026**: Helm chart MUST include values.yaml with configurable parameters (replica counts, image tags, resource limits)
- **FR-027**: Helm chart MUST generate Deployment templates from values for all 3 services
- **FR-028**: Helm chart MUST generate Service templates from values for all 3 services
- **FR-029**: Helm chart MUST generate ConfigMap and Secret templates
- **FR-030**: Helm chart MUST support environment-specific values files (values-dev.yaml, values-prod.yaml)

**Deployment Validation**:

- **FR-031**: System MUST validate Helm chart syntax with `helm lint` before installation
- **FR-032**: System MUST perform dry-run deployment to catch configuration errors
- **FR-033**: System MUST execute smoke tests post-deployment (health endpoint checks, sample API calls)
- **FR-034**: System MUST support rollback to previous release with `helm rollback` command
- **FR-035**: System MUST retain deployment history for rollback (minimum 3 previous releases)

**AI-Assisted Generation** (Optional, for bonus points):

- **FR-036**: Dockerfiles SHOULD be generated using Docker AI (Gordon) with prompts for multi-stage builds
- **FR-037**: Kubernetes manifests SHOULD be generated using kubectl-ai with prompts for deployments and services
- **FR-038**: Cluster optimization SHOULD be performed using kagent for resource allocation recommendations
- **FR-039**: All AI tool prompts and generated outputs SHOULD be documented in Prompt History Records (PHRs)

### Key Entities

**Container Image**:
- Packaged application with all dependencies
- Tagged with version or commit SHA for traceability
- Stored in Minikube local Docker registry or external registry
- Attributes: name, tag, size, base image, build date

**Deployment**:
- Kubernetes resource managing stateless application replicas
- Ensures desired number of pods are running
- Handles rolling updates and rollbacks
- Attributes: name, replica count, container spec, update strategy

**Service**:
- Kubernetes resource providing stable network endpoint
- Load balances traffic across pod replicas
- Types: ClusterIP (internal), NodePort (external), LoadBalancer (cloud)
- Attributes: name, type, port, target port, selector

**ConfigMap**:
- Key-value pairs for non-sensitive configuration
- Injected as environment variables or mounted as files
- Environment-specific (dev, staging, prod)
- Attributes: name, data (key-value pairs)

**Secret**:
- Base64-encoded sensitive data
- Database credentials, API keys, certificates
- Encrypted at rest in etcd (Kubernetes datastore)
- Attributes: name, type, data (encoded key-value pairs)

**Helm Release**:
- Instance of Helm chart deployed to cluster
- Versioned for rollback capability
- Manages lifecycle of all Kubernetes resources
- Attributes: name, chart version, release version, status, values

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Deployment Success**:

- **SC-001**: All 3 services (backend, frontend-web, frontend-chatbot) are deployed and running on Minikube cluster within 5 minutes of Helm install command
- **SC-002**: 100% of pods reach Running state with 0 restarts within 2 minutes of deployment
- **SC-003**: Health check endpoints for all services return HTTP 200 status within 30 seconds of pod startup

**Resource Efficiency**:

- **SC-004**: Backend container image size is under 500MB (target: 450MB or less)
- **SC-005**: Frontend container image sizes are under 300MB each (target: 250MB or less)
- **SC-006**: Total cluster resource usage stays under 70% of allocated capacity (2.1 CPUs, 4.2GB RAM used of 3 CPUs, 6GB available)

**Operational Readiness**:

- **SC-007**: Services remain accessible and responsive during rolling update with zero downtime
- **SC-008**: Failed deployment can be rolled back to previous working version within 1 minute using `helm rollback`
- **SC-009**: Application survives pod failure and self-heals (unhealthy pods restarted automatically within 30 seconds)

**Configuration Management**:

- **SC-010**: Same container images can be deployed to different environments (dev, prod) using different Helm values files without rebuild
- **SC-011**: Sensitive secrets are not exposed in pod specifications, logs, or environment variable listings

**AI-Assisted Workflow** (Bonus Points):

- **SC-012**: At least 80% of infrastructure code (Dockerfiles, Kubernetes manifests) is generated using AI tools (kubectl-ai, kagent, Docker AI Gordon)
- **SC-013**: All AI tool interactions are documented with prompts and outputs in Prompt History Records (PHRs)

**Developer Experience**:

- **SC-014**: Developer can deploy entire application stack with a single command: `helm install todo-app ./helm-charts/todo-app`
- **SC-015**: Services are accessible via clear URLs: `minikube service frontend-web-service --url` returns working endpoint
- **SC-016**: Kubernetes dashboard shows clear visualization of all deployed resources (pods, services, deployments)

## Assumptions

**Infrastructure**:
- Minikube is installed with kubectl configured to communicate with cluster
- Docker is installed and Minikube is using Docker driver
- Local machine has at least 4 CPUs and 8GB RAM available for Minikube

**Existing Application**:
- Phase III Todo Chatbot (backend, frontend-web, frontend-chatbot) is fully functional
- Application implements cloud-native requirements from Phase III constitution:
  - Stateless architecture (no in-memory sessions)
  - Health check endpoints (/health, /ready)
  - Graceful shutdown handlers (SIGTERM)
  - Externalized configuration (environment variables)
  - Structured JSON logging

**Development Environment**:
- AI tools (kubectl-ai, kagent, Docker AI Gordon) are installed and configured (optional for core deployment)
- Git is available for version control of infrastructure code
- Bash or PowerShell is available for running automation scripts

**Networking**:
- NodePort range 30000-32767 is available on local machine
- No firewall blocking Minikube service access
- Internet connectivity available for pulling base container images

**Secrets Management**:
- Sensitive values (DATABASE_URL, OPENAI_API_KEY, BETTER_AUTH_SECRET) are provided by user
- Secrets are NOT committed to version control
- Deployment documentation includes secret creation instructions

## Out of Scope

**Cloud Deployment**:
- Deploying to managed Kubernetes (AKS, GKE, EKS) - reserved for Phase V
- Production-grade ingress controllers (NGINX, Traefik) - Minikube uses NodePort
- TLS/SSL certificate management - local development uses HTTP
- External load balancers (MetalLB, cloud LB) - not needed for single-node Minikube

**Advanced Features**:
- Horizontal Pod Autoscaling (HPA) based on CPU/memory metrics - defined but not required for Phase IV
- Persistent storage with PersistentVolumeClaims - application uses external managed database (Neon)
- Network policies for pod-to-pod communication restrictions - optional for Phase IV
- Service mesh (Istio, Linkerd) - overkill for local development
- GitOps automation (Flux, ArgoCD) - manual deployment with Helm

**CI/CD Pipeline**:
- Automated image builds on Git commits - manual builds for Phase IV
- Automated deployment on merge to main - manual Helm install/upgrade
- Integration testing in CI pipeline - manual smoke tests post-deployment

**Monitoring & Observability**:
- Prometheus metrics collection - basic Kubernetes metrics-server only
- Grafana dashboards - Kubernetes dashboard for visualization
- Distributed tracing (Jaeger, Zipkin) - reserved for Phase V
- Log aggregation (ELK stack, Loki) - local kubectl logs only

**Database Management**:
- Running PostgreSQL in Kubernetes - application uses external Neon database
- Database migrations via Kubernetes Jobs - application handles migrations on startup
- Database backups and restoration - managed by Neon cloud service

**Security Hardening**:
- Pod Security Policies/Standards enforcement - basic non-root user only
- Image vulnerability scanning with admission controllers - manual scanning only
- RBAC (Role-Based Access Control) configuration - default ServiceAccount used
- Secrets encryption with KMS (Key Management Service) - basic Kubernetes Secrets only
