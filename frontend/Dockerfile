# Multi-stage build for optimized production deployment
# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL (passed from GitHub Actions)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build argument for backend URL (for nginx proxy)
ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}

# Debug: Print the environment variable values
RUN echo "Building with VITE_API_BASE_URL=${VITE_API_BASE_URL}"
RUN echo "Building with BACKEND_URL=${BACKEND_URL}"

# Build the application
RUN npm run build

# Stage 2: Production server with nginx
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Set environment variable for backend URL (will be passed at runtime)
ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL}

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Create startup script to substitute environment variables
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'envsubst "\$BACKEND_URL" < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Start nginx with environment variable substitution
CMD ["/docker-entrypoint.sh"]
