#!/bin/bash

# Test Docker Build Script for Frontend
# This script builds and runs the frontend Docker container locally for testing

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="mlviz-frontend-test"
CONTAINER_NAME="mlviz-frontend-container"
PORT=5173
BACKEND_URL="https://backend-124236563415.asia-southeast1.run.app"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  MLViz Frontend - Docker Build Test${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Stop and remove existing container if it exists
echo -e "${YELLOW}→${NC} Cleaning up existing containers..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Remove existing image if it exists
echo -e "${YELLOW}→${NC} Removing old image..."
docker rmi $IMAGE_NAME 2>/dev/null || true

# Build the Docker image
echo -e "${YELLOW}→${NC} Building Docker image..."
echo -e "   Backend URL: ${GREEN}${BACKEND_URL}${NC}"
docker build \
  --build-arg VITE_API_BASE_URL=$BACKEND_URL \
  -t $IMAGE_NAME \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Docker image built successfully"
else
  echo -e "${RED}✗${NC} Docker build failed"
  exit 1
fi

# Run the container
echo -e "${YELLOW}→${NC} Starting container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:8080 \
  $IMAGE_NAME

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Container started successfully"
else
  echo -e "${RED}✗${NC} Failed to start container"
  exit 1
fi

# Wait for container to be ready
echo -e "${YELLOW}→${NC} Waiting for container to be ready..."
sleep 3

# Test health endpoint
echo -e "${YELLOW}→${NC} Testing health endpoint..."
if curl -f -s http://localhost:$PORT/health > /dev/null; then
  echo -e "${GREEN}✓${NC} Health check passed"
else
  echo -e "${RED}✗${NC} Health check failed"
  docker logs $CONTAINER_NAME
  exit 1
fi

# Test main page
echo -e "${YELLOW}→${NC} Testing main page..."
if curl -f -s http://localhost:$PORT/ > /dev/null; then
  echo -e "${GREEN}✓${NC} Main page accessible"
else
  echo -e "${RED}✗${NC} Main page not accessible"
  docker logs $CONTAINER_NAME
  exit 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ All tests passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Access the application at:${NC}"
echo -e "  ${GREEN}http://localhost:$PORT${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  View logs:      ${YELLOW}docker logs -f $CONTAINER_NAME${NC}"
echo -e "  Stop container: ${YELLOW}docker stop $CONTAINER_NAME${NC}"
echo -e "  Remove container: ${YELLOW}docker rm $CONTAINER_NAME${NC}"
echo -e "  Shell access:   ${YELLOW}docker exec -it $CONTAINER_NAME sh${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop watching logs${NC}"
echo ""

# Follow logs
docker logs -f $CONTAINER_NAME
