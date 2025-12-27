# =============================================================================
# Multi-Stage Dockerfile for FastAPI Backend (Production-Ready)
# =============================================================================
# Build: docker build -t todo-backend .
# Run:   docker run -p 8000:8000 --env-file .env todo-backend
# =============================================================================

# =============================================================================
# Stage 1: Builder - Install dependencies and build wheels
# =============================================================================
FROM python:3.11-slim as builder

# Set working directory for builder
WORKDIR /build

# Install build dependencies (gcc, etc. for compiling Python packages)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        python3-dev \
        libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy only requirements first (for layer caching)
COPY requirements.txt .

# Install dependencies to /build/wheels
# --no-cache-dir: Don't cache pip downloads (reduces image size)
# --prefix=/build/install: Install to custom location for copying
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/build/install -r requirements.txt

# =============================================================================
# Stage 2: Runtime - Minimal production image
# =============================================================================
FROM python:3.11-slim

# Metadata labels
LABEL maintainer="your-email@example.com"
LABEL description="FastAPI Backend for Todo Application (Phase 3)"
LABEL version="1.0.0"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install runtime dependencies only (PostgreSQL client library)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libpq5 \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user and group
# --system: Create a system user (no password, no home directory shell)
# --no-create-home: Don't create /home/app directory
# --uid 1000: Explicit UID for consistency
RUN groupadd --system --gid 1000 app && \
    useradd --system --no-create-home --uid 1000 --gid app app

# Set working directory
WORKDIR /app

# Copy installed dependencies from builder stage
COPY --from=builder /build/install /usr/local

# Copy application code
COPY --chown=app:app . .

# Create directory for SQLite database (if used) with correct permissions
RUN mkdir -p /app/data && chown -R app:app /app/data

# Switch to non-root user
USER app

# Expose port (configurable via PORT environment variable)
# Default: 8000
EXPOSE 8000

# Health check (ensures container is healthy)
# --interval=30s: Check every 30 seconds
# --timeout=10s: Timeout after 10 seconds
# --start-period=40s: Grace period for app startup
# --retries=3: Mark unhealthy after 3 failed checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Default command: Run uvicorn with environment variables
# PORT: Configurable port (default 8000)
# HOST: Bind to 0.0.0.0 (accept external connections)
# --workers: Number of worker processes (default 4)
# --log-level: Logging verbosity (info for production)
CMD uvicorn src.api.main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --workers 4 \
    --log-level info \
    --proxy-headers \
    --forwarded-allow-ips='*'
