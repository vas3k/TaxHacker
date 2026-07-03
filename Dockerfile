FROM node:26-slim AS base

ENV PORT=7331
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DEBIAN_FRONTEND=noninteractive

# ── Dependencies (cached unless package.json or prisma schema changes) ──
FROM base AS deps
ENV NODE_ENV=development
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ── Prisma codegen (pinned to the native build platform so get-dmmf never runs
#    under QEMU; the generated client is platform-independent TypeScript) ──
FROM --platform=$BUILDPLATFORM base AS codegen
ENV NODE_ENV=development
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY prisma.config.ts ./
RUN npx prisma generate

# ── Build ──
FROM base AS builder
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma/
COPY --from=codegen /app/prisma/client ./prisma/client
COPY prisma.config.ts ./
COPY . .
RUN npm run build

# ── Runtime ──
FROM base AS runner
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    cron \
    ghostscript \
    graphicsmagick \
    libwebp-dev \
    openssl \
    postgresql-client
WORKDIR /app
RUN mkdir -p /app/data /app/upload

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/next.config.ts ./

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 7331
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
