FROM node:26-slim AS base

# Default environment variables
ENV PORT=7331
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DEBIAN_FRONTEND=noninteractive

# Build stage
FROM base AS builder

# Install dependencies required for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies, including devDependencies (the `prisma` CLI needed
# below by `prisma generate` is a devDependency; production stage never sees
# this override since it starts fresh `FROM base`)
ENV NODE_ENV=development
RUN npm ci

# Restore NODE_ENV=production for the rest of this stage: `next build` treats
# a non-production NODE_ENV as a dev build, which breaks static export of
# /_error and /404 ("<Html> should not be imported outside of pages/_document").
# The already-installed devDependencies (e.g. the `prisma` CLI) stay on disk
# regardless of this env var.
ENV NODE_ENV=production

# Copy source code
COPY prisma.config.ts ./
COPY . .

# CI pre-generates prisma/client natively (see workflows) and sets
# SKIP_PRISMA_GENERATE=true so get-dmmf never runs under QEMU emulation.
# Local single-platform builds run prisma generate here (natively, safe).
ARG SKIP_PRISMA_GENERATE=false
RUN if [ "${SKIP_PRISMA_GENERATE}" != "true" ]; then npx prisma generate; fi

# Build the application
RUN npm run build

# Production stage
FROM base

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    ghostscript \
    graphicsmagick \
    openssl \
    libwebp-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create upload directory and set permissions
RUN mkdir -p /app/upload

# Copy built assets from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/next.config.ts ./

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create directory for uploads
RUN mkdir -p /app/data

EXPOSE 7331

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
