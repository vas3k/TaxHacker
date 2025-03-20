#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Initialize database
echo "Checking and seeding database if needed..."
npm run seed

# Start the application
echo "Starting the application..."
exec "$@"
