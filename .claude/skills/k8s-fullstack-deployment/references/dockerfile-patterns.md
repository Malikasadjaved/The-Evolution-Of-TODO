# Dockerfile Patterns for Kubernetes Deployment

Complete Dockerfile patterns for different frameworks with Kubernetes-specific optimizations.

---

## Next.js Frontend (Production-Ready)

### Problem Solved

Next.js requires `NEXT_PUBLIC_*` environment variables at **build time** (during `npm run build`), not just runtime. Without proper ARG/ENV declarations, builds fail with:

```
❌ Environment validation failed:
- NEXT_PUBLIC_API_URL: must be a valid URL
- NEXT_PUBLIC_BETTER_AUTH_SECRET: Required
```

### Solution: Multi-Stage Dockerfile with Build-Time ENV

```dockerfile
# =============================================================================
# Multi-Stage Dockerfile for Next.js Frontend (Production-Ready)
# =============================================================================

# =============================================================================
# Stage 1: Dependencies - Install all dependencies
# =============================================================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files for layer caching
COPY package.json package-lock.json* ./

# Install dependencies
# --legacy-peer-deps: Allow React 19 with libraries that specify React 18 peer deps
RUN npm install --legacy-peer-deps

# =============================================================================
# Stage 2: Builder - Build Next.js application
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code
COPY . .

# ✅ CRITICAL FIX: Build arguments (can be overridden with --build-arg)
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_BETTER_AUTH_SECRET=default-secret-change-me
ARG NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth

# ✅ CRITICAL FIX: Convert ARG to ENV (make available to build process)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_BETTER_AUTH_SECRET=${NEXT_PUBLIC_BETTER_AUTH_SECRET}
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL}

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# ✅ Build Next.js application (now has access to all env vars)
# This creates optimized production build in .next/ directory
RUN npm run build

# =============================================================================
# Stage 3: Runner - Minimal production image
# =============================================================================
FROM node:20-alpine AS runner

# Metadata labels
LABEL maintainer="your-email@example.com"
LABEL description="Next.js Frontend for Kubernetes Deployment"

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
# --system: Create a system user
# --uid 1001: Explicit UID for consistency
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets (if any)
COPY --from=builder /app/public ./public

# Copy Next.js build output
# Set correct ownership for non-root user
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port (configurable via PORT environment variable)
# Default: 3000
EXPOSE 3000

# Environment variables (can be overridden at runtime)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check (ensures container is healthy)
# --interval=30s: Check every 30 seconds
# --timeout=10s: Timeout after 10 seconds
# --start-period=60s: Grace period for app startup
# --retries=3: Mark unhealthy after 3 failed checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3000}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Default command: Start Next.js server
CMD ["node", "server.js"]
```

### Build Command

```bash
# Build with default args
docker build -t app-frontend:latest .

# Build with custom args
docker build -t app-frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_SECRET=your-secret-here \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth \
  .
```

### Required next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // ← REQUIRED for Docker deployment
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

---

## FastAPI Backend (Production-Ready)

```dockerfile
# =============================================================================
# Multi-Stage Dockerfile for FastAPI Backend (Production-Ready)
# =============================================================================

# =============================================================================
# Stage 1: Builder - Install dependencies
# =============================================================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# =============================================================================
# Stage 2: Runner - Minimal production image
# =============================================================================
FROM python:3.11-slim AS runner

LABEL maintainer="your-email@example.com"
LABEL description="FastAPI Backend for Kubernetes Deployment"

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --uid 1001 appuser

# Copy Python packages from builder
COPY --from=builder /root/.local /home/appuser/.local

# Copy application code
COPY src/ ./src/

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Add local packages to PATH
ENV PATH=/home/appuser/.local/bin:$PATH

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()"

# Default command: Start Uvicorn server
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build Command

```bash
docker build -t app-backend:latest .
```

---

## Express.js Backend

```dockerfile
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --production

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressuser

COPY --from=dependencies --chown=expressuser:nodejs /app/node_modules ./node_modules
COPY --chown=expressuser:nodejs . .

USER expressuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/server.js"]
```

---

## React SPA (Vite)

```dockerfile
# =============================================================================
# Multi-Stage Dockerfile for React SPA (Vite)
# =============================================================================

FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Use nginx to serve static files
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (if needed)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

---

## Common Patterns

### 1. Build-Time vs Runtime Environment Variables

| Framework | Build-Time Pattern | Example |
|-----------|-------------------|---------|
| **Next.js** | `NEXT_PUBLIC_*` | `NEXT_PUBLIC_API_URL` |
| **Vite** | `VITE_*` | `VITE_API_URL` |
| **Create React App** | `REACT_APP_*` | `REACT_APP_API_URL` |

**Dockerfile Pattern:**
```dockerfile
# Declare ARG before RUN build command
ARG NEXT_PUBLIC_API_URL=default-value
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build  # Now has access to env var
```

### 2. Health Check Patterns

**HTTP Endpoint:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

**TCP Port:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD nc -z localhost 8000 || exit 1
```

**Node.js (no external tools):**
```dockerfile
HEALTHCHECK CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

### 3. Non-Root User Pattern

```dockerfile
# Alpine-based
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

# Debian-based
RUN useradd --create-home --uid 1001 appuser

# Set ownership
COPY --chown=appuser:appgroup . .

# Switch user
USER appuser
```

### 4. Layer Caching Optimization

```dockerfile
# ✅ Good: Copy dependency files first
COPY package.json package-lock.json ./
RUN npm install

# Then copy source code (changes more often)
COPY . .

# ❌ Bad: Copy everything at once
COPY . .
RUN npm install  # Reinstalls on every source code change
```

---

## Troubleshooting Dockerfile Issues

### Issue: "NEXT_PUBLIC_* must be a valid URL"

**Cause**: Environment variables not available during build.

**Fix**: Add ARG/ENV declarations before `RUN npm run build`:
```dockerfile
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build
```

### Issue: "Module not found: Can't resolve 'X'"

**Cause**: Dependencies not installed or wrong stage.

**Fix**: Ensure dependencies copied from previous stage:
```dockerfile
COPY --from=dependencies /app/node_modules ./node_modules
```

### Issue: Build succeeds but runtime fails

**Cause**: Missing runtime dependencies.

**Fix**: Install runtime deps in runner stage:
```dockerfile
RUN apt-get update && apt-get install -y \
    postgresql-client \  # Example runtime dependency
    && rm -rf /var/lib/apt/lists/*
```

### Issue: "Permission denied"

**Cause**: Files owned by root, app runs as non-root user.

**Fix**: Set correct ownership when copying:
```dockerfile
COPY --chown=appuser:appgroup . .
```

### Issue: Health check failing

**Cause**: Health check command requires tools not in image.

**Fix**: Use built-in language features:
```dockerfile
# ✅ Good: Uses Node.js built-in http module
CMD node -e "require('http').get('http://localhost:8000/health', ...)"

# ❌ Bad: Requires curl installation
CMD curl -f http://localhost:8000/health
```

---

## Best Practices Checklist

- [ ] Multi-stage build (separate builder and runner)
- [ ] Minimal base image (alpine preferred)
- [ ] Non-root user (uid 1001 recommended)
- [ ] Health check defined
- [ ] Layer caching optimized (dependencies before source)
- [ ] Build-time env vars declared as ARG+ENV
- [ ] Metadata labels (maintainer, description)
- [ ] .dockerignore file exists
- [ ] No secrets in image (use Kubernetes secrets)
- [ ] Production dependencies only in runner stage
