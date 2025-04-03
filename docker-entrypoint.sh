#!/bin/sh
set -e

# Wait for database to be ready using psql and DATABASE_URL
echo "Waiting for PostgreSQL to be ready at $DATABASE_URL..."
until PGPASSWORD="${PGPASSWORD:-}" psql "$DATABASE_URL" -c '\q' >/dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting the application..."
exec "$@"
