#!/bin/sh
set -e

printenv | grep -E '^(DATABASE_URL|BETTER_AUTH_SECRET|UPLOAD_PATH|NODE_ENV|SELF_HOSTED_MODE|BASE_URL|PATH)=' > /etc/cron.env
chmod 0644 /etc/cron.env

cp /mnt/crontab /tmp/crontab
chmod 0644 /tmp/crontab
crontab /tmp/crontab

touch /var/log/cron.log
cron
exec tail -F /var/log/cron.log
