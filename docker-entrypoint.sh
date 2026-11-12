#!/bin/sh
set -e

# Extract server part from DATABASE_URL (remove database name)
SERVER_URL=$(printf '%s' "${DIRECT_URL:-$DATABASE_URL}" | sed 's/\/[^/]*$//')

# Wait for database to be ready using psql and SERVER_URL
echo "Waiting for the direct PostgreSQL connection..."
until psql "$SERVER_URL" -c '\q' >/dev/null 2>&1; do
  echo "PostgreSQL server is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL server is ready!"

# Run database migrations
echo "Running database migrations..."
DATABASE_URL="${DIRECT_URL:-$DATABASE_URL}" npx prisma migrate deploy

echo "Starting: $*"
exec "$@"
