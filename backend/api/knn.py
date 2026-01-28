from typing import List
from fastapi import APIRouter, HTTPException
from .models import (
    KNNPredictionRequest,
    KNNPredictionResponse,
    KNNVisualisationRequest,
    KNNVisualisationResponse,
    KNNTrainingRequest,
    KNNTrainingResponse,
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
        
        # Parse visualisation_features if it's a string (from frontend form)
        viz_features = request.visualisation_features
        if isinstance(viz_features, str):
            import json
            try:
                viz_features = json.loads(viz_features)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid visualisation_features format: {viz_features}. Expected array like [0, 1]"
                )
        
        result = await knn_service.visualise(
            parameters=request.parameters,
            dataset_param=request.dataset,
            visualisation_features=viz_features,
            include_boundary=request.include_boundary,
            boundary_resolution=request.boundary_resolution,
        )
        return KNNVisualisationResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/train", response_model=KNNTrainingResponse)
async def train(
    request: KNNTrainingRequest,
) -> KNNTrainingResponse:
    """Train KNN and return visualization data with evaluation metrics.
    
    This endpoint:
    1. Splits dataset into train/test sets (80/20)
    2. Trains KNN on training set
    3. Evaluates on test set (confusion matrix + scores)
    4. Generates visualization data (decision boundary, etc.)
    
    Use this endpoint for TrainPage to get both visualization and metrics.
    Use /visualise for VizOnlyPage (no metrics needed).
    
    Args:
        request: Training request with parameters and dataset
        
    Raises:
        HTTPException: If training fails
        
    Returns:
        KNNTrainingResponse: Visualization data + evaluation metrics
    """
    try:
        # Convert feature_1 and feature_2 from parameters into visualisation_features array
        viz_features = request.visualisation_features
        
        # If visualisation_features not provided, build from feature_1/feature_2 in parameters
        if viz_features is None:
            params_dict = request.parameters.model_dump() if hasattr(request.parameters, 'model_dump') else request.parameters
            feature_1 = params_dict.get('feature_1', 0)
            feature_2 = params_dict.get('feature_2')
            
            # Build array from feature_1 and feature_2
            if feature_2 is not None and feature_2 != feature_1:
                viz_features = [feature_1, feature_2]
            else:
                viz_features = [feature_1]

        result = await knn_service.train(
            parameters=request.parameters,
            dataset_param=request.dataset,
            visualisation_features=viz_features,
            include_boundary=request.include_boundary,
            boundary_resolution=request.boundary_resolution,
        )
        return KNNTrainingResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
