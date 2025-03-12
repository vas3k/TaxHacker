#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Run database seeding if SEED_DATABASE is set to true
if [ "$SEED_DATABASE" = "true" ]; then
    echo "Seeding database..."
    npm run seed
fi

# Start the application
echo "Starting the application..."
exec "$@"
