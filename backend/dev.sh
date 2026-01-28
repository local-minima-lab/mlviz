#!/bin/bash

# MLviz Backend Development Helper Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

command="$1"

case "$command" in
    install)
        echo -e "${BLUE}📦 Installing dependencies with uv...${NC}"
        uv pip install -e .
        echo -e "${GREEN}✅ Dependencies installed${NC}"
        ;;

    dev)
        echo -e "${BLUE}🚀 Starting development server...${NC}"
        uvicorn app:app --reload --host 0.0.0.0 --port 8000
        ;;

    prod)
        echo -e "${BLUE}🚀 Starting production server...${NC}"
        uvicorn app:app --host 0.0.0.0 --port 8080
        ;;

    docker-build)
        echo -e "${BLUE}🐳 Building Docker image...${NC}"
        docker build -t mlviz-backend .
        echo -e "${GREEN}✅ Docker image built${NC}"
        ;;

    docker-run)
        echo -e "${BLUE}🐳 Running Docker container...${NC}"
        docker run -p 8080:8080 \
            -e DEBUG=true \
            -e FRONTEND_URL=http://localhost:5173 \
            mlviz-backend
        ;;

    test)
        echo -e "${BLUE}🧪 Running tests...${NC}"
        pytest
        ;;

    clean)
        echo -e "${BLUE}🧹 Cleaning cache files...${NC}"
        find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
        find . -type f -name "*.pyc" -delete 2>/dev/null || true
        echo -e "${GREEN}✅ Cache cleaned${NC}"
        ;;

    *)
        echo -e "${BLUE}MLviz Backend Development Helper${NC}"
        echo ""
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  install        Install dependencies with uv"
        echo "  dev            Run development server (port 8000)"
        echo "  prod           Run production server (port 8080)"
        echo "  docker-build   Build Docker image"
        echo "  docker-run     Run Docker container"
        echo "  test           Run tests"
        echo "  clean          Clean Python cache files"
        echo ""
        echo "Examples:"
        echo "  ./dev.sh install"
        echo "  ./dev.sh dev"
        ;;
esac
