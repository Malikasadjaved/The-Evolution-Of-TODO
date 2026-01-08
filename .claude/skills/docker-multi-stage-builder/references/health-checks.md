# Docker Health Checks

Configuring container health monitoring with HEALTHCHECK directive.

## Why Health Checks Matter

**Problem Without Health Checks**:
- Container running but application crashed → Docker shows "healthy"
- Application deadlocked → Container keeps restarting
- Orchestrators (Kubernetes, Swarm) cannot detect unhealthy containers

**Solution**: Define HEALTHCHECK to monitor application status.

## HEALTHCHECK Directive

### Syntax

```dockerfile
HEALTHCHECK [OPTIONS] CMD <command>
```

**Options**:
- `--interval=<duration>` - Time between checks (default: 30s)
- `--timeout=<duration>` - Max time for check to complete (default: 30s)
- `--start-period=<duration>` - Grace period for startup (default: 0s)
- `--retries=<count>` - Consecutive failures before unhealthy (default: 3)

### Exit Codes

| Code | Status | Meaning |
|------|--------|---------|
| 0 | Healthy | Check passed |
| 1 | Unhealthy | Check failed |
| 2 | Reserved | Starting (during start-period) |

---

## HTTP Health Checks

### Using curl

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1
```

**Flags Explained**:
- `-f` / `--fail` - Return non-zero exit code on HTTP error (4xx, 5xx)
- `${PORT:-8000}` - Use $PORT if set, otherwise default to 8000

**Requirements**:
- curl must be installed in runtime image
- Application must expose health endpoint (/health, /api/health, /healthz)

### Using wget

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1
```

**Flags Explained**:
- `--no-verbose` - Suppress output
- `--tries=1` - Only try once
- `--spider` - Don't download, just check

### Using Node.js (No Dependencies)

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3000}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**Advantages**:
- No need to install curl/wget
- Works with any Node.js image

---

## TCP Health Checks

### Using netcat (nc)

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD nc -z localhost ${PORT:-5432} || exit 1
```

**Use Cases**:
- Database containers (PostgreSQL, MySQL, Redis)
- Services without HTTP endpoints
- TCP servers

**Flags Explained**:
- `-z` - Zero-I/O mode (just check if port is open)

### Using telnet

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD timeout 1 bash -c '</dev/tcp/localhost/5432' || exit 1
```

**Note**: Requires bash and telnet support.

---

## Exec Health Checks

### Python Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"
```

### Database Connection Check (Python)

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import psycopg2; psycopg2.connect('$DATABASE_URL').close()" || exit 1
```

### Custom Script

```dockerfile
COPY healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD ["/healthcheck.sh"]
```

**healthcheck.sh**:
```bash
#!/bin/sh
# Custom health check logic
if [ -f /tmp/app.pid ]; then
    exit 0
else
    exit 1
fi
```

---

## Language-Specific Examples

### Python (FastAPI)

```dockerfile
FROM python:3.11-slim

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**FastAPI Health Endpoint** (`main.py`):
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### Node.js (Next.js)

```dockerfile
FROM node:20-alpine

EXPOSE 3000
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3000}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
```

**Note**: Next.js automatically exposes `/` endpoint.

### Go

```dockerfile
FROM alpine:3.19

# Install curl for health checks
RUN apk add --no-cache curl ca-certificates

COPY app /app
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["/app"]
```

**Go Health Endpoint** (`main.go`):
```go
package main

import (
    "net/http"
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"healthy"}`))
}

func main() {
    http.HandleFunc("/health", healthHandler)
    http.ListenAndServe(":8080", nil)
}
```

---

## Start Period (Grace Period)

### Why Start Period Matters

**Problem**: Application takes time to start (database migrations, cache warming).
- Without start-period: Container marked unhealthy during startup → restart loop
- With start-period: Health checks during startup don't count toward retries

### Recommended Start Periods

| Application Type | Start Period | Reason |
|------------------|--------------|--------|
| Lightweight API (Go, Rust) | 10-20s | Fast binary startup |
| Medium API (FastAPI, Express) | 30-40s | Python/Node.js interpreter startup |
| Heavy API (Django, Rails) | 60-90s | ORM initialization, migrations |
| Frontend (Next.js, React) | 60-90s | Static generation, hydration |
| Database (PostgreSQL, MySQL) | 60-120s | Data recovery, index rebuilding |

### Example with Start Period

```dockerfile
# Fast-starting Go API
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Slow-starting Django app
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

---

## Testing Health Checks

### View Health Status

```bash
# Run container
docker run -d --name myapp myapp:latest

# Check health status
docker inspect --format='{{json .State.Health}}' myapp

# Output:
{
  "Status": "healthy",
  "FailingStreak": 0,
  "Log": [
    {
      "Start": "2025-01-08T12:00:00Z",
      "End": "2025-01-08T12:00:01Z",
      "ExitCode": 0,
      "Output": ""
    }
  ]
}
```

### Watch Health Status

```bash
# Watch health status in real-time
watch -n 1 'docker inspect --format="{{.State.Health.Status}}" myapp'
```

### Trigger Health Check Manually

```bash
# Wait for health check interval
docker events --filter 'container=myapp' --filter 'event=health_status'
```

### Debug Failed Health Checks

```bash
# View health check output
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' myapp

# Run health check manually inside container
docker exec myapp curl -f http://localhost:8000/health
```

---

## Orchestrator Integration

### Docker Compose

```yaml
services:
  backend:
    build: ./backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      start_period: 40s
      retries: 3
    depends_on:
      database:
        condition: service_healthy

  database:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**depends_on with condition**:
- `service_started` - Wait for container to start (default)
- `service_healthy` - Wait for health check to pass
- `service_completed_successfully` - Wait for container to exit with code 0

### Kubernetes

Docker HEALTHCHECK is **not used** by Kubernetes. Use liveness/readiness probes instead:

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: backend
    image: myapp:latest
    livenessProbe:
      httpGet:
        path: /health
        port: 8000
      initialDelaySeconds: 40
      periodSeconds: 30
      timeoutSeconds: 10
      failureThreshold: 3
```

**Note**: Dockerfile HEALTHCHECK provides documentation, but Kubernetes probes override it.

---

## Health Check Best Practices

### ✅ DO

1. **Check application logic**, not just "is process running"
   ```python
   @app.get("/health")
   async def health():
       # Check database connection
       await db.execute("SELECT 1")
       # Check cache connection
       await redis.ping()
       return {"status": "healthy"}
   ```

2. **Use reasonable timeouts** (10s max for most APIs)

3. **Set appropriate start-period** (allow time for startup)

4. **Keep health checks lightweight** (no heavy database queries)

5. **Return 200 OK** for healthy, 5xx for unhealthy

### ❌ DON'T

1. **Don't check external dependencies** (health check should be fast)
   ```python
   # BAD - checks external API (slow, unreliable)
   @app.get("/health")
   async def health():
       response = await httpx.get("https://api.example.com/status")
       return {"status": "healthy" if response.status_code == 200 else "unhealthy"}
   ```

2. **Don't use authentication** (health check should be public)

3. **Don't perform write operations** (health checks run frequently)

4. **Don't hardcode port** (use environment variables)
   ```dockerfile
   # BAD - hardcoded port
   CMD curl -f http://localhost:8000/health

   # GOOD - configurable port
   CMD curl -f http://localhost:${PORT:-8000}/health
   ```

---

## Comparison of Health Check Methods

| Method | Pros | Cons | Use Case |
|--------|------|------|----------|
| **HTTP (curl)** | ✅ Standard, easy to implement | ❌ Requires curl in image | Web APIs, frontends |
| **HTTP (wget)** | ✅ Often pre-installed | ❌ Verbose output | Legacy systems |
| **HTTP (Node.js)** | ✅ No dependencies | ❌ Node.js only | Next.js, Express |
| **TCP (nc)** | ✅ Simple, fast | ❌ Doesn't verify app logic | Databases, TCP services |
| **Exec (Python)** | ✅ Custom logic | ❌ Slower than HTTP | Complex health checks |
| **Custom script** | ✅ Maximum flexibility | ❌ Harder to maintain | Advanced use cases |

---

## Example Health Check Implementations

### FastAPI (Advanced)

```python
from fastapi import FastAPI, status
from sqlalchemy import text

app = FastAPI()

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check(db: Session = Depends(get_db)):
    try:
        # Check database connection
        db.execute(text("SELECT 1"))

        # Check critical services
        # redis.ping()
        # cache.get("healthcheck")

        return {
            "status": "healthy",
            "database": "connected",
            # "redis": "connected",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unhealthy: {str(e)}"
        )
```

### Express.js (Advanced)

```javascript
const express = require('express');
const app = express();

app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.raw('SELECT 1');

    // Check Redis connection
    await redis.ping();

    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      redis: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

---

## Additional Resources

- **Docker HEALTHCHECK Reference**: https://docs.docker.com/engine/reference/builder/#healthcheck
- **Kubernetes Health Checks**: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
- **Docker Compose Healthcheck**: https://docs.docker.com/compose/compose-file/compose-file-v3/#healthcheck
