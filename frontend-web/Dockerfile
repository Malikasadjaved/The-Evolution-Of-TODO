# =============================================================================
# Multi-Stage Dockerfile for Next.js Frontend (Production-Ready)
# =============================================================================
# Build: docker build -t todo-frontend-web .
# Run:   docker run -p 3000:3000 --env-file .env.local todo-frontend-web
# =============================================================================

# =============================================================================
# Stage 1: Dependencies - Install all dependencies
# =============================================================================
FROM node:20-alpine AS dependencies

# Set working directory
WORKDIR /app

# Install dependencies based on package manager
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

# Build arguments (passed from docker-compose.yml)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
# This creates optimized production build in .next/ directory
RUN npm run build

# =============================================================================
# Stage 3: Runner - Minimal production image
# =============================================================================
FROM node:20-alpine AS runner

# Metadata labels
LABEL maintainer="your-email@example.com"
LABEL description="Next.js Frontend for Todo Application (Phase 2 - Full-Stack Web App)"
LABEL version="2.0.0"

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
# --start-period=60s: Grace period for app startup (Next.js takes longer)
# --retries=3: Mark unhealthy after 3 failed checks
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3000}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Default command: Start Next.js server
CMD ["node", "server.js"]
