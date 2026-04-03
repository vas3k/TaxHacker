# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Development server (port 7331, uses Turbopack)
npm run dev

# Production build
npm run build

# Start production server (runs Prisma migrations first)
npm run start

# Linting
npm run lint

# Database commands
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Run migrations in development
npx prisma migrate deploy    # Run migrations in production
npx prisma db push           # Push schema changes without migration
```

## Architecture Overview

TaxHacker is a self-hosted AI accounting app built with Next.js 15+ App Router. It processes receipts/invoices using LLMs and supports CSV import with duplicate detection.

### Directory Structure

- **app/**: Next.js App Router pages and API routes
  - `(app)/`: Authenticated app routes (dashboard, transactions, settings, import, unsorted)
  - `(auth)/`: Authentication flows (login, self-hosted setup)
  - `api/`: API routes (auth, currency, stripe webhooks, progress tracking)
- **components/**: React components organized by feature (agents, import, transactions, unsorted, ui)
- **lib/**: Core utilities and business logic
  - `csv/`: CSV parsers for different formats (Amazon, AmEx, Chase, generic)
  - `matching/`: Duplicate detection algorithm for CSV imports
  - `previews/`: PDF and image preview generation
- **models/**: Data access layer wrapping Prisma operations
- **prisma/**: Database schema and migrations

### Key Patterns

**Data Flow**: Server actions in `actions.ts` files handle form submissions. Models in `models/` wrap Prisma for database operations. The `lib/` directory contains pure business logic.

**Authentication**: Uses `better-auth` with email OTP. Self-hosted mode bypasses normal auth and uses a single auto-created user. Check `lib/auth.ts` for `getCurrentUser()` and `getSession()`.

**Server Actions**: Located in `app/(app)/**/actions.ts`. They call models directly and handle user context via `getCurrentUser()`.

**CSV Import Pipeline**:
1. Format detection (`lib/csv/format-detector.ts`)
2. Format-specific parsing (Amazon aggregator groups multi-item orders)
3. Duplicate matching (`lib/matching/finder.ts`, `lib/matching/merger.ts`)
4. Import batch tracking with `ImportBatch`, `ImportRow`, `TransactionMatch` models

**LLM Integration**: Supports OpenAI, Google Gemini, and Mistral. Provider config in `lib/llm-providers.ts`. AI extracts transaction data from uploaded documents.

### Database Models

Core entities: `User`, `Transaction`, `Category`, `Project`, `Field`, `File`, `Currency`

Import tracking: `ImportBatch`, `ImportRow`, `TransactionMatch`, `TransactionAuditLog`

Transactions store amounts in cents (integer). Currency conversion uses historical rates. Custom fields are stored in the `extra` JSON column.

### Environment Configuration

Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `UPLOAD_PATH`

Self-hosted mode: Set `SELF_HOSTED_MODE=true` for single-user auto-login.

LLM keys: `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `MISTRAL_API_KEY` (at least one required for AI features)

### PDF Processing

Requires Ghostscript and GraphicsMagick installed locally:
```bash
brew install gs graphicsmagick  # macOS
```
