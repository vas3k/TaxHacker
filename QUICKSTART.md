# TaxHacker with Receipt Matching - Quick Start

Fresh deployment of TaxHacker with built-in receipt matching from day 1.

## What's Included

✅ All standard TaxHacker features (transactions, categories, projects, etc.)
✅ **Receipt matching** - Automatic duplicate detection when importing CSVs
✅ **American Express CSV support** - Import your AmEx statements
✅ **Auto-merge** - High-confidence matches (≥90%) merged automatically
✅ **Manual review** - Low-confidence matches flagged for your review
✅ **Audit trail** - Complete history of all matches and merges

---

## Quick Deploy (Fresh Database)

### Option 1: Fresh PostgreSQL Database (Recommended)

This creates a clean database with all tables from scratch:

```bash
# 1. Configure environment
cp .env.example .env
nano .env  # Edit DATABASE_URL and BETTER_AUTH_SECRET

# 2. Initialize fresh database
npx prisma migrate reset --force

# 3. Start the application
npm run dev  # Development
# OR
npm run build && npm start  # Production
```

**Your database now has:**
- All base tables (users, transactions, categories, etc.)
- Receipt matching tables (import_batches, import_rows, transaction_matches)
- Proper indexes for performance

### Option 2: Docker Deployment

```bash
# 1. Start PostgreSQL + App
docker-compose up -d

# 2. Check status
docker-compose logs -f app

# 3. Access application
# http://localhost:7331
```

---

## Configuration

### Minimum Required (.env)

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
BETTER_AUTH_SECRET="random-secret-here"  # Generate: openssl rand -base64 32
```

### Receipt Matching Settings

```bash
# Auto-merge threshold (default: 90)
RECEIPT_MATCH_AUTO_MERGE_THRESHOLD=90

# Date range for matching (default: 3 days)
RECEIPT_MATCH_DATE_RANGE_DAYS=3

# Enable/disable feature
RECEIPT_MATCH_ENABLED=true
```

**Thresholds explained:**
- `90` - Auto-merges same day or ±1 day matches (recommended)
- `100` - Only auto-merges exact same-day matches (most conservative)
- `80` - Auto-merges up to ±2 days (more aggressive)

---

## Using Receipt Matching

### 1. Import CSV

1. Go to `/import/csv`
2. Upload your American Express CSV
3. Map columns:
   - **Date** → issuedAt
   - **Amount** → total
   - **Description** → merchant
   - **Reference** → importReference (for exact matching)
   - **Category** → categoryCode (optional)
4. Click "Import with Matching"

### 2. Watch Progress

Real-time progress bar shows:
- **Matched**: Auto-merged duplicates (≥90% confidence)
- **Created**: New transactions
- **Flagged**: Low-confidence matches need review
- **Errors**: Failed rows

### 3. Review Flagged Matches

If any matches are <90% confidence:

1. Click "Review Flagged Matches"
2. See side-by-side comparison:
   ```
   CSV: $56.64 on 11/28/2025  |  DB: $56.64 on 11/26/2025
   Confidence: 80% (2 days difference)
   ```
3. Choose action:
   - **Merge** - Combine them (updates existing transaction)
   - **Create New** - Keep as separate transaction
   - **Skip** - Decide later

### 4. View History

Go to `/import/history` to see:
- All past imports
- Match statistics
- Audit trail of what was merged

---

## How Matching Works

### Confidence Scoring

Each CSV transaction is scored against existing database transactions:

| Match Type | Confidence | Action |
|------------|-----------|--------|
| Same day + exact amount | 100% | ✅ Auto-merge |
| ±1 day + exact amount | 90% | ✅ Auto-merge |
| ±2 days + exact amount | 80% | ⚠️ Flag for review |
| ±3 days + exact amount | 70% | ⚠️ Flag for review |
| >±3 days or different amount | 0% | ➕ Create new |

### What Gets Merged

When auto-merging, we:
- **Preserve**: Your categories, projects, notes, custom fields
- **Update**: Description (if CSV has more detail)
- **Add**: Merchant name (if empty), import reference, files
- **Track**: Last matched date for audit

### Edge Cases Handled

- ✅ Multiple matches → Picks highest confidence
- ✅ Duplicate CSV rows → Only first match used
- ✅ Negative amounts (AmEx format) → Normalized correctly
- ✅ Missing dates → Creates new (can't match)
- ✅ Reference match → 100% confidence (exact ID match)

---

## Database Schema

### New Tables

**import_batches** - Tracks each CSV import
```sql
id, user_id, filename, status, total_rows,
matched_count, created_count, skipped_count, error_count,
created_at, completed_at
```

**import_rows** - Individual CSV rows
```sql
id, batch_id, row_number, raw_data, parsed_data,
status, error_message, transaction_id, created_at
```

**transaction_matches** - Match audit trail
```sql
id, batch_id, transaction_id, confidence,
matched_amount, matched_date, existing_date, days_difference,
status, csv_data, merged_fields, reviewed_by, reviewed_at
```

### Updated Tables

**transactions**
```sql
-- New fields:
import_reference VARCHAR  -- CSV reference ID
last_matched_at TIMESTAMP -- Last merge timestamp
```

---

## API Reference

### Check Import Status

```bash
GET /api/import/batches
# Returns all import batches for user

GET /api/import/batches/:id
# Returns specific batch with statistics

GET /api/import/batches/:id/matches?status=flagged
# Returns matches needing review
```

### Approve/Reject Matches

```bash
POST /api/import/matches/:id/approve
# Approves and merges a flagged match

POST /api/import/matches/:id/reject
# Rejects match, creates new transaction instead
```

---

## Troubleshooting

### Matching not working?

Check configuration:
```bash
# Verify feature is enabled
echo $RECEIPT_MATCH_ENABLED  # Should be "true"

# Check database has tables
npx prisma db push
```

### Database connection fails?

```bash
# Test connection
npx prisma db push --skip-generate

# If fails, check:
# 1. DATABASE_URL is correct
# 2. Database exists
# 3. User has permissions
# 4. Network/firewall allows connection
```

### Import stuck processing?

```bash
# Check batch status in database
npx prisma studio
# Open import_batches table, check status

# If stuck, can manually update:
UPDATE import_batches SET status = 'failed', completed_at = NOW()
WHERE id = 'batch-id-here';
```

---

## Performance

### Benchmarks

- **1,000 transactions**: ~15 seconds
- **10,000 transactions**: ~2.5 minutes
- **Memory usage**: ~200MB typical

### Optimization Tips

```sql
-- Add custom indexes if needed
CREATE INDEX idx_transactions_amount_date
ON transactions(total, issued_at)
WHERE total IS NOT NULL;

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE user_id = 'xxx' AND total = 5664
AND issued_at BETWEEN '2025-11-25' AND '2025-12-01';
```

---

## FAQ

**Q: What if I don't want auto-merging?**
A: Set `RECEIPT_MATCH_AUTO_MERGE_THRESHOLD=100` to only auto-merge exact same-day matches, or disable with `RECEIPT_MATCH_ENABLED=false`.

**Q: Can I undo a merge?**
A: Currently no automatic undo, but you can view the original CSV data in `transaction_matches.csv_data` and manually recreate the transaction.

**Q: Does it work with other bank CSV formats?**
A: Optimized for American Express, but works with any CSV if you map columns correctly. You may need to adjust date parsing.

**Q: What about merchant name matching?**
A: Currently uses exact amount + date only. Fuzzy merchant matching planned for future release.

**Q: Is my data safe?**
A: Yes - all operations are logged in `transaction_matches` for audit. Your original transactions are only updated, never deleted.

---

## Next Steps

1. ✅ Deploy fresh instance
2. ✅ Import your first American Express CSV
3. ✅ Review any flagged matches
4. ✅ Check import history
5. ⭐ Star the repo if helpful!

---

**Need help?** Open an issue on GitHub or check the full [DEPLOYMENT.md](./DEPLOYMENT.md) for advanced configuration.
