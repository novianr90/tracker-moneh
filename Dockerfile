# Multi-stage Dockerfile for tracker-moneh (SvelteKit)
# Compatible with Coolify, Docker Compose, and standalone Docker execution

# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management files for Docker caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy application source code
COPY . .

# Build arguments for SvelteKit static public environment variables
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG ENABLE_SYNC
ARG ENABLE_DEBUG

# Pass build args to ENVs so SvelteKit / Vite embeds them during build
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY
ENV ENABLE_SYNC=$ENABLE_SYNC
ENV ENABLE_DEBUG=$ENABLE_DEBUG

# Build production SvelteKit output
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# --- Stage 2: Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Create a non-root user for container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

# Copy built application & node_modules from builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

# Switch to non-root user
USER sveltekit

# Expose web server port
EXPOSE 3000

# Start SvelteKit Node application
CMD ["node", "build"]
