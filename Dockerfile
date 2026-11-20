# syntax=docker/dockerfile:1
FROM node:26.13.1-slim

ENV PORT=7331 \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DEBIAN_FRONTEND=noninteractive

# One native build. All layers are retained in the published image's inline cache.
# Prisma CLI and tsx are also needed at runtime for migrations and email cron jobs.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates cron ghostscript graphicsmagick libwebp-dev openssl postgresql-client \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --no-audit --no-fund
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate
COPY . .
RUN npm run build && rm -rf .next/cache
RUN mkdir -p /app/data /app/upload \
    && install -m 755 docker-entrypoint.sh docker-cron-entrypoint.sh /usr/local/bin/

EXPOSE 7331
ENTRYPOINT ["docker-entrypoint.sh"]
# The entrypoint runs migrations once before starting Next.js.
CMD ["node", "node_modules/next/dist/bin/next", "start"]
