# ===== Stage 1: Dependencies =====
FROM node:20-alpine AS deps

# Install dependencies only when needed
WORKDIR /app

# Copy dependency files
COPY frontend-chatbot/package.json frontend-chatbot/package-lock.json* ./

# Install ALL dependencies (including dev dependencies needed for build: tailwindcss, postcss, etc.)
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# ===== Stage 2: Builder =====
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY frontend-chatbot/ .

# Build Next.js application (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Accept build arguments for environment-specific values
ARG VITE_API_URL=http://localhost:8000
ARG VITE_OPENAI_API_KEY=build-time-dummy-api-key

# Set as environment variables
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY

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
# Note: frontend-chatbot doesn't have a public directory

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001 || exit 1

# Environment variables
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Run Next.js production server
CMD ["node", "server.js"]
