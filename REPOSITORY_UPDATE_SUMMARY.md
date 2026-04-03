# Repository References Updated

All references to the original repository have been updated to point to your fork:
**wingertandrew/Expensing**

## Files Updated

### Docker Compose Files ✅

1. **`docker-compose.yml`**
   - Changed: `ghcr.io/vas3k/taxhacker:latest` → `ghcr.io/wingertandrew/expensing:latest`

2. **`docker-compose.production.yml`**
   - Changed: `ghcr.io/vas3k/taxhacker:latest` → `ghcr.io/wingertandrew/expensing:latest`

3. **`portainer-stack.yml`**
   - Changed: `ghcr.io/vas3k/taxhacker:latest` → `ghcr.io/wingertandrew/expensing:latest`

### README.md Updates ✅

1. **GitHub Badges** (lines 9-11)
   - Stars badge: `vas3k/TaxHacker` → `wingertandrew/Expensing`
   - License badge: `vas3k/TaxHacker` → `wingertandrew/Expensing`
   - Issues badge: `vas3k/TaxHacker` → `wingertandrew/Expensing`

2. **Docker Compose Download** (line 130)
   - Changed: `https://raw.githubusercontent.com/vas3k/TaxHacker/main/docker-compose.yml`
   - To: `https://raw.githubusercontent.com/wingertandrew/Expensing/main/docker-compose.yml`

3. **Example Configuration** (line 152)
   - Changed: `ghcr.io/vas3k/taxhacker:latest`
   - To: `ghcr.io/wingertandrew/expensing:latest`

4. **Git Clone Command** (line 205)
   - Changed: `git clone https://github.com/vas3k/TaxHacker.git`
   - To: `git clone https://github.com/wingertandrew/Expensing.git`
   - Changed directory: `cd TaxHacker` → `cd Expensing`

5. **PRs Welcome Badge** (line 249)
   - Changed: `https://github.com/vas3k/TaxHacker/pulls`
   - To: `https://github.com/wingertandrew/Expensing/pulls`

## Files NOT Updated (Intentionally)

The following files still reference the original repository for **attribution/credit purposes**:

- `docs/migrate-0.3-0.5.md` - Migration documentation
- `components/dashboard/welcome-widget.tsx` - UI component (may show credits)
- `app/landing/landing.tsx` - Landing page (may show credits)

These files likely contain references for giving credit to the original author, which is appropriate for a fork.

## Important: GitHub Container Registry

For the Docker images to work, you'll need to:

1. **Set up GitHub Actions** to build and publish Docker images to GitHub Container Registry (GHCR)
2. **Configure GitHub Packages** permissions for your repository
3. **Create a workflow** that builds and pushes to `ghcr.io/wingertandrew/expensing:latest`

### Example GitHub Actions Workflow

Create `.github/workflows/docker-publish.yml`:

```yaml
name: Build and Publish Docker Image

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to the Container registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

## Verification Checklist

- [x] All docker-compose files updated
- [x] README.md badges updated
- [x] README.md installation commands updated
- [x] README.md examples updated
- [ ] GitHub Actions workflow created (if needed)
- [ ] Docker images published to GHCR
- [ ] Test deployment with new image reference

## Testing the Changes

### Test Local Deployment

```bash
# Pull the new image (once published)
docker pull ghcr.io/wingertandrew/expensing:latest

# Run with docker-compose
docker compose up -d

# Verify it's running
docker ps
curl http://localhost:7331/api/health
```

### Test Portainer Deployment

1. Copy the updated `portainer-stack.yml`
2. Create a new stack in Portainer
3. Paste the configuration
4. Deploy and verify

## Summary

✅ **All critical references updated** to `wingertandrew/Expensing`
✅ **Docker images** now point to `ghcr.io/wingertandrew/expensing:latest`
✅ **Repository ready** for deployment once Docker images are published

**Next Step:** Set up GitHub Actions to automatically build and publish Docker images to your GitHub Container Registry.
