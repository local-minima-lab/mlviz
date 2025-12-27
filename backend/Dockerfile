# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_SYSTEM_PYTHON=1 \
    PORT=8080

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies using uv (much faster than pip)
RUN uv pip install --system --no-cache -r pyproject.toml

# Copy application code
COPY . .

# Expose the port Cloud Run expects
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')"

# Run the application
# Cloud Run sets the PORT environment variable, default to 8080
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT}
