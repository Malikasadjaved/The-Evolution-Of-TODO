# =============================================================================
# Multi-Stage Dockerfile for FastAPI Backend (Production-Ready)
# =============================================================================
# Build: docker build -t myapp-backend .
# Run:   docker run -p 8000:8000 --env-file .env myapp-backend
# =============================================================================

# =============================================================================
# Stage 1: Builder - Install dependencies and build wheels
# =============================================================================
FROM python:3.11-slim AS builder

# Set working directory for builder
WORKDIR /build

# Install build dependencies (gcc, etc. for compiling Python packages)
# --no-install-recommends: Don't install suggested packages (reduces size)
# rm -rf /var/lib/apt/lists/*: Clean package cache (saves ~40MB)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        python3-dev \
        libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy only requirements first (for layer caching)
# If requirements.txt unchanged, Docker reuses cached layer
COPY requirements.txt .

# Install dependencies to /build/install
# --no-cache-dir: Don't cache pip downloads (reduces image size)
# --prefix=/build/install: Install to custom location for copying to runtime stage
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/build/install -r requirements.txt

# =============================================================================
# Stage 2: Runtime - Minimal production image
# =============================================================================
FROM python:3.11-slim

# Metadata labels
LABEL maintainer="team@example.com"
LABEL description="FastAPI Backend for Production Application"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/org/repo"

# Set environment variables
# PYTHONUNBUFFERED=1: Output Python logs in real-time (not buffered)
# PYTHONDONTWRITEBYTECODE=1: Don't generate .pyc files (reduces image size)
# PIP_NO_CACHE_DIR=1: Don't cache pip downloads
# PIP_DISABLE_PIP_VERSION_CHECK=1: Skip pip version check (faster startup)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install runtime dependencies only (PostgreSQL client library, curl for health checks)
# libpq5: PostgreSQL client library (runtime only, no dev headers)
# curl: For health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libpq5 \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user and group
# --system: Create a system user (no password, no home directory shell)
# --no-create-home: Don't create /home/app directory
# --uid 1000: Explicit UID for consistency across environments
# --gid app: Primary group is 'app'
RUN groupadd --system --gid 1000 app && \
    useradd --system --no-create-home --uid 1000 --gid app app

# Set working directory
WORKDIR /app

# Copy installed dependencies from builder stage
# /build/install contains all pip packages from requirements.txt
COPY --from=builder /build/install /usr/local

# Copy application code
# --chown=app:app: Set ownership to non-root user
COPY --chown=app:app . .

# Create directory for SQLite database (if used) with correct permissions
# Adjust this based on your application's needs
RUN mkdir -p /app/data && chown -R app:app /app/data

# Switch to non-root user
# CRITICAL: All subsequent commands run as 'app' user (UID 1000)
USER app

# Expose port (configurable via PORT environment variable)
# Default: 8000
# Note: This is documentation only; doesn't actually publish the port
EXPOSE 8000

# Health check (ensures container is healthy)
# --interval=30s: Check every 30 seconds
# --timeout=10s: Timeout after 10 seconds
# --start-period=40s: Grace period for app startup (migrations, etc.)
# --retries=3: Mark unhealthy after 3 failed checks
# -f: Fail on HTTP error (4xx, 5xx)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Default command: Run uvicorn with environment variables
# PORT: Configurable port (default 8000)
# HOST: Bind to 0.0.0.0 (accept external connections)
# --workers: Number of worker processes (default 4)
# --log-level: Logging verbosity (info for production)
# --proxy-headers: Trust X-Forwarded-* headers (for reverse proxies)
# --forwarded-allow-ips='*': Allow all IPs to set forwarded headers
CMD uvicorn src.api.main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --workers 4 \
    --log-level info \
    --proxy-headers \
    --forwarded-allow-ips='*'

# =============================================================================
# Build and Run Instructions
# =============================================================================
#
# 1. Build image:
#    docker build -t myapp-backend .
#
# 2. Run container (development):
#    docker run -p 8000:8000 --env-file .env myapp-backend
#
# 3. Run container (production):
#    docker run -d \
#      -p 8000:8000 \
#      -e DATABASE_URL="postgresql://..." \
#      -e SECRET_KEY="..." \
#      --name myapp-backend \
#      myapp-backend
#
# 4. Check health:
#    curl http://localhost:8000/health
#
# 5. View logs:
#    docker logs -f myapp-backend
#
# =============================================================================
# Expected Image Size: ~350MB (with dependencies)
# =============================================================================
# - Builder stage: ~600MB (includes gcc, python-dev)
# - Runtime stage: ~350MB (only runtime dependencies)
# - Size reduction: 42% smaller than single-stage build
# =============================================================================
