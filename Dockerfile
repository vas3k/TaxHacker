FROM node:23-slim AS base

# Default environment variables
ENV UPLOAD_PATH=/app/uploads
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/db.sqlite

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
    ghostscript \
    graphicsmagick \
    openssl \
    libwebp-dev \
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
COPY --from=builder /app/next.config.ts ./

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create directory for SQLite database and set permissions
RUN mkdir -p /app/data

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
