# TaxHacker Deployment Guide

Complete guide to deploying TaxHacker with built-in receipt matching.

## Quick Start (Docker - Recommended)

The easiest way to deploy TaxHacker is using Docker Compose:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd TaxHacker

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# 3. Generate auth secret
openssl rand -base64 32  # Copy this to BETTER_AUTH_SECRET in .env

# 4. Start the application
docker-compose up -d

# 5. Check status
docker-compose ps
docker-compose logs -f app
```

**That's it!** TaxHacker is now running at http://localhost:3000

### First-Time Setup

After starting the containers:

```bash
# Create your first admin user
# Visit http://localhost:3000 and sign up
```

## Configuration

### Required Settings

Edit `.env` and configure these **required** settings:

```bash
# Database credentials (change these!)
DB_PASSWORD=your-secure-password-here

# Auth secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret-here

# Public URL (change in production)
BETTER_AUTH_URL=https://yourdomain.com
```

### Optional Settings

**Email** (for user verification):
```bash
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com
```

**AI Integration** (for automatic receipt OCR):
```bash
OPENAI_API_KEY=sk-xxxxx
```

**Stripe** (for payments):
```bash
STRIPE_SECRET_KEY=sk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Receipt Matching** (customize behavior):
```bash
RECEIPT_MATCH_AUTO_MERGE_THRESHOLD=90  # 0-100 confidence score
RECEIPT_MATCH_DATE_RANGE_DAYS=3        # ±N days for matching
```

## Production Deployment

### 1. Using Docker on VPS/Cloud

**Prepare your server:**
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone and configure
git clone <your-repo-url>
cd TaxHacker
cp .env.example .env
nano .env  # Configure for production
```

**Deploy:**
```bash
# Build and start
docker-compose up -d

# Setup reverse proxy (nginx)
sudo apt install nginx
sudo nano /etc/nginx/sites-available/taxhacker
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable SSL with Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 2. Using Vercel + Managed Database

**Prerequisites:**
- Vercel account
- PostgreSQL database (e.g., Neon, Supabase, Railway)

**Deploy:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Environment Variables in Vercel:**
- Go to Project Settings → Environment Variables
- Add all variables from `.env.example`
- Set `DATABASE_URL` to your managed database URL

### 3. Using AWS/GCP/Azure

**EC2/Compute Engine/VM:**
1. Launch instance (Ubuntu 22.04 LTS recommended)
2. Install Docker: `curl -fsSL https://get.docker.com | sh`
3. Clone repo and follow VPS instructions above
4. Configure security groups to allow port 80/443

**Container Services (ECS/Cloud Run/Container Instances):**
1. Build image: `docker build -t taxhacker .`
2. Push to registry (ECR/GCR/ACR)
3. Deploy container with environment variables
4. Connect to managed PostgreSQL (RDS/Cloud SQL/Azure Database)

## Database Management

### Backup

```bash
# Backup database
docker-compose exec postgres pg_dump -U taxhacker taxhacker > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U taxhacker taxhacker
```

### Migrations

```bash
# Run migrations manually
docker-compose exec app npx prisma migrate deploy

# Check migration status
docker-compose exec app npx prisma migrate status
```

### Reset Database (⚠️ Destroys all data!)

```bash
docker-compose down -v  # Removes volumes
docker-compose up -d     # Starts fresh
```

## Monitoring

### Check Application Status

```bash
# View logs
docker-compose logs -f app

# Check health
curl http://localhost:3000/api/health

# Container stats
docker stats taxhacker-app taxhacker-db
```

### Database Performance

```bash
# Connect to database
docker-compose exec postgres psql -U taxhacker

# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check database connectivity
docker-compose exec app npx prisma db push --skip-generate
```

### Database connection issues

```bash
# Test connection
docker-compose exec postgres psql -U taxhacker -d taxhacker -c "SELECT version();"

# Check if database exists
docker-compose exec postgres psql -U taxhacker -l
```

### Reset everything

```bash
# Nuclear option - removes all data
docker-compose down -v
docker-compose up -d
```

## Updating

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose build --no-cache

# Restart with new version
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy
```

## Scaling

### Horizontal Scaling (Multiple App Instances)

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
    # ... rest of config
```

Add load balancer (nginx/Traefik) in front of app instances.

### Database Scaling

For high load:
- Use managed PostgreSQL with read replicas
- Configure connection pooling (PgBouncer)
- Enable query caching

## Security Checklist

- [ ] Change default database password
- [ ] Generate strong `BETTER_AUTH_SECRET`
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall (only allow 80/443)
- [ ] Enable automatic backups
- [ ] Update `BETTER_AUTH_URL` to production domain
- [ ] Rotate API keys regularly
- [ ] Monitor logs for suspicious activity
- [ ] Keep Docker images updated

## Performance Tuning

### Database

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_transactions_user_date
ON transactions(user_id, issued_at DESC);

CREATE INDEX CONCURRENTLY idx_import_batches_user_created
ON import_batches(user_id, created_at DESC);
```

### Application

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096"

# Enable Next.js cache
NEXT_CACHE_TTL=3600
```

## Support

- Documentation: [GitHub Wiki]
- Issues: [GitHub Issues]
- Email: support@yourdomain.com

---

## Receipt Matching Feature

### How It Works

1. **Upload CSV** (American Express format)
2. **Auto-Matching**: Finds existing transactions by:
   - Exact amount match
   - Date within ±3 days
   - Confidence score calculated (0-100%)
3. **Auto-Merge**: Transactions with ≥90% confidence are automatically merged
4. **Manual Review**: <90% confidence matches are flagged for review
5. **Audit Trail**: All matches tracked in `transaction_matches` table

### Importing CSVs

```bash
# Via Web UI
1. Go to /import/csv
2. Upload your American Express CSV
3. Map columns (auto-detected)
4. Click "Import with Matching"
5. View real-time progress
6. Review flagged matches (if any)
```

### CSV Format (American Express)

Expected columns:
- Date (MM/DD/YYYY)
- Amount (negative for charges)
- Description (merchant name)
- Reference (unique transaction ID)
- Category (optional)

### Viewing Import History

```bash
# Navigate to /import/history
- See all imports
- View match statistics
- Review and approve flagged matches
```

### Configuration

Customize matching behavior in `.env`:

```bash
# Auto-merge only same-day matches (more conservative)
RECEIPT_MATCH_AUTO_MERGE_THRESHOLD=100

# Wider date range for matching
RECEIPT_MATCH_DATE_RANGE_DAYS=7

# Disable matching (import all as new)
RECEIPT_MATCH_ENABLED=false
```

---

**Ready to deploy!** 🚀

For questions or issues, open a GitHub issue or contact support.
