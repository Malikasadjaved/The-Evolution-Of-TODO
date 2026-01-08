# Docker Image Optimization

Techniques for reducing image size and improving build performance.

## Multi-Stage Builds

### Principle: Separate Build-Time and Runtime Dependencies

**Problem**: Build tools (gcc, npm, cargo) add 100s of MB to final image but aren't needed at runtime.

**Solution**: Use multi-stage builds to exclude build tools from final image.

### Example: Python (FastAPI)

```dockerfile
# ❌ Single-stage (600MB) - Includes gcc, python-dev
FROM python:3.11-slim
RUN apt-get update && apt-get install -y gcc python3-dev libpq-dev
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app"]

# ✅ Multi-stage (350MB) - Excludes build tools
FROM python:3.11-slim AS builder
RUN apt-get update && apt-get install -y gcc python3-dev libpq-dev
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

FROM python:3.11-slim
RUN apt-get update && apt-get install -y libpq5 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /install /usr/local
COPY . .
CMD ["uvicorn", "main:app"]
```

**Size Reduction**: 600MB → 350MB (42% smaller)

### Example: Node.js (Next.js)

```dockerfile
# ❌ Single-stage (450MB) - Includes node_modules with dev dependencies
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]

# ✅ Multi-stage (208MB) - Standalone output only
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["node", "server.js"]
```

**Size Reduction**: 450MB → 208MB (54% smaller)

### Example: Go (Static Binary)

```dockerfile
# ❌ Single-stage (350MB) - Includes Go toolchain
FROM golang:1.21-alpine
WORKDIR /app
COPY . .
RUN go build -o app .
CMD ["./app"]

# ✅ Multi-stage (15MB) - Binary only
FROM golang:1.21-alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-w -s" -o app .

FROM alpine:3.19
COPY --from=builder /build/app /app
CMD ["/app"]
```

**Size Reduction**: 350MB → 15MB (96% smaller!)

---

## Layer Caching

### Principle: Docker Caches Unchanged Layers

**How It Works**:
1. Docker checks if instruction and context have changed
2. If unchanged, reuse cached layer (instant)
3. If changed, rebuild this layer and all subsequent layers

### Optimal Layer Order (Most to Least Frequently Changed)

1. **Install system packages** (rarely change)
2. **Copy dependency manifest** (package.json, requirements.txt)
3. **Install dependencies** (only rebuild when manifest changes)
4. **Copy source code** (changes frequently)
5. **Build application**

### Example: Python

```dockerfile
# ❌ BAD - Invalidates cache on any code change
COPY . .
RUN pip install -r requirements.txt

# ✅ GOOD - Cache dependencies separately
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

**Impact**:
- Bad: Every code change = reinstall all dependencies (2-5 minutes)
- Good: Code changes skip dependency install (5 seconds)

### Example: Node.js

```dockerfile
# ❌ BAD - Invalidates cache on any code change
COPY . .
RUN npm install

# ✅ GOOD - Cache node_modules separately
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
```

### Example: Go (Dependency Pre-Fetch)

```dockerfile
# ❌ BAD - Redownloads modules on any code change
COPY . .
RUN go build .

# ✅ GOOD - Cache modules separately
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build .
```

---

## .dockerignore

### Principle: Exclude Unnecessary Files from Build Context

**Build Context**: All files in directory sent to Docker daemon before build.

**Problem**: Large build context (node_modules, .git) slows down `docker build`.

**Solution**: Use `.dockerignore` to exclude files.

### Example .dockerignore (Node.js)

```
# Dependencies (installed during build)
node_modules
npm-debug.log
yarn-error.log

# Git
.git
.gitignore
.gitattributes

# Build output (generated during build)
.next
out
dist
build

# Environment files (use --env-file at runtime)
.env
.env.local
.env.*.local

# Tests
__tests__
**/*.test.ts
**/*.test.tsx
**/*.spec.ts

# Documentation
*.md
README.md
CHANGELOG.md
docs/

# IDE
.vscode
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

### Example .dockerignore (Python)

```
# Cache
__pycache__
*.pyc
*.pyo
*.pyd
.Python
*.so

# Virtual environments
venv/
env/
ENV/

# Git
.git
.gitignore

# Build output
dist/
build/
*.egg-info

# Environment files
.env
.env.local

# Tests
tests/
test_*.py
*_test.py
pytest_cache/

# Documentation
*.md
docs/

# IDE
.vscode
.idea
*.swp
```

**Impact**:
- Without .dockerignore: Build context = 500MB (includes node_modules)
- With .dockerignore: Build context = 5MB (source code only)
- **Build time**: 30s → 3s (10x faster)

---

## Combining RUN Commands

### Principle: Each RUN Creates a New Layer

**Problem**: Multiple RUN commands create multiple layers, increasing image size.

```dockerfile
# ❌ BAD - 3 layers, keeps intermediate cache
RUN apt-get update           # Layer 1: 40MB
RUN apt-get install -y curl  # Layer 2: 5MB
RUN rm -rf /var/lib/apt/lists/*  # Layer 3: 0MB (but Layer 1 still in image)
# Total: 45MB
```

**Solution**: Combine commands with `&&` to create single layer.

```dockerfile
# ✅ GOOD - Single layer, cache removed
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*
# Total: 5MB
```

**Why This Works**:
- Docker commits each RUN as a new layer
- Deleting files in later RUN doesn't remove them from earlier layers
- Combining commands ensures deletions happen in same layer

### Multi-Line Commands

```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        wget \
        git \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/*
```

**Formatting Tips**:
- Use `\` for line continuation
- Indent for readability
- Alphabetize packages for easier diffs

---

## Minimizing Dependencies

### Install Only What's Needed

```dockerfile
# ❌ BAD - Installs 50+ recommended packages
RUN apt-get install -y python3

# ✅ GOOD - Installs only python3
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 && \
    rm -rf /var/lib/apt/lists/*
```

### Use Specific Package Versions (Optional)

```dockerfile
# Pin versions for reproducibility
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3=3.11.2-1 \
        libpq5=15.3-0 && \
    rm -rf /var/lib/apt/lists/*
```

---

## BuildKit Optimizations

### Enable BuildKit

BuildKit is the next-generation Docker build backend with:
- Parallel builds
- Improved caching
- Build secrets (mount secrets without baking into image)

**Enable**:
```bash
# One-time
export DOCKER_BUILDKIT=1

# Per-build
DOCKER_BUILDKIT=1 docker build -t myapp .
```

### Mount Secrets (BuildKit)

```dockerfile
# Old way (INSECURE - secret in image history)
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc && \
    npm install && \
    rm ~/.npmrc

# BuildKit way (SECURE - secret not in image)
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm install
```

**Build Command**:
```bash
docker build --secret id=npmrc,src=$HOME/.npmrc -t myapp .
```

### Cache Mounts (BuildKit)

```dockerfile
# Cache pip downloads across builds
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Cache npm downloads across builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

**Impact**: Subsequent builds reuse cached downloads (2x-5x faster).

---

## Image Squashing (Advanced)

### Principle: Merge All Layers into Single Layer

**Use Case**: Image has many layers (>50), want to reduce layer overhead.

```bash
# Build and squash
docker build --squash -t myapp .
```

**Tradeoffs**:
- ✅ **Pro**: Smaller image (removes intermediate layers)
- ❌ **Con**: Loses layer caching (slower subsequent builds)
- ❌ **Con**: Cannot share layers with other images

**Recommendation**: Only use for final production images, not during development.

---

## Order of Layers (Summary)

**Optimal Dockerfile Structure**:

```dockerfile
# 1. ARG/FROM (base image)
FROM python:3.11-slim

# 2. Install system packages (rarely change)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# 3. Create non-root user (rarely changes)
RUN groupadd --system --gid 1000 app && \
    useradd --system --no-create-home --uid 1000 --gid app app

# 4. Copy dependency manifest (changes less frequently than source code)
COPY requirements.txt .

# 5. Install dependencies (rebuild only when manifest changes)
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy source code (changes most frequently)
COPY --chown=app:app . .

# 7. Switch to non-root user
USER app

# 8. Runtime config (EXPOSE, HEALTHCHECK, CMD)
EXPOSE 8000
HEALTHCHECK CMD curl -f http://localhost:8000/health || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

---

## Optimization Checklist

Before finalizing Dockerfile:

### Size Optimization
- [ ] Multi-stage build used (builder + runtime)
- [ ] Minimal base image (-slim or -alpine)
- [ ] Package manager cache removed (rm -rf /var/lib/apt/lists/*)
- [ ] Unnecessary packages not installed (--no-install-recommends)
- [ ] .dockerignore created (excludes node_modules, .git, tests)

### Build Performance
- [ ] Dependencies copied before source code (layer caching)
- [ ] Dependency manifest copied separately (package.json, requirements.txt)
- [ ] RUN commands combined (single layer for cleanup)
- [ ] BuildKit enabled (DOCKER_BUILDKIT=1)
- [ ] Cache mounts used for package downloads (BuildKit)

### Runtime Optimization
- [ ] EXPOSE directive with correct port
- [ ] HEALTHCHECK configured
- [ ] CMD or ENTRYPOINT specified
- [ ] Logs sent to stdout/stderr (not files)

---

## Size Reduction Examples

### Before and After (Python)

| Optimization | Size | Savings |
|--------------|------|---------|
| Base (python:3.11) | 1000 MB | - |
| Use -slim | 360 MB | 64% |
| Multi-stage build | 320 MB | 68% |
| Remove apt cache | 280 MB | 72% |
| .dockerignore (tests) | 260 MB | 74% |

### Before and After (Node.js)

| Optimization | Size | Savings |
|--------------|------|---------|
| Base (node:20) | 1000 MB | - |
| Use -alpine | 450 MB | 55% |
| Multi-stage build | 250 MB | 75% |
| Standalone output | 180 MB | 82% |
| .dockerignore (node_modules) | 150 MB | 85% |

### Before and After (Go)

| Optimization | Size | Savings |
|--------------|------|---------|
| Base (golang:1.21) | 800 MB | - |
| Multi-stage (alpine runtime) | 20 MB | 97.5% |
| Multi-stage (scratch runtime) | 10 MB | 98.75% |

---

## Additional Resources

- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **Dockerfile Reference**: https://docs.docker.com/engine/reference/builder/
- **BuildKit Documentation**: https://github.com/moby/buildkit
- **Docker Layer Caching**: https://docs.docker.com/build/cache/
