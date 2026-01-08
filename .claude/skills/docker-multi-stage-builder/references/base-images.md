# Base Images Reference

Recommended base images per language with size comparisons and use case guidance.

## Selection Criteria

When choosing base images, consider:

1. **Size** - Smaller images deploy faster and reduce storage costs
2. **Security** - Fewer packages = smaller attack surface
3. **Compatibility** - Alpine uses musl libc (may cause issues with some packages)
4. **Tooling** - Alpine minimal (no bash, no many utils), Debian/Ubuntu full-featured

## Python Base Images

### python:3.11-slim (Recommended)

**Base OS**: Debian 12 (Bookworm)
**Size**: ~120MB compressed, ~360MB uncompressed
**Package Manager**: apt-get
**Shell**: bash
**C Compiler**: Not included (install separately)

**Use When**:
- ✅ Production applications (default choice)
- ✅ Need C extensions (numpy, pandas, psycopg2)
- ✅ Need pip to compile packages
- ✅ Need bash for complex shell scripts

**Example**:
```dockerfile
FROM python:3.11-slim AS runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*
```

### python:3.11-alpine

**Base OS**: Alpine Linux 3.19
**Size**: ~50MB compressed, ~150MB uncompressed
**Package Manager**: apk
**Shell**: sh (not bash)
**C Compiler**: Not included (install separately)

**Use When**:
- ✅ Ultra-minimal image size required
- ✅ Pure Python code (no C extensions)
- ✅ Simple applications with few dependencies

**Limitations**:
- ❌ musl libc compatibility issues (cryptography, numpy may fail)
- ❌ Slower pip installs (must compile from source)
- ❌ Missing common utilities (bash, man, dpkg)

**Example**:
```dockerfile
FROM python:3.11-alpine AS runtime
RUN apk add --no-cache libpq
```

### python:3.11 (Full)

**Base OS**: Debian 12 (Bookworm)
**Size**: ~320MB compressed, ~1GB uncompressed
**Includes**: gcc, make, curl, wget, git, etc.

**Use When**:
- ❌ **Rarely recommended** - use only for builder stages
- Use `python:3.11-slim` for runtime instead

### Comparison Table

| Image | Compressed | Uncompressed | Build Tools | Common Use |
|-------|-----------|--------------|-------------|------------|
| `python:3.11` | 320MB | 1GB | ✅ Yes | Builder only |
| `python:3.11-slim` | 120MB | 360MB | ❌ No | Runtime (default) |
| `python:3.11-alpine` | 50MB | 150MB | ❌ No | Minimal runtime |

---

## Node.js Base Images

### node:20-alpine (Recommended)

**Base OS**: Alpine Linux 3.19
**Size**: ~40MB compressed, ~120MB uncompressed
**Package Manager**: apk
**Shell**: sh (not bash)
**Build Tools**: Not included

**Use When**:
- ✅ Production applications (default choice)
- ✅ Next.js, Express, React applications
- ✅ Pure JavaScript/TypeScript code

**Node.js Benefits Over Python**:
- Alpine works well (fewer native dependencies)
- npm/yarn compatible with musl libc

**Example**:
```dockerfile
FROM node:20-alpine AS runtime
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

### node:20-slim

**Base OS**: Debian 12 (Bookworm)
**Size**: ~80MB compressed, ~240MB uncompressed
**Package Manager**: apt-get
**Shell**: bash

**Use When**:
- ✅ Need bash for complex scripts
- ✅ Debugging (more utilities available)
- ❌ Generally prefer `-alpine` for Node.js

### node:20 (Full)

**Base OS**: Debian 12 (Bookworm)
**Size**: ~350MB compressed, ~1GB uncompressed

**Use When**:
- ❌ **Rarely recommended** - use only for builder stages

### Comparison Table

| Image | Compressed | Uncompressed | Package Manager | Common Use |
|-------|-----------|--------------|-----------------|------------|
| `node:20` | 350MB | 1GB | apt-get | Builder only |
| `node:20-slim` | 80MB | 240MB | apt-get | Runtime (alt) |
| `node:20-alpine` | 40MB | 120MB | apk | Runtime (default) |

---

## Go Base Images

### golang:1.21-alpine (Builder)

**Base OS**: Alpine Linux 3.19
**Size**: ~110MB compressed
**Package Manager**: apk
**C Compiler**: Not included (install with `apk add gcc musl-dev`)

**Use For**: Builder stage only

**Example**:
```dockerfile
FROM golang:1.21-alpine AS builder
RUN apk add --no-cache gcc musl-dev
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-w -s" -o app .
```

### alpine:3.19 (Runtime)

**Base OS**: Alpine Linux 3.19
**Size**: ~2.5MB compressed, ~7MB uncompressed
**Package Manager**: apk
**Use For**: Runtime stage (static Go binaries)

**Example**:
```dockerfile
FROM alpine:3.19 AS runtime
RUN apk add --no-cache ca-certificates
COPY --from=builder /build/app /app
CMD ["/app"]
```

### scratch (Minimal Runtime)

**Base OS**: None (empty image)
**Size**: 0 bytes
**Package Manager**: None
**Use For**: Ultra-minimal runtime (static binaries only)

**Limitations**:
- ❌ No shell (cannot docker exec)
- ❌ No package manager
- ❌ No debugging tools
- ❌ No TLS certificates (must copy from builder)

**Example**:
```dockerfile
FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /build/app /app
ENTRYPOINT ["/app"]
```

### Comparison Table

| Image | Size | Shell | TLS Certs | Use Case |
|-------|------|-------|-----------|----------|
| `scratch` | 0 MB | ❌ No | ❌ No | Ultra-minimal (advanced) |
| `alpine:3.19` | 7 MB | ✅ Yes | ✅ Yes | Minimal (recommended) |
| `golang:1.21-alpine` | 110 MB | ✅ Yes | ✅ Yes | Builder only |

---

## Rust Base Images

### rust:1.75-alpine (Builder)

**Base OS**: Alpine Linux 3.19
**Size**: ~400MB compressed
**Package Manager**: apk
**Use For**: Builder stage only

**Example**:
```dockerfile
FROM rust:1.75-alpine AS builder
RUN apk add --no-cache musl-dev
WORKDIR /build
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
COPY src ./src
RUN cargo build --release
```

### alpine:3.19 (Runtime)

Same as Go - use Alpine or scratch for runtime.

**Example**:
```dockerfile
FROM alpine:3.19 AS runtime
COPY --from=builder /build/target/release/myapp /app
CMD ["/app"]
```

---

## Java Base Images

### eclipse-temurin:21-jre-alpine (Recommended)

**Base OS**: Alpine Linux 3.19
**Size**: ~180MB compressed
**JDK/JRE**: JRE only (smaller than JDK)
**Use For**: Runtime stage

**Why Temurin?**
- OpenJDK distribution by Eclipse Foundation
- Well-maintained, regular security updates
- Replaces deprecated AdoptOpenJDK

**Example**:
```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY build.gradle settings.gradle ./
COPY src ./src
RUN ./gradlew build

FROM eclipse-temurin:21-jre-alpine AS runtime
COPY --from=builder /build/build/libs/app.jar /app.jar
CMD ["java", "-jar", "/app.jar"]
```

### eclipse-temurin:21-jdk-alpine (Builder)

**Size**: ~320MB compressed
**JDK/JRE**: Full JDK (includes javac)
**Use For**: Builder stage only

### Comparison Table

| Image | Size | Contents | Use Case |
|-------|------|----------|----------|
| `eclipse-temurin:21-jdk` | 400 MB | Full JDK + tools | Builder only |
| `eclipse-temurin:21-jdk-alpine` | 320 MB | JDK (Alpine) | Builder (preferred) |
| `eclipse-temurin:21-jre-alpine` | 180 MB | JRE only | Runtime (recommended) |

---

## Database Images (For Reference)

### PostgreSQL

**Recommended**: `postgres:15-alpine`
**Size**: ~80MB compressed, ~240MB uncompressed

### Redis

**Recommended**: `redis:7-alpine`
**Size**: ~10MB compressed, ~30MB uncompressed

### MongoDB

**Recommended**: `mongo:7.0` (no Alpine variant)
**Size**: ~200MB compressed, ~700MB uncompressed

---

## Decision Matrix

**Choose `-alpine` when**:
- ✅ Application has minimal native dependencies
- ✅ Image size is critical (bandwidth, storage costs)
- ✅ Application is Node.js, Go, Rust (works well with musl libc)

**Choose `-slim` when**:
- ✅ Application has C extensions (Python: numpy, pandas, cryptography)
- ✅ Need bash for complex scripts
- ✅ Compatibility more important than size
- ✅ Application is Python with scientific libraries

**Choose full image (no suffix) when**:
- ✅ Builder stage needs full toolchain
- ❌ Never for runtime stage (always use -slim or -alpine)

---

## Size Optimization Examples

### Python: Full → Slim → Alpine

```dockerfile
# ❌ Full (1GB) - Too large
FROM python:3.11
RUN pip install fastapi uvicorn
COPY . .
CMD ["uvicorn", "main:app"]

# ✅ Slim (360MB) - Recommended for Python
FROM python:3.11-slim
RUN apt-get update && apt-get install -y libpq5 && rm -rf /var/lib/apt/lists/*
RUN pip install fastapi uvicorn
COPY . .
CMD ["uvicorn", "main:app"]

# ⚠️ Alpine (150MB) - Only if no C extensions
FROM python:3.11-alpine
RUN apk add --no-cache libpq
RUN pip install fastapi uvicorn
COPY . .
CMD ["uvicorn", "main:app"]
```

### Node.js: Full → Slim → Alpine

```dockerfile
# ❌ Full (1GB) - Too large
FROM node:20
COPY . .
RUN npm install
CMD ["node", "server.js"]

# ✅ Alpine (120MB) - Recommended for Node.js
FROM node:20-alpine
COPY . .
RUN npm install --production
CMD ["node", "server.js"]

# ✅ Slim (240MB) - Alternative if need bash
FROM node:20-slim
COPY . .
RUN npm install --production
CMD ["node", "server.js"]
```

### Go: Builder + Scratch

```dockerfile
# Builder: 110MB (golang:1.21-alpine)
FROM golang:1.21-alpine AS builder
RUN go build -ldflags="-w -s" -o app .

# Runtime: 0MB (scratch) + ~10MB binary = 10MB total
FROM scratch
COPY --from=builder /build/app /app
ENTRYPOINT ["/app"]
```

---

## Official Image Documentation

- **Python**: https://hub.docker.com/_/python
- **Node.js**: https://hub.docker.com/_/node
- **Go**: https://hub.docker.com/_/golang
- **Rust**: https://hub.docker.com/_/rust
- **Java (Temurin)**: https://hub.docker.com/_/eclipse-temurin
- **Alpine Linux**: https://hub.docker.com/_/alpine
