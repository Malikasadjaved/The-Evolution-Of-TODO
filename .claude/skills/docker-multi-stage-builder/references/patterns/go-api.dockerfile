# =============================================================================
# Multi-Stage Dockerfile for Go API (Ultra-Minimal)
# =============================================================================
# Build: docker build -t myapp-api .
# Run:   docker run -p 8080:8080 --env-file .env myapp-api
# =============================================================================

# =============================================================================
# Stage 1: Builder - Compile Go binary
# =============================================================================
FROM golang:1.21-alpine AS builder

# Install build dependencies (if needed for CGO)
# gcc and musl-dev are required if CGO_ENABLED=1
# Most Go applications can disable CGO for static binaries
RUN apk add --no-cache \
    gcc \
    musl-dev \
    ca-certificates

# Set working directory
WORKDIR /build

# Copy go.mod and go.sum first (for layer caching)
# If dependencies unchanged, Docker reuses cached layers
COPY go.mod go.sum ./

# Download dependencies
# This layer is cached separately from source code
RUN go mod download

# Verify dependencies
RUN go mod verify

# Copy source code
COPY . .

# Build static binary
# CGO_ENABLED=0: Disable CGO (creates fully static binary)
# GOOS=linux: Target Linux OS
# GOARCH=amd64: Target 64-bit architecture
# -ldflags="-w -s": Strip debug info and symbol table (reduces size by 30%)
#   -w: Omit DWARF symbol table
#   -s: Omit symbol table and debug info
# -a: Force rebuilding of packages
# -installsuffix cgo: Use different install suffix for CGO-disabled builds
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -a -installsuffix cgo -o app .

# =============================================================================
# Stage 2: Runtime - Minimal Alpine image (Recommended)
# =============================================================================
FROM alpine:3.19 AS runtime

# Metadata labels
LABEL maintainer="team@example.com"
LABEL description="Go API for Production Application"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/org/repo"

# Install ca-certificates (for HTTPS requests) and curl (for health checks)
# ca-certificates: TLS/SSL certificate authorities
# curl: For health checks
RUN apk add --no-cache ca-certificates curl

# Create non-root user
# --system: Create a system user
# --uid 1000: Explicit UID for consistency
RUN addgroup --system --gid 1000 app && \
    adduser --system --uid 1000 --ingroup app app

# Set working directory
WORKDIR /app

# Copy compiled binary from builder
# --chown=app:app: Set ownership to non-root user
COPY --from=builder /build/app .

# Copy config files (if needed)
# COPY --chown=app:app config.yaml .

# Switch to non-root user
USER app

# Expose port (configurable via PORT environment variable)
EXPOSE 8080

# Environment variables (can be overridden at runtime)
ENV PORT=8080

# Health check (ensures container is healthy)
# --interval=30s: Check every 30 seconds
# --timeout=10s: Timeout after 10 seconds
# --start-period=20s: Grace period for app startup (Go apps start fast)
# --retries=3: Mark unhealthy after 3 failed checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Default command: Run the binary
ENTRYPOINT ["/app/app"]

# =============================================================================
# Alternative Stage 2: Ultra-Minimal Scratch Runtime (Advanced)
# =============================================================================
# Uncomment this stage and comment out the Alpine stage above for 0-byte base image

# FROM scratch AS runtime
#
# # Copy CA certificates from builder (required for HTTPS)
# COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
#
# # Copy binary from builder
# COPY --from=builder /build/app /app
#
# # Expose port
# EXPOSE 8080
#
# # No health check (no curl, no shell)
# # Use Kubernetes liveness probe instead
#
# # Run binary
# ENTRYPOINT ["/app"]

# =============================================================================
# Comparison: Alpine vs Scratch
# =============================================================================
# Alpine (~7MB base):
#   ✅ Has shell (can docker exec)
#   ✅ Has package manager (apk)
#   ✅ Can install curl for health checks
#   ✅ Easier to debug
#   ✅ Has CA certificates by default
#   ❌ Slightly larger (+7MB)
#
# Scratch (0MB base):
#   ✅ Ultra-minimal (0 bytes + binary)
#   ✅ Maximum security (no shell, no utilities)
#   ❌ No shell (cannot docker exec)
#   ❌ No health check (no curl)
#   ❌ Harder to debug
#   ❌ Must copy CA certificates manually
# =============================================================================

# =============================================================================
# main.go Example (Health Endpoint Required)
# =============================================================================
#
# package main
#
# import (
#     "encoding/json"
#     "log"
#     "net/http"
#     "os"
# )
#
# type HealthResponse struct {
#     Status string `json:"status"`
# }
#
# func healthHandler(w http.ResponseWriter, r *http.Request) {
#     w.Header().Set("Content-Type", "application/json")
#     w.WriteHeader(http.StatusOK)
#     json.NewEncoder(w).Encode(HealthResponse{Status: "healthy"})
# }
#
# func main() {
#     http.HandleFunc("/health", healthHandler)
#
#     port := os.Getenv("PORT")
#     if port == "" {
#         port = "8080"
#     }
#
#     log.Printf("Server listening on port %s", port)
#     log.Fatal(http.ListenAndServe(":"+port, nil))
# }
#
# =============================================================================

# =============================================================================
# Build and Run Instructions
# =============================================================================
#
# 1. Build image:
#    docker build -t myapp-api .
#
# 2. Run container (development):
#    docker run -p 8080:8080 --env-file .env myapp-api
#
# 3. Run container (production):
#    docker run -d \
#      -p 8080:8080 \
#      -e PORT=8080 \
#      -e DATABASE_URL="postgresql://..." \
#      --name myapp-api \
#      myapp-api
#
# 4. Check health:
#    curl http://localhost:8080/health
#
# 5. View logs:
#    docker logs -f myapp-api
#
# 6. Debug (Alpine only):
#    docker exec -it myapp-api sh
#
# =============================================================================
# Expected Image Size
# =============================================================================
# - Builder stage: ~400MB (includes Go toolchain)
# - Runtime stage (Alpine): ~15MB (7MB Alpine + 8MB binary)
# - Runtime stage (Scratch): ~8MB (0MB base + 8MB binary)
# - Size reduction: 96-98% smaller than single-stage build
# =============================================================================

# =============================================================================
# go.mod Example
# =============================================================================
#
# module github.com/org/myapp
#
# go 1.21
#
# require (
#     github.com/gorilla/mux v1.8.1
#     github.com/lib/pq v1.10.9
# )
#
# =============================================================================

# =============================================================================
# .dockerignore Recommendations
# =============================================================================
# Create .dockerignore with:
#
# .git
# .gitignore
# *.md
# .vscode
# .idea
# bin/
# vendor/ (if using go modules)
# *.test
# *.prof
# =============================================================================

# =============================================================================
# Performance Tips
# =============================================================================
# 1. Use go mod download for better caching
# 2. Build with -ldflags="-w -s" to strip debug info (30% size reduction)
# 3. Use CGO_ENABLED=0 for static binaries (works on any Linux)
# 4. Consider UPX compression for even smaller binaries (50% size reduction)
#    RUN upx --best --lzma /build/app
# 5. Use Alpine for easier debugging, scratch for production
# =============================================================================
