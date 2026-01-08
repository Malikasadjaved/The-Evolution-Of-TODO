---
name: docker-multi-stage-builder
description: |
  Generates optimized multi-stage Dockerfiles for production applications. Reduces image size by 60-80% through separate build/runtime stages, layer caching, and minimal base images. This skill should be used when users need to containerize applications (Python, Node.js, Go, Rust) with production-grade optimization, security hardening (non-root users, minimal attack surface), and health checks.
allowed-tools: Read, Write, Glob, Grep, Bash
---

# Docker Multi-Stage Builder

Generate production-optimized multi-stage Dockerfiles with minimal image sizes.

## What This Skill Does

- Generates multi-stage Dockerfiles (builder + runtime stages)
- Optimizes layer caching (copy dependencies first, then source code)
- Reduces image size (Python: 349MB, Node.js: 208MB typical)
- Implements security hardening (non-root users, minimal base images)
- Adds health checks (HTTP, TCP, or exec-based)
- Supports multiple languages (Python, Node.js, Go, Rust, Java)
- Handles build-time vs runtime environment variables
- Configures proper signal handling (graceful shutdown)

## What This Skill Does NOT Do

- Build or push Docker images (use `docker build` manually)
- Manage Docker Compose multi-container setups
- Create Kubernetes manifests (use helm-chart-generator skill)
- Optimize already-built images (only generates Dockerfiles)

---

## Before Implementation

Gather context to ensure successful Dockerfile generation:

| Source | Gather |
|--------|--------|
| **Codebase** | Existing Dockerfiles, package manifests (package.json, requirements.txt), build scripts, environment variables |
| **Conversation** | Language/framework, application type (API, frontend, worker), ports, health check endpoints |
| **Skill References** | Multi-stage patterns from `references/`, base image recommendations, security best practices |
| **User Guidelines** | Container registry, naming conventions, tagging strategy |

Ensure all required context is gathered before generating Dockerfile.

---

## Dockerfile Generation Workflow

### Step 1: Discover Application Type

Identify language, framework, and build requirements:

**Detection Methods**:
1. Read package manifest files (package.json, requirements.txt, go.mod, Cargo.toml)
2. Check for framework files (next.config.js, main.py, main.go)
3. Analyze build scripts (npm run build, python setup.py)

**Questions to Ask** (if cannot detect):
- Language and version? (e.g., Python 3.11, Node.js 20)
- Framework? (e.g., FastAPI, Next.js, Express, Django)
- Build command? (e.g., `npm run build`, `go build`)
- Runtime command? (e.g., `uvicorn main:app`, `node server.js`)
- Exposed port? (default: 8000 for APIs, 3000 for frontends)
- Health check endpoint? (e.g., `/health`, `/api/health`)

### Step 2: Select Base Image

Choose minimal, secure base image based on application type.

**Language-Specific Recommendations** (see `references/base-images.md`):

| Language | Base Image | Size | Use Case |
|----------|------------|------|----------|
| Python | `python:3.11-slim` | ~120MB | Production (default) |
| Python | `python:3.11-alpine` | ~50MB | Ultra-minimal (build issues possible) |
| Node.js | `node:20-alpine` | ~120MB | Production (default) |
| Go | `golang:1.21-alpine` (builder) + `alpine:3.19` (runtime) | ~10MB | Compiled binary |
| Rust | `rust:1.75-alpine` (builder) + `alpine:3.19` (runtime) | ~15MB | Compiled binary |
| Java | `eclipse-temurin:21-jre-alpine` | ~180MB | JVM applications |

**Security Principle**: Prefer `-slim` or `-alpine` variants to minimize attack surface.

### Step 3: Design Multi-Stage Structure

**Standard Pattern**:

```dockerfile
# Stage 1: Builder - Install dependencies and build
FROM <base>-<version> AS builder
WORKDIR /build
COPY <dependency-manifest> .
RUN <install-dependencies>
COPY . .
RUN <build-command>

# Stage 2: Runtime - Minimal production image
FROM <base>-<version>-slim
WORKDIR /app
COPY --from=builder /build/<output> ./
USER <non-root-user>
EXPOSE <port>
HEALTHCHECK CMD <health-command>
CMD [<runtime-command>]
```

**Key Optimizations**:
1. **Separate dependency install** → cache layer (only rebuild when dependencies change)
2. **Copy source code last** → maximize cache hits
3. **Copy only artifacts** → exclude build tools from final image

### Step 4: Implement Layer Caching

**Best Practice Order** (most to least frequently changed):
1. Install system packages
2. Copy dependency manifest (package.json, requirements.txt)
3. Install dependencies
4. Copy source code
5. Build application

**Example** (Python):
```dockerfile
# ✅ GOOD - Dependencies cached separately
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# ❌ BAD - Invalidates cache on any code change
COPY . .
RUN pip install -r requirements.txt
```

### Step 5: Add Security Hardening

**Non-Root User** (see `references/security.md`):

```dockerfile
# Create user with explicit UID for consistency
RUN groupadd --system --gid 1000 app && \
    useradd --system --no-create-home --uid 1000 --gid app app

# Set ownership of files
COPY --chown=app:app . .

# Switch to non-root user
USER app
```

**Read-Only Filesystem** (advanced):
```dockerfile
# Application must write only to specific directories
VOLUME ["/tmp", "/app/logs"]
```

### Step 6: Configure Health Checks

**HTTP Health Check** (recommended for web apps):
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1
```

**TCP Health Check** (for non-HTTP services):
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD nc -z localhost ${PORT:-5432} || exit 1
```

**Exec Health Check** (for custom checks):
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"
```

### Step 7: Handle Environment Variables

**Build-Time Variables** (baked into image):
```dockerfile
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
```

**Runtime Variables** (provided at `docker run`):
```dockerfile
# No ENV directive - passed via -e flag or --env-file
# docker run -e DATABASE_URL="postgresql://..." myapp
```

**Security**: NEVER include secrets in Dockerfile. Use runtime variables or Docker secrets.

### Step 8: Optimize Final Image Size

**Techniques**:
1. ✅ **Multi-stage builds** - exclude build tools from runtime
2. ✅ **Alpine base images** - minimal OS layer
3. ✅ **Clean package manager cache** - `rm -rf /var/lib/apt/lists/*`
4. ✅ **Combine RUN commands** - reduce layer count
5. ✅ **Use .dockerignore** - exclude node_modules, .git, tests

**Example .dockerignore**:
```
node_modules
.git
.env
.env.local
*.md
tests/
__pycache__
*.pyc
.next
.vscode
```

### Step 9: Add Metadata Labels

```dockerfile
LABEL maintainer="team@example.com"
LABEL description="FastAPI Backend for Todo Application"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/org/repo"
```

### Step 10: Configure Signal Handling

**Python (with tini)**:
```dockerfile
# Install tini for proper signal forwarding
RUN apt-get update && apt-get install -y tini && rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Node.js (built-in)**:
```dockerfile
# Node.js handles signals properly by default
CMD ["node", "server.js"]
```

---

## Language-Specific Patterns

### Python (FastAPI, Django, Flask)

**Pattern**: 2-stage build (builder + runtime)

**Builder Stage**:
- Install gcc, python3-dev (for compiling native extensions)
- Install dependencies with `pip install --prefix=/build/install`
- Copy only `/build/install` to runtime stage

**Runtime Stage**:
- Use `python:3.11-slim`
- Install only runtime dependencies (libpq5 for PostgreSQL)
- Copy dependencies from builder: `COPY --from=builder /build/install /usr/local`

**Full Pattern**: See `references/patterns/python-fastapi.dockerfile`

### Node.js (Next.js, Express, React)

**Pattern**: 3-stage build (dependencies + builder + runner)

**Dependencies Stage**:
- Copy only package.json and package-lock.json
- Run `npm ci` (or `npm install --legacy-peer-deps`)

**Builder Stage**:
- Copy node_modules from dependencies stage
- Copy source code
- Run `npm run build`

**Runner Stage**:
- Copy only production files (.next/standalone, .next/static)
- Use standalone output (Next.js specific)

**Full Pattern**: See `references/patterns/nextjs.dockerfile`

### Go (APIs, CLI tools)

**Pattern**: 2-stage build (scratch runtime for smallest size)

**Builder Stage**:
- Use `golang:1.21-alpine`
- Enable CGO_ENABLED=0 for static binary
- Run `go build -ldflags="-w -s"` (strip debug symbols)

**Runtime Stage**:
- Use `scratch` (0 bytes) or `alpine:3.19` (~5MB)
- Copy only compiled binary
- No package manager, no shell (ultra-minimal)

**Full Pattern**: See `references/patterns/go-api.dockerfile`

### Rust (APIs, CLI tools)

**Pattern**: Similar to Go (2-stage build with scratch runtime)

**Full Pattern**: See `references/patterns/rust-api.dockerfile`

---

## Validation

Before delivering Dockerfile:

### 1. Lint Dockerfile

```bash
# Install hadolint
docker run --rm -i hadolint/hadolint < Dockerfile

# Common issues:
# - DL3008: apt-get missing --no-install-recommends
# - DL3009: apt-get missing cache cleanup
# - DL3059: Multiple COPY commands (combine when possible)
```

### 2. Build Image

```bash
docker build -t myapp:test .

# Verify size
docker images myapp:test

# Target size ranges:
# Python: 200-400MB (with dependencies)
# Node.js: 150-300MB (with Next.js)
# Go: 10-50MB (static binary)
```

### 3. Test Runtime

```bash
# Run container
docker run --rm -p 8000:8000 myapp:test

# Verify health check
docker inspect --format='{{json .State.Health}}' <container-id>

# Check logs
docker logs <container-id>

# Verify non-root user
docker exec <container-id> whoami  # Should NOT be root
```

### 4. Security Scan

```bash
# Scan for vulnerabilities
docker scan myapp:test

# Or use Trivy
trivy image myapp:test
```

---

## Output Checklist

Verify generated Dockerfile includes:

### Structure
- [ ] Multi-stage build (builder + runtime)
- [ ] Minimal base image (-slim or -alpine)
- [ ] Proper stage naming (AS builder, AS runtime)

### Optimization
- [ ] Dependencies copied before source code (layer caching)
- [ ] Build artifacts only in final image (no build tools)
- [ ] Package manager cache cleaned (rm -rf /var/lib/apt/lists/*)
- [ ] .dockerignore file created

### Security
- [ ] Non-root user created (UID 1000 or 1001)
- [ ] Files owned by non-root user (--chown flag)
- [ ] USER directive before CMD
- [ ] No secrets in ENV directives

### Runtime
- [ ] EXPOSE directive with correct port
- [ ] HEALTHCHECK configured (interval, timeout, retries)
- [ ] CMD or ENTRYPOINT specified
- [ ] Environment variables documented

### Metadata
- [ ] LABEL directives (maintainer, description, version)
- [ ] Inline comments explaining non-obvious steps
- [ ] Build and run commands documented in comments

---

## Common Patterns

See `references/patterns/` for complete examples:

- `python-fastapi.dockerfile` - FastAPI REST API
- `nextjs.dockerfile` - Next.js frontend (App Router)
- `go-api.dockerfile` - Go REST API
- `rust-api.dockerfile` - Rust web service
- `django.dockerfile` - Django web application
- `express.dockerfile` - Express.js API

---

## Reference Files

| File | Purpose |
|------|---------|
| `references/base-images.md` | Recommended base images per language, size comparisons |
| `references/security.md` | Non-root users, read-only FS, minimal attack surface |
| `references/optimization.md` | Layer caching, .dockerignore, multi-stage best practices |
| `references/health-checks.md` | HTTP, TCP, exec health check patterns |
| `references/patterns/` | Complete Dockerfile examples for common frameworks |

---

## Example Usage

**User Request**: "Create a Dockerfile for my FastAPI backend with PostgreSQL"

**Skill Output**:
1. Read `backend/requirements.txt` to identify dependencies
2. Detect FastAPI framework (from requirements or source code)
3. Generate 2-stage Dockerfile:
   - Builder: Install gcc + python-dev, install deps to /build/install
   - Runtime: python:3.11-slim, copy deps, create non-root user
4. Add health check at `/health` endpoint
5. Expose port 8000
6. Create `.dockerignore` with __pycache__, .env, tests/

**Output Files**:
- `backend/Dockerfile` (production-ready)
- `backend/.dockerignore`
- Build command: `docker build -t backend:latest ./backend`
- Run command: `docker run -p 8000:8000 --env-file .env backend:latest`
