from typing import List
from fastapi import APIRouter, HTTPException
from .models import (
    KNNPredictionRequest,
    KNNPredictionResponse,
    KNNVisualisationRequest,
    KNNVisualisationResponse,
    ParameterInfo,
)
from services import knn_service

router = APIRouter()


@router.get("/params", response_model=List[ParameterInfo])
async def get_parameters() -> List[ParameterInfo]:
    """Get the parameters for KNN.

    Returns:
        List[ParameterInfo]: List of parameters for KNN
    """
    params_config = await knn_service.get_parameters()
    return params_config


@router.post("/predict", response_model=KNNPredictionResponse)
async def predict(
    request: KNNPredictionRequest,
) -> KNNPredictionResponse:
    """Make KNN predictions with visualization data.

    KNN is a lazy learner - no training phase needed. This endpoint
    fits the model on the provided dataset and makes predictions
    for the query points, returning neighbor information and
    decision boundary data for visualization.

    Args:
        request (KNNPredictionRequest): Prediction request with parameters,
            dataset, and query points

    Raises:
        HTTPException: If prediction fails

    Returns:
        KNNPredictionResponse: Predictions, neighbor info, and visualization data
    """
    try:
        result = await knn_service.predict(
            parameters=request.parameters,
            dataset_param=request.dataset,
            query_points=request.query_points,
            visualisation_features=request.visualisation_features,
            include_boundary=request.include_boundary,
            boundary_resolution=request.boundary_resolution,
        )
        return KNNPredictionResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/visualise", response_model=KNNVisualisationResponse)
async def visualise(
    request: KNNVisualisationRequest,
) -> KNNVisualisationResponse:
    """Get KNN visualisation data without making predictions.

    This endpoint is useful for visualising the training dataset
    with decision boundaries BEFORE making any predictions. It returns
    all training points and the decision boundary based on KNN parameters,
    but does not require any query points.

    Use cases:
    - Initial dataset exploration
    - Understanding how K affects decision boundaries
    - Visualising feature spaces before prediction

    Args:
        request (KNNVisualisationRequest): Visualisation request with parameters
            and dataset

    Raises:
        HTTPException: If visualisation generation fails

    Returns:
        KNNVisualisationResponse: Training data, decision boundary, and metadata
    """
    try:
        print(request)
        result = await knn_service.visualise(
            parameters=request.parameters,
            dataset_param=request.dataset,
            visualisation_features=request.visualisation_features,
            include_boundary=request.include_boundary,
            boundary_resolution=request.boundary_resolution,
        )
        return KNNVisualisationResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
