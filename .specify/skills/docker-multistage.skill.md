# Skill: Multi-Stage Dockerfile Generator

**Purpose:** Generate production-ready multi-stage Dockerfiles following Phase IV constitution security and optimization requirements.

**When to Use:**
- Creating new containerized services
- Optimizing existing Dockerfiles
- Implementing security best practices (non-root user, minimal layers)

**Phase IV Constitution Reference:** Section II (Container-First Architecture)

---

## Inputs

1. **Base Technology:** Python, Node.js, Go, Rust, etc.
2. **Application Type:** API server, web frontend, background worker, etc.
3. **Target Image Size:** <500MB (backend), <300MB (frontend), <100MB (minimal)
4. **Package Manager:** pip/poetry (Python), npm/yarn/pnpm (Node), cargo (Rust), etc.

---

## Pattern: Python FastAPI Multi-Stage Dockerfile

```dockerfile
# ===== Stage 1: Dependencies =====
FROM python:3.13-slim AS deps

# Install build tools if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install poetry (if using poetry)
RUN pip install poetry==1.8.0

WORKDIR /app

# Copy dependency files only (cache layer)
COPY pyproject.toml poetry.lock* ./

# Install dependencies (no dev packages)
RUN poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi

# ===== Stage 2: Production Runtime =====
FROM python:3.13-slim AS runtime

# Create non-root user (SECURITY REQUIREMENT)
RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

# Copy installed dependencies from deps stage
COPY --from=deps /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application source
COPY --chown=appuser:appuser src/ ./src/

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check (MONITORING REQUIREMENT)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run application
CMD ["python", "-m", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Estimated Size:** 420MB (python:3.13-slim 130MB + dependencies 250MB + app 40MB)

---

## Pattern: Node.js Next.js Standalone Dockerfile

```dockerfile
# ===== Stage 1: Dependencies =====
FROM node:20-alpine AS deps

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm ci --only=production --legacy-peer-deps

# ===== Stage 2: Builder =====
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Build Next.js application (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ===== Stage 3: Production Runtime =====
FROM node:20-alpine AS runtime

# Create non-root user (SECURITY REQUIREMENT)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy standalone output (minimal production server)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check (MONITORING REQUIREMENT)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run Next.js production server
CMD ["node", "server.js"]
```

**Estimated Size:** 280MB (node:20-alpine 50MB + Next.js standalone 200MB + static assets 30MB)

**Key Requirement:** Enable standalone output in `next.config.js`:
```javascript
module.exports = {
  output: 'standalone',
}
```

---

## Optimization Checklist

- [ ] Multi-stage build (separate deps, build, runtime)
- [ ] Minimal base image (slim/alpine variants)
- [ ] Dependency layer caching (COPY deps files before source)
- [ ] Non-root user (useradd/adduser with specific UID)
- [ ] HEALTHCHECK instruction (for container-level monitoring)
- [ ] .dockerignore file (exclude .git, tests, docs)
- [ ] Security scanning (docker scan or trivy)
- [ ] Target size validation (<500MB backend, <300MB frontend)

---

## Security Requirements (Phase IV Constitution)

1. **Non-Root User:**
   - Backend: UID 1000 (`useradd appuser`)
   - Frontend: UID 1001 (`adduser nextjs`)
   - Run as: `USER appuser` or `USER nextjs`

2. **No Hardcoded Secrets:**
   - Use environment variables
   - Inject via Kubernetes Secrets at runtime

3. **Minimal Attack Surface:**
   - Use slim/alpine base images
   - Remove build tools in final stage
   - No unnecessary packages

4. **Health Checks:**
   - HEALTHCHECK instruction in Dockerfile
   - Kubernetes liveness/readiness probes

---

## Common Pitfalls to Avoid

❌ **DON'T:**
- Use full base images (python:3.13 instead of python:3.13-slim)
- Copy entire context (COPY . .) before dependencies
- Run as root user (security vulnerability)
- Forget .dockerignore (bloats build context)
- Skip HEALTHCHECK (monitoring blind spot)

✅ **DO:**
- Use multi-stage builds (keep final stage minimal)
- Cache dependency layers (COPY package.json before COPY .)
- Create non-root user with specific UID
- Include .dockerignore (exclude .git, node_modules, tests)
- Add HEALTHCHECK instruction

---

## Validation Commands

```bash
# Build image
docker build -t myapp:latest -f docker/myapp.Dockerfile ./myapp

# Check image size
docker images myapp:latest

# Inspect layers
docker history myapp:latest

# Security scan
docker scan myapp:latest

# Run container
docker run -p 8000:8000 myapp:latest

# Test health check
docker inspect --format='{{json .State.Health}}' <container-id>
```

---

## References

- Phase IV Constitution: `.specify/memory/phase-4-constitution.md` (Section II)
- Research: `specs/003-k8s-deployment/research.md` (Section 4)
- Example Dockerfiles: `docker/` directory

---

**Skill Version:** 1.0.0 | **Phase:** IV | **Last Updated:** 2026-01-03
