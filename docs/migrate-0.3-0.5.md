# How to migrate data from v0.3 to v0.5

In v0.5 we changed the database from SQLite to Postgres. Because of this, it was not possible to seamlessly migrate data from one database to another and you will have to do it yourself.

Don't worry, even if you already upgraded — your data is not lost!

Here's how to migrate properly:

## Step 1: Update your docker-compose to v0.3.0

```yaml
services:
  app:
    image: ghcr.io/vas3k/taxhacker:v0.3.0
    ports:
      - "7331:7331"
      
// everything else stays the same
```

## Step 2: Restart your app and make a backup

```yaml
docker compose down
docker compose up -d
```

Go to your app -> Settings -> Backups -> Download Data Archive

Save .zip archive on your machine. 

## Step 3: Upgrade your TaxHacker instance

Update your docker compose to latest version again.

```yaml
services:
  app:
    image: ghcr.io/vas3k/taxhacker:latest
    ports:
      - "7331:7331"
      
// everything else stays the same
```

Restart again.

## Step 4: Upload your data to the new instance

Open your app -> Settings -> Backups -> Restore from a backup

Upload your zip archive and click restore. After couple of seconds it must show you import stats.

If import fails with an error about file size, go to [next.config.ts](./next.config.ts) and change `bodySizeLimit: "256mb"` to something bigger.
