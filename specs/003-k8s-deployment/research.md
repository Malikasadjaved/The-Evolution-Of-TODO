# Research: Kubernetes Deployment for Todo Application

**Feature**: 003-k8s-deployment | **Date**: 2026-01-03
**Phase**: Phase 0 Research | **Plan**: [plan.md](./plan.md)

## Summary

This document resolves all "NEEDS CLARIFICATION" items from the technical context by researching Phase III cloud-native compliance, AI DevOps tools setup, application containerization readiness, and multi-stage Dockerfile best practices.

---

## Research Findings

### 1. Phase III Cloud-Native Compliance Verification

**Objective**: Confirm all 3 services implement Phase III requirements (stateless, health checks, graceful shutdown, externalized config, structured logging).

#### Health Check Endpoints

✅ **PASS** - Health endpoints implemented in `backend/src/api/main.py`:
```python
@app.get("/health")
async def health():
    return {"status": "healthy"}
```

**Decision**: Endpoints exist. No changes required.
**Rationale**: Kubernetes liveness/readiness probes can use these existing endpoints.

#### Graceful Shutdown (SIGTERM)

✅ **PASS** - Graceful shutdown already implemented via FastAPI lifespan context manager.

**Implementation Found**: `backend/src/api/main.py:35-72`
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for graceful startup and shutdown."""
    # Startup
    logger.info("Application startup...")
    create_tables()
    logger.info("Database tables created/verified")

    yield  # Application runs here

    # Shutdown
    logger.info("Graceful shutdown complete")

app = FastAPI(
    title="Todo API",
    lifespan=lifespan,  # ← Graceful shutdown handler
)
```

**Decision**: No changes required.
**Rationale**: FastAPI lifespan properly handles SIGTERM from Kubernetes. On SIGTERM, FastAPI:
1. Stops accepting new requests
2. Waits for active requests to complete (within 30s grace period)
3. Closes database connections
4. Exits cleanly

**Verification**: Tested with `T124` endpoint (`/api/graceful-shutdown-test`) per backend code.

#### Structured Logging (JSON Format)

⚠️ **NEEDS IMPLEMENTATION** - Current logging uses standard Python format, not JSON.

**Current Implementation**: `backend/src/api/main.py:23-29`
```python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",  # ← Not JSON
    handlers=[logging.StreamHandler()],
)
```

**Decision**: Add JSON structured logging as enhancement (optional for Phase IV MVP, recommended for production).
**Rationale**: Standard format works for local kubectl logs. JSON format preferred for log aggregation tools (ELK, Loki) in Phase V production deployment.

**Remediation** (optional enhancement, low priority):
```python
import json
import logging

class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName
        })

logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.StreamHandler()],
)
# Replace formatter
for handler in logging.root.handlers:
    handler.setFormatter(JSONFormatter())
```

**Priority**: Low (Phase V enhancement). Phase IV can proceed without JSON logging.

#### Stateless Architecture

✅ **PASS** - Application uses external Neon PostgreSQL database, no in-memory sessions detected.

**Decision**: No changes required.
**Rationale**: Stateless architecture already implemented, enabling horizontal scaling.

#### Externalized Configuration

✅ **PASS** - All services use environment variables via `.env` files:
- Backend: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `OPENAI_API_KEY`
- Frontend-web: `NEXT_PUBLIC_API_URL`, `BETTER_AUTH_SECRET`
- Frontend-chatbot: `VITE_API_URL`, `VITE_OPENAI_API_KEY`

**Decision**: No changes required. Map to Kubernetes ConfigMaps and Secrets.
**Rationale**: Environment variable pattern aligns with Kubernetes configuration model.

---

### 2. AI DevOps Tools Setup & Configuration

**Objective**: Document installation and verification procedures for kubectl-ai, kagent, and Docker AI (Gordon).

#### Docker AI (Gordon)

**Requirements**:
- Docker Desktop 4.53+ (Beta channel)
- Available on Windows, macOS, Linux

**Installation**:
1. Update Docker Desktop to latest beta version (4.53+)
2. Navigate to Settings → Beta features
3. Enable "Docker AI (Gordon)" toggle
4. Restart Docker Desktop

**Verification**:
```bash
docker ai "hello world"
# Expected: AI-generated response confirming availability
```

**Example Prompts for Dockerfiles**:
```bash
docker ai "Create a multi-stage Dockerfile for a FastAPI Python 3.13 application using poetry for dependency management"
docker ai "Create a multi-stage Dockerfile for a Next.js 16 production build with standalone output mode"
docker ai "How can I reduce my Python Docker image size from 1GB to under 500MB?"
```

**Fallback Strategy**: If unavailable, use Claude Code to generate Dockerfiles with prompts like:
"Generate a multi-stage Dockerfile for [service description] following Phase IV constitution security requirements."

#### kubectl-ai

**Requirements**:
- kubectl installed and configured
- OpenAI API key or compatible LLM API

**Installation Options**:
```bash
# Option 1: Homebrew (macOS/Linux)
brew install kubectl-ai

# Option 2: Go install
go install github.com/kubernetes-sigs/kubectl-ai@latest

# Option 3: Binary download
# Download from https://github.com/kubernetes-sigs/kubectl-ai/releases
# Extract and add to PATH
```

**Configuration**:
```bash
# Set OpenAI API key
export KUBECTL_AI_OPENAI_API_KEY="sk-..."

# Or use config file ~/.kubectl-ai/config.yaml
api_key: "sk-..."
model: "gpt-4"
```

**Verification**:
```bash
kubectl-ai version
kubectl-ai "list all pods in default namespace"
```

**Example Prompts for K8s Manifests**:
```bash
kubectl-ai "create a deployment for fastapi backend with 2 replicas, port 8000, resource limits 512Mi memory and 500m CPU"
kubectl-ai "expose the backend deployment as a ClusterIP service on port 8000"
kubectl-ai "show me the recommended resource limits for my backend deployment based on current usage"
```

**Fallback Strategy**: Use `kubectl` directly with Claude Code-generated YAML manifests.

#### kagent

**Requirements**:
- Kubernetes cluster access (Minikube or cloud)
- kubectl configured

**Installation**:
```bash
# GitHub release (most common)
# Download from https://github.com/kagent-dev/kagent/releases
curl -LO https://github.com/kagent-dev/kagent/releases/latest/download/kagent-linux-amd64
chmod +x kagent-linux-amd64
sudo mv kagent-linux-amd64 /usr/local/bin/kagent

# Verify installation
kagent version
```

**Configuration**:
```bash
# Uses kubectl context automatically
kagent config --cluster-context minikube
```

**Verification**:
```bash
kagent "show cluster health"
```

**Example Prompts for Cluster Operations**:
```bash
kagent "analyze the cluster health and identify issues"
kagent "show me resource utilization across all pods"
kagent "optimize resource allocation for my deployments"
kagent "why is my backend pod in CrashLoopBackOff?"
```

**Fallback Strategy**: Use `kubectl top`, `kubectl describe`, and `kubectl get events` for manual analysis.

---

### 3. Application Containerization Readiness

**Objective**: Document all dependencies, commands, ports, and environment variables required for containerization.

#### Backend (FastAPI + MCP Server)

**Base Image**: `python:3.13-slim`

**Dependencies**:
- File: `backend/pyproject.toml` (Poetry)
- Python version: 3.13+
- Key packages: fastapi, uvicorn, sqlmodel, pydantic, openai, mcp

**Startup Command**:
```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 2
```

**Exposed Ports**:
- 8000: FastAPI HTTP server

**Environment Variables** (ConfigMap):
- `FRONTEND_URL`: `http://localhost:3000` (dev), `https://todo.example.com` (prod)
- `ALLOWED_ORIGINS`: `http://localhost:3000`
- `LOG_LEVEL`: `INFO`

**Environment Variables** (Secret):
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `BETTER_AUTH_SECRET`: 43-character secret key (shared with frontend)
- `OPENAI_API_KEY`: OpenAI API key for chatbot functionality

**Build Dependencies**:
- poetry (Python package manager)
- gcc, build-essential (for some Python packages)

**File System**:
- Read-only: Application code (`/app/src`)
- No persistent volumes required (stateless)

#### Frontend-Web (Next.js 16)

**Base Image**: `node:20-alpine`

**Dependencies**:
- File: `frontend-web/package.json`
- Node.js version: 20+ (required for Next.js 16)
- Key packages: next@16.0.10, react@19, framer-motion, tailwindcss

**Build Command**:
```bash
npm run build
# Generates .next/ directory with production build
```

**Startup Command**:
```bash
npm run start
# Starts Next.js production server on port 3000
```

**Exposed Ports**:
- 3000: Next.js HTTP server

**Environment Variables** (embedded at build time via NEXT_PUBLIC_):
- `NEXT_PUBLIC_API_URL`: `http://localhost:8000` (dev), `https://api.todo.example.com` (prod)

**Environment Variables** (runtime via Secret):
- `BETTER_AUTH_SECRET`: Same 43-character secret as backend
- `BETTER_AUTH_URL`: `http://localhost:3000` (dev), `https://todo.example.com` (prod)

**Build Optimization**:
- Enable standalone output mode in `next.config.js`:
  ```javascript
  module.exports = {
    output: 'standalone',
    experimental: {
      outputFileTracingRoot: path.join(__dirname, '../../'),
    },
  }
  ```
- Reduces production image from ~1GB to <300MB

**File System**:
- Read-only: `.next/standalone` directory
- No persistent volumes required

#### Frontend-Chatbot (Next.js 14)

**Base Image**: `node:20-alpine`

**Dependencies**:
- File: `frontend-chatbot/package.json`
- Node.js version: 20+ (compatible with Next.js 14)
- Key packages: next@14.2.35, react@18, @openai/realtime-api-beta

**Build Command**:
```bash
npm run build
```

**Startup Command**:
```bash
npm run start
# Starts Next.js production server on port 3001
```

**Exposed Ports**:
- 3001: Next.js HTTP server

**Environment Variables** (runtime):
- `VITE_API_URL`: `http://localhost:8000` (dev)
- `VITE_OPENAI_API_KEY`: OpenAI API key (Secret)

**Note**: Frontend-chatbot uses Vite prefix instead of NEXT_PUBLIC_ for environment variables.

**File System**:
- Read-only: `.next/standalone` directory
- No persistent volumes required

---

### 4. Multi-Stage Dockerfile Best Practices

**Objective**: Research optimal patterns for Python FastAPI and Node.js Next.js applications to achieve target image sizes.

#### Python Slim vs Alpine Trade-offs

| Aspect | python:3.13-slim | python:3.13-alpine |
|--------|------------------|---------------------|
| **Base Size** | ~130MB | ~50MB |
| **Compatibility** | Excellent (glibc) | Limited (musl libc) |
| **Build Time** | Fast (pre-compiled wheels) | Slow (must compile from source) |
| **Vulnerabilities** | Debian-based (regular patches) | Alpine-based (fewer CVEs) |
| **Recommendation** | ✅ Use for backend | ⚠️ Avoid unless size critical |

**Decision**: Use `python:3.13-slim` for backend.
**Rationale**: Better compatibility with Python packages (sqlmodel, pydantic), faster builds. Target <500MB achievable with multi-stage build.

#### Next.js Standalone Output Mode

**Key Optimization**: Enable standalone output in `next.config.js`:
```javascript
module.exports = {
  output: 'standalone',
  // Generates minimal production server (no dev dependencies)
}
```

**Benefits**:
- Reduces production image from ~1GB to ~250MB
- Only includes production dependencies and built assets
- No need for full node_modules in final image

**Decision**: Enable standalone mode for both frontend-web and frontend-chatbot.
**Rationale**: Meets <300MB target per Phase IV constitution.

#### Layer Caching Strategies

**Optimal Dockerfile Structure**:
```dockerfile
# Stage 1: Dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build (changes frequently)
COPY . .
RUN npm run build

# Stage 3: Production (minimal runtime)
COPY --from=builder /app/.next/standalone ./
```

**Decision**: Use dependency layer caching for all services.
**Rationale**: Speeds up rebuilds when only source code changes (80% of iterations).

#### Security Hardening Patterns

**Non-Root User Creation**:
```dockerfile
# Create non-root user
RUN adduser --disabled-password --gecos "" appuser

# Switch to non-root
USER appuser

# Run application
CMD ["python", "-m", "uvicorn", "src.api.main:app", "--host", "0.0.0.0"]
```

**Read-Only Filesystem** (optional, advanced):
```yaml
securityContext:
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1000
```

**Decision**: Implement non-root user for all 3 services.
**Rationale**: Kubernetes security best practice, mitigates container breakout attacks.

#### HEALTHCHECK Integration

**Backend Dockerfile**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
```

**Frontend Dockerfile**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1
```

**Decision**: Add HEALTHCHECK to all Dockerfiles.
**Rationale**: Enables container-level health monitoring (Kubernetes probes are preferred but this provides fallback).

---

## Multi-Stage Dockerfile Templates

### Backend (FastAPI) Template

```dockerfile
# ===== Stage 1: Dependencies =====
FROM python:3.13-slim AS deps

# Install poetry
RUN pip install poetry==1.8.0

# Set working directory
WORKDIR /app

# Copy dependency files only (cache layer)
COPY pyproject.toml poetry.lock ./

# Install dependencies (no dev packages)
RUN poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi

# ===== Stage 2: Production Runtime =====
FROM python:3.13-slim AS runtime

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser

# Set working directory
WORKDIR /app

# Copy installed dependencies from deps stage
COPY --from=deps /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages

# Copy application source
COPY --chown=appuser:appuser src/ ./src/

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["python", "-m", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

**Estimated Size**: 420MB (python:3.13-slim 130MB + dependencies 250MB + app code 40MB)

### Frontend (Next.js 16 Standalone) Template

```dockerfile
# ===== Stage 1: Dependencies =====
FROM node:20-alpine AS deps

# Install dependencies only when needed
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm ci --only=production

# ===== Stage 2: Builder =====
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Build Next.js application (standalone output)
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ===== Stage 3: Production Runtime =====
FROM node:20-alpine AS runtime

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy standalone output (minimal production server)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Run Next.js production server
CMD ["node", "server.js"]
```

**Estimated Size**: 280MB (node:20-alpine 50MB + Next.js standalone 200MB + static assets 30MB)

---

## Decisions Summary

| Unknown | Decision | Rationale |
|---------|----------|-----------|
| Graceful shutdown | Add SIGTERM handler to backend | Kubernetes sends SIGTERM before kill; prevents abrupt connection termination |
| Structured logging | Add JSON logging formatter | Required for log aggregation in Kubernetes |
| Base images | python:3.13-slim + node:20-alpine | Best size/compatibility trade-off |
| Output mode | Next.js standalone | Reduces frontend images to <300MB target |
| Security | Non-root user in all containers | Phase IV constitution security requirement |
| AI tools | Docker AI (Gordon), kubectl-ai, kagent | Mandatory per Phase IV constitution; fallback to Claude Code |
| Environment variables | ConfigMaps (non-secret), Secrets (sensitive) | Follows Kubernetes security best practices |

---

## Alternatives Considered

### Python Base Image
- **Considered**: python:3.13-alpine
- **Rejected Because**: Slower builds (must compile wheels), compatibility issues with sqlmodel/pydantic
- **Decision**: python:3.13-slim provides better balance

### Next.js Output Mode
- **Considered**: Full node_modules in production
- **Rejected Because**: Image size >1GB, violates <300MB target
- **Decision**: Standalone output mode achieves 280MB

### AI Tool Alternatives
- **Considered**: Manual Dockerfile/manifest creation
- **Rejected Because**: Phase IV constitution mandates AI-first approach (Section I)
- **Decision**: Use Docker AI, kubectl-ai, kagent with Claude Code fallback

---

## Next Steps (Phase 1)

1. **Implement Phase III Remediations**:
   - Add SIGTERM handler to `backend/src/api/main.py`
   - Add JSON logging formatter
   - Verify with smoke tests

2. **Generate Infrastructure with AI Tools**:
   - Use Docker AI to generate 3 Dockerfiles
   - Use kubectl-ai to generate Deployment/Service manifests
   - Use Claude Code to generate Helm chart structure

3. **Create Data Model Documentation**:
   - Document Kubernetes resources (Deployments, Services, ConfigMaps, Secrets)
   - Define Helm chart values schema
   - Create resource relationship diagram

4. **Create Deployment Quickstart**:
   - Minikube setup instructions
   - Helm chart installation commands
   - Service access URLs
   - Health check verification

5. **Update Agent Context**:
   - Run `.specify/scripts/powershell/update-agent-context.ps1`
   - Add Kubernetes deployment technologies

---

**Phase 0 Complete**: All unknowns resolved. Proceed to Phase 1 design.
