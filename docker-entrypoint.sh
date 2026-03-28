#!/bin/sh
set -e

# Determine database provider from DATABASE_PROVIDER env or detect from DATABASE_URL
if [ -z "$DATABASE_PROVIDER" ]; then
  if echo "$DATABASE_URL" | grep -q "^file:"; then
    DATABASE_PROVIDER="sqlite"
  elif echo "$DATABASE_URL" | grep -q "^postgres"; then
    DATABASE_PROVIDER="postgresql"
  else
    DATABASE_PROVIDER="postgresql"
  fi
fi

echo "Database provider: $DATABASE_PROVIDER"

# Select the appropriate Prisma schema
node scripts/select-schema.js

if [ "$DATABASE_PROVIDER" = "sqlite" ]; then
  # SQLite: Create data directory if needed
  echo "Setting up SQLite database..."

  # Extract file path from DATABASE_URL (file:./path/to/db.sqlite)
  DB_PATH=$(echo "$DATABASE_URL" | sed 's/^file://')
  DB_DIR=$(dirname "$DB_PATH")

  # Create directory if it doesn't exist
  if [ ! -d "$DB_DIR" ]; then
    mkdir -p "$DB_DIR"
    echo "Created database directory: $DB_DIR"
  fi

  # Generate Prisma client and push schema (SQLite doesn't support migrations)
  echo "Generating Prisma client..."
  npx prisma generate

  echo "Pushing database schema..."
  npx prisma db push --accept-data-loss

else
  # PostgreSQL: Wait for server and run migrations

  # Skip database check if SKIP_DB_CHECK is set
  if [ "$SKIP_DB_CHECK" = "true" ]; then
    echo "Skipping database readiness check (SKIP_DB_CHECK=true)"
  else
    # Extract server part from DATABASE_URL (remove database name)
    SERVER_URL=$(echo "$DATABASE_URL" | sed 's/\/[^/]*$//')

    echo "Waiting for PostgreSQL server to be ready at $SERVER_URL..."
    until psql "$SERVER_URL" -c '\q' >/dev/null 2>&1; do
      echo "PostgreSQL server is unavailable - sleeping"
      sleep 1
    done
    echo "PostgreSQL server is ready!"
  fi

  # Run database migrations
  echo "Generating Prisma client..."
  npx prisma generate

  echo "Running database migrations..."
  npx prisma migrate deploy
fi

# Start the application
echo "Starting the application..."
exec "$@"
