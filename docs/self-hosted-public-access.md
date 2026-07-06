# Self-Hosted Public Access

> ⚠️ **Warning: This is a workaround ("hack") for exposing self-hosted instances to the internet.**  
> This approach has security implications and should be used with caution. For production deployments, consider implementing proper authentication with reverse proxy or using the official cloud version.

## Overview

By default, TaxHacker's self-hosted mode (`SELF_HOSTED_MODE=true`) disables the built-in authentication system, assuming the instance runs on a trusted local network or behind a reverse proxy with its own authentication.

However, if you want to expose your self-hosted instance to the internet **and** still use TaxHacker's built-in login system, you can use this workaround.

## How It Works

The approach involves:

1. Running TaxHacker with `SELF_HOSTED_MODE=false` (cloud mode)
2. Manually creating a user via direct database access
3. Retrieving the OTP (one-time password) from the database
4. Using that OTP to sign in

## Setup Instructions

### 1. Configure Environment Variables

Run with these environment variables:

```env
SELF_HOSTED_MODE=false
DISABLE_SIGNUP=true
BASE_URL=<URL you'll use to access TaxHacker>
```

### 2. Create a User Directly in the Database

Create your user directly in the database (replace email as needed):

```bash
docker exec -it postgres psql -U postgres -d taxhacker -c "INSERT INTO users (id, email, name, membership_plan, is_email_verified, updated_at) VALUES ('6f5b4f8e-6f7a-4c3d-9b8b-7f2d2d61a9c3','mail@example.com','Owner','unlimited', true, now());"
```

### 3. Sign In with OTP from Database

Open your instance in the browser, click Sign In, and enter your email address.

Fetch the latest OTP from the database and use it to sign in:

```bash
docker exec -it postgres psql -U postgres -d taxhacker -c "SELECT value FROM verification ORDER BY created_at DESC LIMIT 1;"
```

### 4. Seed the Database

Because we skipped the normal route, database seeding won't happen automatically. Open `<YOUR_URL>/settings/danger` and click `[Reset fields, currencies and categories]`
