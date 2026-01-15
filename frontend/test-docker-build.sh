#!/bin/bash
# Script to test the Docker build locally with backend URL injection

set -e

echo "🔨 Building Docker image with backend URL..."

# Build the Docker image with both build arguments
docker build \
  --build-arg VITE_API_BASE_URL=https://backend-124236563415.asia-southeast1.run.app \
  --build-arg BACKEND_URL=https://backend-124236563415.asia-southeast1.run.app \
  -t mlviz-frontend-test \
  .

echo "✅ Build complete!"
echo ""
echo "🚀 Starting container on port 8080..."

# Run the container with the backend URL environment variable
docker run -d \
  --name mlviz-frontend-test \
  -p 8080:8080 \
  -e BACKEND_URL=https://backend-124236563415.asia-southeast1.run.app \
  mlviz-frontend-test

echo "✅ Container started!"
echo ""
echo "📋 Testing endpoints..."
sleep 3

# Test the health endpoint
echo "Testing /health endpoint..."
curl -s http://localhost:8080/health
echo ""

# Test that the main page loads
echo "Testing main page..."
HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:8080/)
if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Main page loads (HTTP $HTTP_CODE)"
else
  echo "❌ Main page failed (HTTP $HTTP_CODE)"
fi

echo ""
echo "🔍 Checking nginx configuration..."
docker exec mlviz-frontend-test cat /etc/nginx/conf.d/default.conf | grep -A 5 "location /api"

echo ""
echo "📊 Container logs:"
docker logs mlviz-frontend-test

echo ""
echo "🧹 Cleanup: Run 'docker stop mlviz-frontend-test && docker rm mlviz-frontend-test' when done testing"
echo "🌐 Visit http://localhost:8080 in your browser to test"
