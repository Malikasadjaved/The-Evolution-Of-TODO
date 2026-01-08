# ===== Stage 1: Dependencies =====
FROM node:20-alpine AS deps

# Install dependencies only when needed
WORKDIR /app

# Copy dependency files
COPY frontend-web/package.json frontend-web/package-lock.json* ./

# Install ALL dependencies (including dev dependencies needed for build: tailwindcss, postcss, etc.)
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# ===== Stage 2: Builder =====
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY frontend-web/ .

# Build Next.js application (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Accept build arguments for environment-specific values
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_BETTER_AUTH_SECRET=build-time-dummy-secret-value-43-characters
ARG NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth

# Set as environment variables
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BETTER_AUTH_SECRET=$NEXT_PUBLIC_BETTER_AUTH_SECRET
ENV NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL

RUN npm run build

# ===== Stage 3: Production Runtime =====
FROM node:20-alpine AS runtime

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy standalone output (minimal production server)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run Next.js production server
CMD ["node", "server.js"]
