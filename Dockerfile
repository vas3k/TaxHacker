FROM node:23-slim AS base

# Metadata labels
LABEL org.opencontainers.image.title="Expensing"
LABEL org.opencontainers.image.description="Self-hosted AI accountant for expense and income tracking"
LABEL org.opencontainers.image.source="https://github.com/wingertandrew/Expensing"
LABEL org.opencontainers.image.url="https://github.com/wingertandrew/Expensing"
LABEL org.opencontainers.image.documentation="https://github.com/wingertandrew/Expensing/blob/main/README.md"
LABEL org.opencontainers.image.licenses="MIT"

# Default environment variables
ENV PORT=7331
ENV NODE_ENV=production

# Build stage
FROM base AS builder

# Install dependencies required for Prisma
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

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
