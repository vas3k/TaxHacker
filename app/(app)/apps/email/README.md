# Email Server Monitor

This app allows you to connect to email servers and automatically monitor incoming emails for file attachments that can be processed by TaxHacker.

## 🔧 **Setup**

### 1. Add Email Server
1. Go to **Apps → Email Server Monitor**
2. Click **"Add Server"**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Enter your email and app password
5. Choose a sync frequency (default: Hourly — options range from every 15 minutes to daily)
6. Set allowed file extensions (default: `.pdf`, `.jpg`, `.jpeg`, `.png`)

### 2. Email Provider Settings

#### Gmail
- **Host**: `imap.gmail.com`
- **Port**: `993` (SSL)
- **Note**: You need to use an **App Password**, not your regular password
- **Setup**: Go to Google Account → Security → 2-Step Verification → App Passwords

#### Outlook/Hotmail
- **Host**: `outlook.office365.com`
- **Port**: `993` (SSL)
- **Note**: You may need to enable IMAP in Outlook settings

#### Apple iCloud
- **Host**: `imap.mail.me.com`
- **Port**: `993` (SSL)
- **Note**: You need to use an **App-Specific Password**

#### Other Providers
- Choose "Custom IMAP" and enter your provider's IMAP settings

## ⚙️ **How It Works**

### Automatic Sync
- **Cron Job**: A heartbeat fires every 5 minutes, but each server is only synced once its per-server **Sync frequency** (set in the UI, 15 min – daily) has elapsed (the app throttles; a manual "Sync Now" bypasses it). The 5-minute heartbeat is the resolution floor — the per-mailbox frequency is the real cadence.
- **File Processing**: Only downloads attachments with allowed extensions
- **Duplication Prevention**: Tracks highest processed IMAP UID per server; mail is fetched read-only and never marked as read
- **Status Updates**: Updates server status and last sync time

### Manual Sync
- **"Sync Now" Button**: Trigger immediate sync from the UI
- **API Endpoint**: `POST /api/email/sync` for programmatic access
- **Independent Script**: `npm run email:sync` can be run manually

## 🐳 **Docker Setup**

The email sync runs as a separate Docker container with cron:

```yaml
# docker-compose.yml
email-sync:
  image: ghcr.io/vas3k/taxhacker:latest
  volumes:
    - ./data:/app/data
    - ./etc/crontab:/etc/cron.d/email-sync:ro
  environment:
    - DATABASE_URL=postgresql://...
    # Must match the app's secret — it derives the key that decrypts stored mailbox passwords.
    - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
  command: >
    sh -c "... && printenv | grep -E '^(DATABASE_URL|BETTER_AUTH_SECRET|...)=' > /etc/cron.env && cron && tail -f /var/log/email-sync.log"
```

### Cron Configuration
File: `etc/crontab`
```bash
# Heartbeat every 5 minutes; runEmailSync honors each mailbox's UI sync frequency before fetching.
# Cron jobs don't inherit the container env, so we source /etc/cron.env (written at container start).
*/5 * * * * set -a; . /etc/cron.env; cd /app && npm run email:sync >> /var/log/email-sync.log 2>&1
```

> **Env propagation:** cron strips the environment, so the container's startup command dumps the
> needed vars to `/etc/cron.env` and each job sources it. `BETTER_AUTH_SECRET` **must** match the
> app's — otherwise stored mailbox passwords can't be decrypted and every sync fails.

## 📊 **Data Storage**

### Email Servers
- Stored in `appData` table with `app = 'email'`
- Each user can have multiple email servers
- Settings include sync interval, file extensions, credentials

### Downloaded Files  
- Saved to `UPLOAD_PATH` directory
- Created as `File` records in database
- Metadata includes email details (subject, sender, date)
- Source marked as `'email'` for tracking

### Sync Status
- `lastSyncedAt`: When server was last checked
- `lastProcessedUid`: Highest IMAP UID processed per server (prevents duplicates; mail is never marked as read)
- `status`: `connected`, `error`, `pending`, `paused`

## 🔧 **Commands**

```bash
# Manual sync (run once)
npm run email:sync

# View logs
docker logs taxhacker_email_sync

# Check cron status
docker exec taxhacker_email_sync crontab -l
```

## 🚨 **Troubleshooting**

### Authentication Issues
- **Gmail**: Make sure you're using an App Password, not your regular password
- **Outlook**: Enable IMAP access in settings
- **2FA**: Most providers require app-specific passwords when 2FA is enabled

### Connection Issues
- Check firewall settings for IMAP ports (usually 993 or 143)
- Verify server settings match your provider's documentation
- Test connection using "Test Connection" button

### No Emails Found
- Check if the sync frequency has elapsed since the last sync
- Verify the mailbox has new messages (above the last processed UID) carrying attachments — fetch is read-only and does not depend on unread status
- Check allowed file extensions match your attachments
- Review logs: `docker logs taxhacker_email_sync`

### Performance
- Default sync frequency is Hourly — pick a shorter one (down to every 15 min) in the UI if needed
- Large attachments may take time to download
- Monitor storage usage for attachment files

## 📝 **Logs**

Email sync logs are available:
- **Container logs**: `docker logs taxhacker_email_sync`
- **Cron logs**: `/var/log/email-sync.log` inside container
- **Manual sync**: Output shown in terminal when running `npm run email:sync`

## 🔒 **Security**

- **Passwords**: Stored **encrypted at rest (AES-256-GCM)**, with the key derived from the `BETTER_AUTH_SECRET` environment variable. Decrypted only at sync/connection-test time.
  - ⚠️ **Rotating `BETTER_AUTH_SECRET` invalidates stored mailbox passwords.** After changing it, re-enter each server's password (the server shows a decryption error until you do).
- **IMAP SSL**: Enabled by default for all preset providers
- **Access Control**: Each user can only access their own email servers
- **App Passwords**: Recommended for all providers supporting them 