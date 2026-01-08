# ADR 001: Multi-Stage Dockerfiles with python:3.13-slim and node:20-alpine Base Images

**Date**: 2026-01-03
**Status**: Accepted
**Context**: Phase IV Kubernetes Deployment
**Decision Makers**: Claude Code + User

---

## Context

For Phase IV Kubernetes deployment, we need to containerize 3 services:
1. Backend (Python 3.13 FastAPI + MCP server)
2. Frontend-Web (Next.js 16)
3. Frontend-Chatbot (Next.js 14)

Phase IV constitution mandates:
- Backend image size <500MB
- Frontend image sizes <300MB each
- Multi-stage builds for optimization
- Non-root user security
- Docker AI (Gordon) for Dockerfile generation with fallback to Claude Code

---

## Decision

**We will use multi-stage Dockerfiles with the following base images:**

### Backend
- **Base Image**: `python:3.13-slim` (Debian-based, ~130MB)
- **Pattern**: 2-stage build (deps → runtime)
- **Target Size**: <450MB

### Frontend-Web & Frontend-Chatbot
- **Base Image**: `node:20-alpine` (Alpine Linux, ~50MB)
- **Pattern**: 3-stage build (deps → builder → runtime)
- **Output Mode**: Next.js standalone
- **Target Size**: <280MB each

---

## Options Considered

### Option 1: Python Alpine (python:3.13-alpine)
- **Size**: ~50MB base image
- **Pros**: Smallest base image, fewer CVEs (Alpine-based)
- **Cons**:
  - Slower builds (must compile wheels from source, no pre-compiled binaries)
  - musl libc compatibility issues with packages (sqlmodel, pydantic, psycopg2)
  - Build time 3-5x longer than slim
- **Decision**: **REJECTED** - Compatibility and build time issues outweigh size benefit

### Option 2: Python Slim (python:3.13-slim) - **SELECTED**
- **Size**: ~130MB base image
- **Pros**:
  - Excellent compatibility (glibc, standard C libraries)
  - Fast builds (pre-compiled wheels available)
  - sqlmodel, pydantic, psycopg2 work without compilation
  - Target <500MB achievable with multi-stage build
- **Cons**: Larger than Alpine (~80MB difference)
- **Decision**: **ACCEPTED** - Best balance of compatibility, build speed, and size

### Option 3: Full Python Image (python:3.13)
- **Size**: ~1GB base image
- **Pros**: All build tools included
- **Cons**: Far exceeds 500MB target, includes unnecessary tools
- **Decision**: **REJECTED** - Too large

### Option 4: Next.js Full node_modules (node:20)
- **Size**: ~1GB+ final image (includes all dependencies)
- **Pros**: Simple Dockerfile (no multi-stage complexity)
- **Cons**: Violates <300MB target
- **Decision**: **REJECTED** - Exceeds size constraint

### Option 5: Next.js Standalone + Alpine (node:20-alpine) - **SELECTED**
- **Size**: ~280MB final image
- **Pros**:
  - Next.js standalone output mode generates minimal production server
  - Only includes production dependencies and built assets
  - Alpine base keeps overhead minimal
  - Meets <300MB target with 20MB margin
- **Cons**: Requires Next.js config change (`output: 'standalone'`)
- **Decision**: **ACCEPTED** - Meets size target, production-ready

---

## Rationale

### Technical Justification

1. **python:3.13-slim** chosen because:
   - SQLModel requires compiled C extensions (psycopg2-binary)
   - Alpine's musl libc causes compatibility issues with these extensions
   - Slim provides glibc compatibility without full Debian overhead
   - Build time reduction (2-3 minutes vs 8-10 minutes on Alpine)
   - Target <500MB achievable: 130MB base + 250MB deps + 40MB app = 420MB ✅

2. **node:20-alpine** chosen because:
   - Next.js standalone output eliminates dev dependencies (~700MB savings)
   - Alpine minimal overhead (~50MB) vs Debian slim (~150MB)
   - No C extension compilation needed for Node.js (unlike Python)
   - Target <300MB achievable: 50MB base + 200MB Next.js standalone + 30MB static = 280MB ✅

### Security Justification

- **Non-root user**: Both slim and alpine support `useradd` / `adduser` for non-root execution
- **Layer caching**: Multi-stage builds optimize layer caching (dependencies cached separately from app code)
- **Minimal attack surface**: Both slim and alpine exclude unnecessary tools (compilers, shells)

### Performance Justification

- **Build Speed**: python:3.13-slim significantly faster than alpine for Python projects
- **Runtime Performance**: No difference (both run the same Python/Node.js runtime)
- **Image Pull Speed**: Smaller images (280MB vs 1GB) pull 3-4x faster on deployment

---

## Consequences

### Positive
- ✅ Meets Phase IV constitution size targets (<500MB backend, <300MB frontends)
- ✅ Fast builds (developer velocity)
- ✅ Excellent compatibility (no package compilation issues)
- ✅ Security compliant (non-root user, minimal attack surface)
- ✅ Production-ready (proven base images, stable releases)

### Negative
- ⚠️ python:3.13-slim ~80MB larger than alpine (acceptable trade-off for compatibility)
- ⚠️ Next.js standalone mode requires config change (one-time effort, well-documented)

### Neutral
- Docker layer caching strategy requires careful Dockerfile ordering
- Multi-stage builds add complexity but standard practice

---

## Implementation

### Backend Dockerfile Pattern
```dockerfile
FROM python:3.13-slim AS deps
RUN pip install poetry
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-dev

FROM python:3.13-slim AS runtime
RUN useradd -m appuser
COPY --from=deps /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY src/ ./src/
USER appuser
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0"]
```

### Frontend Dockerfile Pattern
```dockerfile
FROM node:20-alpine AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/.next/standalone ./
USER nextjs
CMD ["node", "server.js"]
```

---

## Alternatives for Future Consideration

If size becomes critical in Phase V (cloud deployment costs):
- **Distroless images**: Google's distroless Python/Node images (~40-60MB)
- **Multi-architecture builds**: ARM64 images for cloud ARM instances (cost savings)
- **Layer compression**: Enable Docker BuildKit experimental compression

---

## References

- Phase IV Constitution Section II: Container-First Architecture
- Research: `specs/003-k8s-deployment/research.md` Section 4
- Next.js Standalone Docs: https://nextjs.org/docs/advanced-features/output-file-tracing
- Docker Best Practices: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/

---

**Decision**: ACCEPTED | **Reviewed by**: User | **Implemented in**: Phase IV Task Generation
