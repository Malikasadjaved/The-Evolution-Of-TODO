# Docker Security Best Practices

Security hardening for containerized applications.

## Non-Root Users

### Why Run as Non-Root?

**Risk of Running as Root**:
- Container breakout exploits grant root access to host
- Malware can install system-wide packages
- Compliance violations (PCI DSS, SOC 2 require least privilege)

**Best Practice**: Always run containers as non-root users.

### Creating Non-Root Users

#### Python / Generic

```dockerfile
# Create system user with explicit UID
RUN groupadd --system --gid 1000 app && \
    useradd --system --no-create-home --uid 1000 --gid app app

# Set ownership of application files
COPY --chown=app:app . /app

# Switch to non-root user
USER app
```

**Flags Explained**:
- `--system`: Create a system user (no password, no shell)
- `--no-create-home`: Don't create /home/app directory (saves space)
- `--uid 1000`: Explicit UID for consistency across environments
- `--gid app`: Primary group is 'app'

#### Node.js / Alpine

```dockerfile
# Create non-root user (Alpine syntax)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next ./

# Switch to non-root user
USER nextjs
```

#### Verify Non-Root Execution

```bash
# Run container and check user
docker run --rm myapp whoami
# Should output: app (not root)

# Check process UID
docker exec <container-id> ps aux
# Should show UID 1000, not UID 0
```

---

## Minimal Attack Surface

### Principle: Fewer Packages = Fewer Vulnerabilities

**Use minimal base images**:
- ✅ `python:3.11-slim` (120MB) vs ❌ `python:3.11` (1GB)
- ✅ `node:20-alpine` (40MB) vs ❌ `node:20` (350MB)
- ✅ `alpine:3.19` (7MB) vs ❌ `ubuntu:22.04` (80MB)

### Remove Package Manager Cache

#### Debian / Ubuntu (apt-get)

```dockerfile
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*
```

**Flags Explained**:
- `--no-install-recommends`: Skip suggested packages (smaller install)
- `rm -rf /var/lib/apt/lists/*`: Delete package cache (saves ~40MB)

#### Alpine (apk)

```dockerfile
RUN apk add --no-cache libpq
```

**Flags Explained**:
- `--no-cache`: Don't write package index cache to disk

### Combine RUN Commands

```dockerfile
# ❌ BAD - Creates 3 layers, keeps intermediate cache
RUN apt-get update
RUN apt-get install -y libpq5
RUN rm -rf /var/lib/apt/lists/*

# ✅ GOOD - Single layer, no cache in final image
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*
```

---

## Read-Only Root Filesystem

### Principle: Prevent Runtime File Modifications

**Implementation**: Make root filesystem read-only, provide writable volumes for specific directories.

```dockerfile
# Application writes only to /tmp and /app/logs
VOLUME ["/tmp", "/app/logs"]

# Run with --read-only flag
# docker run --read-only -v /tmp -v /app/logs myapp
```

**Benefits**:
- Prevents malware from writing to system directories
- Enforces immutable infrastructure
- Easier auditing (any file changes are suspicious)

**Challenges**:
- Application must not write to unexpected locations
- Requires explicit volumes for /tmp, logs, cache

---

## Secrets Management

### NEVER Include Secrets in Images

```dockerfile
# ❌ VERY BAD - Secret baked into image
ENV DATABASE_PASSWORD=supersecret123

# ❌ BAD - Still visible in image history
ARG DATABASE_PASSWORD
ENV DATABASE_PASSWORD=${DATABASE_PASSWORD}
```

### Use Runtime Environment Variables

```dockerfile
# ✅ GOOD - No ENV directive for secrets
# docker run -e DATABASE_PASSWORD="..." myapp
```

### Use Docker Secrets (Swarm Mode)

```bash
# Create secret
echo "supersecret123" | docker secret create db_password -

# Use in service
docker service create \
  --name myapp \
  --secret db_password \
  myapp:latest
```

**Access in container**:
```bash
# Secret mounted at /run/secrets/db_password
cat /run/secrets/db_password
```

### Use .env Files (Development Only)

```bash
# .env file (DO NOT COMMIT TO GIT)
DATABASE_PASSWORD=supersecret123

# Run with --env-file
docker run --env-file .env myapp
```

---

## Vulnerability Scanning

### Scan Images with Trivy

```bash
# Install Trivy
brew install aquasecurity/trivy/trivy

# Scan image
trivy image myapp:latest

# Filter by severity
trivy image --severity HIGH,CRITICAL myapp:latest

# Scan Dockerfile
trivy config Dockerfile
```

### Scan with Docker Scan (Snyk)

```bash
# Enable Docker scan
docker scan --version

# Scan image
docker scan myapp:latest

# Filter by severity
docker scan --severity high myapp:latest
```

### Fix Vulnerabilities

**Process**:
1. Scan image: `trivy image myapp:latest`
2. Review CVEs (Common Vulnerabilities and Exposures)
3. Update base image: `FROM python:3.11-slim` → `FROM python:3.12-slim`
4. Rebuild image: `docker build -t myapp:latest .`
5. Rescan: `trivy image myapp:latest`

---

## Least Privilege Principle

### Drop Unnecessary Capabilities

**Linux Capabilities**: Fine-grained permissions (vs all-or-nothing root)

```bash
# Run with dropped capabilities
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp
```

**Common Capabilities**:
- `NET_BIND_SERVICE`: Bind to ports < 1024
- `CHOWN`: Change file ownership
- `DAC_OVERRIDE`: Bypass file permissions
- `SYS_TIME`: Set system time

**Best Practice**: Drop ALL, then add only what's needed.

### Use AppArmor / SELinux

```bash
# Run with AppArmor profile
docker run --security-opt apparmor=docker-default myapp

# Run with SELinux label
docker run --security-opt label:type:container_t myapp
```

---

## Network Security

### Limit Network Access

```bash
# Run with no network access
docker run --network none myapp

# Run with custom network (isolated from host)
docker network create isolated
docker run --network isolated myapp
```

### Use Internal Networks (Docker Compose)

```yaml
# docker-compose.yml
services:
  backend:
    networks:
      - internal
  database:
    networks:
      - internal

networks:
  internal:
    internal: true  # No external access
```

---

## Security Checklist

Before deploying container to production:

### Image Security
- [ ] Base image is minimal (-slim or -alpine)
- [ ] Base image is up-to-date (latest patch version)
- [ ] Image scanned with Trivy or Snyk (no HIGH/CRITICAL CVEs)
- [ ] Package manager cache removed (rm -rf /var/lib/apt/lists/*)
- [ ] Unnecessary packages not installed (--no-install-recommends)

### User Security
- [ ] Container runs as non-root user (USER directive)
- [ ] User has explicit UID (1000 or 1001)
- [ ] Files owned by non-root user (--chown flag)
- [ ] No shell access needed for runtime user

### Secrets Security
- [ ] No secrets in ENV directives
- [ ] No secrets in ARG directives (visible in history)
- [ ] Secrets passed at runtime (--env-file, Docker secrets)
- [ ] .env files in .gitignore

### Filesystem Security
- [ ] Root filesystem is read-only (advanced)
- [ ] Writable volumes explicitly defined (/tmp, /app/logs)
- [ ] Application doesn't write to unexpected locations

### Network Security
- [ ] Exposed ports documented (EXPOSE directive)
- [ ] Unnecessary ports not exposed
- [ ] Health check configured (HEALTHCHECK directive)

### Runtime Security
- [ ] Capabilities dropped (--cap-drop=ALL)
- [ ] Necessary capabilities added explicitly (--cap-add)
- [ ] AppArmor / SELinux profile configured
- [ ] Resource limits set (--memory, --cpus)

---

## Security Anti-Patterns

### ❌ Running as Root

```dockerfile
# BAD
FROM python:3.11-slim
COPY . /app
CMD ["python", "app.py"]
# Runs as UID 0 (root)
```

### ✅ Running as Non-Root

```dockerfile
# GOOD
FROM python:3.11-slim
RUN useradd --system --uid 1000 app
COPY --chown=app:app . /app
USER app
CMD ["python", "app.py"]
# Runs as UID 1000 (app)
```

---

### ❌ Secrets in ENV

```dockerfile
# BAD - Secret visible in image history
ENV DATABASE_PASSWORD=supersecret123
```

### ✅ Secrets at Runtime

```dockerfile
# GOOD - No ENV directive
# docker run -e DATABASE_PASSWORD="..." myapp
```

---

### ❌ Outdated Base Image

```dockerfile
# BAD - python:3.9 has known CVEs
FROM python:3.9-slim
```

### ✅ Latest Patch Version

```dockerfile
# GOOD - python:3.11-slim has latest security patches
FROM python:3.11-slim
```

---

### ❌ Installing Unnecessary Packages

```dockerfile
# BAD - Installs 50+ recommended packages
RUN apt-get install -y curl
```

### ✅ Minimal Installation

```dockerfile
# GOOD - Installs only curl (no recommendations)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*
```

---

## Additional Resources

- **Docker Security Best Practices**: https://docs.docker.com/develop/security-best-practices/
- **CIS Docker Benchmark**: https://www.cisecurity.org/benchmark/docker
- **OWASP Docker Security Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html
- **Trivy Documentation**: https://aquasecurity.github.io/trivy/
- **Snyk Container Security**: https://snyk.io/product/container-vulnerability-management/
