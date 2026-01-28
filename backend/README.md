# MLviz Backend

> AI generated. Verification to be done later.

FastAPI backend for ML model training and visualization.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies with uv
uv pip install -e .

# Run the server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Visit:

-   API Docs: http://localhost:8000/docs
-   Health Check: http://localhost:8000/health

### Docker

```bash
# Build
docker build -t mlviz-backend .

# Run
docker run -p 8080:8080 \
  -e FRONTEND_URL=http://localhost:5173 \
  mlviz-backend
```

## 📦 Project Structure

```
backend/
├── api/              # API routes
│   ├── decision_tree.py
│   ├── dataset.py
│   └── knn.py
├── core/            # Core configuration
│   └── config.py
├── models/          # Data models
├── services/        # Business logic
├── app.py           # FastAPI application
├── Dockerfile       # Container image
└── pyproject.toml   # Dependencies (uv)
```

## 🌐 API Endpoints

### Decision Tree

-   `POST /api/dt/train` - Train a decision tree model
-   `POST /api/dt/predict` - Make predictions
-   `GET /api/dt/visualize` - Get tree visualization

### K-Nearest Neighbors

-   `POST /api/knn/train` - Train a KNN model
-   `POST /api/knn/predict` - Make predictions
-   `GET /api/knn/visualize` - Get KNN visualization

### Dataset

-   `GET /api/dataset/list` - List available datasets
-   `POST /api/dataset/upload` - Upload custom dataset
-   `GET /api/dataset/{id}` - Get dataset details

## 🔧 Configuration

Environment variables (set in `.env` or Cloud Run):

```bash
# Application
DEBUG=true
APP_NAME=MLviz
VERSION=1.0.0

# CORS
FRONTEND_URL=https://your-frontend-url.app

# Server
HOST=0.0.0.0
PORT=8000
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Cloud Run

```bash
# Using GitHub Actions (recommended)
git push origin main

# Or manually
gcloud builds submit --tag gcr.io/PROJECT_ID/mlviz-backend
gcloud run deploy mlviz-backend \
  --image gcr.io/PROJECT_ID/mlviz-backend \
  --region asia-southeast1
```

## 🧪 Testing

```bash
# Install dev dependencies
uv pip install -e ".[dev]"

# Run tests
pytest

# Test with httpx
pytest tests/test_api.py -v
```

## 📚 Tech Stack

-   **Framework**: FastAPI
-   **Package Manager**: uv
-   **ML Libraries**: scikit-learn, pandas, numpy
-   **Deployment**: Google Cloud Run
-   **Container**: Docker

## 🔗 Links

-   [Frontend Repository](../frontend)
-   [API Documentation](https://your-backend-url.run.app/docs)
-   [Deployment Guide](./DEPLOYMENT.md)
