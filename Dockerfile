# Build Stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
# Mount BuildKit cache for npm store to speed up rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm install

COPY . .

# Build arguments for SvelteKit static public environment variables
ARG PUBLIC_GATEWAY_URL
ARG ENABLE_SYNC
ARG ENABLE_DEBUG

ENV PUBLIC_GATEWAY_URL=$PUBLIC_GATEWAY_URL
ENV ENABLE_SYNC=$ENABLE_SYNC
ENV ENABLE_DEBUG=$ENABLE_DEBUG

RUN npm run build
RUN npm prune --production

# Production Stage
FROM node:22-alpine AS runner
WORKDIR /app

# Install curl & wget for Coolify Healthchecks
RUN apk add --no-cache curl wget

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ARG PORT=3004
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["node", "build/index.js"]
