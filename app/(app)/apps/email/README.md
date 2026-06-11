# Email Server Monitor

This app allows you to connect to email servers and automatically monitor incoming emails for file attachments that can be processed by TaxHacker.

## 🔧 **Setup**

### 1. Add Email Server
1. Go to **Apps → Email Server Monitor**
2. Click **"Add Server"**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Enter your email and app password
5. Configure sync interval (default: 1 hour)
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
- **Cron Job**: Runs every hour (configurable per server)
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
  command: > 
    sh -c "cron && tail -f /var/log/email-sync.log"
```

### Cron Configuration
File: `etc/crontab`
```bash
# Run every hour
0 * * * * cd /app && npm run email:sync >> /var/log/email-sync.log 2>&1
```

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
- Check if sync interval has passed since last sync
- Verify email server has new unread emails
- Check allowed file extensions match your attachments
- Review logs: `docker logs taxhacker_email_sync`

### Performance
- Default sync interval is 1 hour - reduce if needed
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