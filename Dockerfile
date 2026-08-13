# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
# Mount BuildKit cache for npm store to speed up rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm install

COPY . .

# Build arguments for SvelteKit static public environment variables
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG ENABLE_SYNC
ARG ENABLE_DEBUG

ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY
ENV ENABLE_SYNC=$ENABLE_SYNC
ENV ENABLE_DEBUG=$ENABLE_DEBUG

RUN npm run build
RUN npm prune --production

# Production Stage
FROM node:22-alpine AS runner
WORKDIR /app

# Install curl for Coolify Healthcheck
RUN apk add --no-cache curl

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ARG PORT=3000
ENV PORT=${PORT}

CMD ["node", "build"]
