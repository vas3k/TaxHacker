# syntax=docker/dockerfile:1
FROM node:26.13.1-slim AS base

ENV PORT=7331
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DEBIAN_FRONTEND=noninteractive

# OpenSSL is shared by dependency generation, the build, and the runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# ── Dependencies (cached unless package files change) ──
FROM base AS deps
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ── Build (native AMD64 in CI; no QEMU or pre-generated host artifacts) ──
FROM deps AS builder
ENV NODE_ENV=production
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate
COPY . .
RUN npm run build && rm -rf .next/cache

# ── Runtime ──
FROM base AS runner
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    cron \
    ghostscript \
    graphicsmagick \
    libwebp-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN mkdir -p /app/data /app/upload

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/models ./models
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/next.config.ts ./

COPY docker-entrypoint.sh docker-cron-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh /usr/local/bin/docker-cron-entrypoint.sh

EXPOSE 7331
ENTRYPOINT ["docker-entrypoint.sh"]
# Migrations already run in docker-entrypoint.sh.
CMD ["node", "node_modules/next/dist/bin/next", "start"]
