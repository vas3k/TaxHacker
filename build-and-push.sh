#!/bin/bash
set -e

# Build and Push Docker Image to GitHub Container Registry
# Usage: ./build-and-push.sh [tag]
# Example: ./build-and-push.sh latest
# Example: ./build-and-push.sh v0.5.5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_USERNAME="wingertandrew"
IMAGE_NAME="expensing"
REGISTRY="ghcr.io"
TAG="${1:-latest}"

FULL_IMAGE_NAME="${REGISTRY}/${GITHUB_USERNAME}/${IMAGE_NAME}:${TAG}"

echo -e "${BLUE}🚀 Building and pushing Docker image${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Registry: ${REGISTRY}"
echo -e "Username: ${GITHUB_USERNAME}"
echo -e "Image: ${IMAGE_NAME}"
echo -e "Tag: ${TAG}"
echo -e "Full name: ${FULL_IMAGE_NAME}"
echo ""

# Check if CR_PAT is set
if [ -z "$CR_PAT" ]; then
    echo -e "${RED}❌ Error: CR_PAT environment variable is not set${NC}"
    echo ""
    echo -e "${YELLOW}To create a GitHub Personal Access Token (PAT):${NC}"
    echo "1. Go to https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Give it a name like 'GHCR Push Access'"
    echo "4. Select scopes:"
    echo "   ✓ write:packages"
    echo "   ✓ read:packages"
    echo "   ✓ delete:packages (optional)"
    echo "5. Click 'Generate token'"
    echo "6. Copy the token and run:"
    echo ""
    echo -e "${GREEN}export CR_PAT=YOUR_TOKEN_HERE${NC}"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Step 1: Build the Docker image
echo -e "${BLUE}📦 Step 1/4: Building Docker image...${NC}"
docker build \
    --platform linux/amd64,linux/arm64 \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    -t "${FULL_IMAGE_NAME}" \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 2: Login to GitHub Container Registry
echo ""
echo -e "${BLUE}🔐 Step 2/4: Logging in to GitHub Container Registry...${NC}"
echo "$CR_PAT" | docker login ghcr.io -u "${GITHUB_USERNAME}" --password-stdin

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
else
    echo -e "${RED}❌ Login failed${NC}"
    exit 1
fi

# Step 3: Push the image
echo ""
echo -e "${BLUE}⬆️  Step 3/4: Pushing image to registry...${NC}"
docker push "${FULL_IMAGE_NAME}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Push successful${NC}"
else
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
fi

# Step 4: Verify the image
echo ""
echo -e "${BLUE}🔍 Step 4/4: Verifying image...${NC}"
echo "Image details:"
docker images | grep "${IMAGE_NAME}" | grep "${TAG}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Success! Image pushed to GitHub Container Registry${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Image URL: ${FULL_IMAGE_NAME}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Make the package public (if needed):"
echo "   https://github.com/users/${GITHUB_USERNAME}/packages/container/${IMAGE_NAME}/settings"
echo ""
echo "2. Test pulling the image:"
echo -e "   ${GREEN}docker pull ${FULL_IMAGE_NAME}${NC}"
echo ""
echo "3. Deploy with docker-compose:"
echo -e "   ${GREEN}docker-compose pull && docker-compose up -d${NC}"
echo ""
