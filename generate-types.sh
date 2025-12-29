#!/bin/bash

# Helper script to generate TypeScript types from FastAPI OpenAPI spec
# This script handles both the backend OpenAPI generation and frontend type generation

set -e  # Exit on error

echo "🔧 Generating TypeScript types from FastAPI..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Generate OpenAPI spec from FastAPI
echo -e "${BLUE}Step 1:${NC} Generating OpenAPI specification from FastAPI..."
cd backend

# Try to find Python in different locations
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif [ -f "venv/bin/python3" ]; then
    PYTHON_CMD=venv/bin/python3
elif [ -f "venv/bin/python" ]; then
    PYTHON_CMD=venv/bin/python
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo -e "${RED}Error: Python not found!${NC}"
    echo "Please install Python or activate your virtual environment."
    exit 1
fi

echo "Using Python: $PYTHON_CMD"

# Check if FastAPI is installed
if ! $PYTHON_CMD -c "import fastapi" 2>/dev/null; then
    echo -e "${RED}Error: FastAPI not installed!${NC}"
    echo "Please run: pip install fastapi uvicorn pydantic"
    exit 1
fi

# Generate OpenAPI spec
$PYTHON_CMD generate_openapi.py

if [ ! -f "openapi.json" ]; then
    echo -e "${RED}Error: OpenAPI spec generation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} OpenAPI spec generated successfully"
echo ""

# Step 2: Generate TypeScript types
echo -e "${BLUE}Step 2:${NC} Generating TypeScript types..."
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "node_modules not found. Running npm install..."
    npm install
fi

# Generate types
npm run generate:types

if [ ! -f "src/types/api.ts" ]; then
    echo -e "${RED}Error: TypeScript type generation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} TypeScript types generated successfully"
echo ""

# Step 3: Show summary
echo -e "${GREEN}🎉 Type generation complete!${NC}"
echo ""
echo "Files generated:"
echo "  📄 backend/openapi.json"
echo "  📄 frontend/src/types/api.ts"
echo ""
echo "Usage example:"
echo "  import type { components } from './types/api';"
echo "  type TrainingRequest = components['schemas']['DecisionTreeTrainingRequest'];"
echo ""
echo "See frontend/src/types/README.md for more examples."
