from typing import List
from fastapi import APIRouter, HTTPException
from .models import (
    KMeansStepRequest,
    KMeansStepResponse,
    KMeansTrainRequest,
    KMeansTrainResponse,
    KMeansPredictRequest,
    KMeansPredictResponse,
    ParameterInfo,
)
from services import kmeans_service

router = APIRouter()


@router.get("/params", response_model=List[ParameterInfo])
async def get_parameters() -> List[ParameterInfo]:
    """Get the parameters for K-Means.

    Returns:
        List[ParameterInfo]: List of parameters for K-Means
    """
    params_config = await kmeans_service.get_parameters()
    return params_config


@router.post("/step", response_model=KMeansStepResponse)
async def step(
    request: KMeansStepRequest,
) -> KMeansStepResponse:
    """Perform one K-Means iteration: assign points to centroids and update centroids.

    This endpoint takes user-provided centroids and:
    1. Assigns each data point to its nearest centroid
    2. Calculates new centroid positions as the mean of assigned points
    3. Returns all data needed for visualization

    Use this for step-by-step K-Means visualization where users can:
    - Place initial centroids manually
    - Step through iterations one at a time
    - Observe how clusters evolve

    Args:
        request: Step request with parameters, centroids, and dataset

    Raises:
        HTTPException: If step fails

    Returns:
        KMeansStepResponse: Assignments, distances, updated centroids, and visualization data
    """
    try:
        # Convert feature_1 and feature_2 from parameters into visualisation_features array
        viz_features = request.visualisation_features

        # If visualisation_features not provided, build from feature_1/feature_2 in parameters
        if viz_features is None:
            params_dict = (
                request.parameters.model_dump()
                if hasattr(request.parameters, "model_dump")
                else request.parameters
            )
            feature_1 = params_dict.get("feature_1", 0)
            feature_2 = params_dict.get("feature_2")

            # Build array from feature_1 and feature_2
            if feature_2 is not None and feature_2 != feature_1:
                viz_features = [feature_1, feature_2]
            else:
                viz_features = [feature_1]

        result = await kmeans_service.step(
            parameters=request.parameters,
            centroids=request.centroids,
            dataset_param=request.dataset,
            visualisation_features=viz_features,
            include_boundary=request.include_boundary,
            boundary_resolution=request.boundary_resolution,
        )
        return KMeansStepResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/train", response_model=KMeansTrainResponse)
async def train(
    request: KMeansTrainRequest,
) -> KMeansTrainResponse:
    """Run K-Means until convergence, returning all iterations.

    This endpoint takes user-provided initial centroids and:
    1. Runs K-Means iterations until convergence or max_iterations
    2. Returns data for ALL iterations for playback/animation
    3. Includes final results

    Use this when you want to:
    - Animate the full K-Means algorithm
    - Show convergence behavior
    - Get final clustering results

    Args:
        request: Training request with parameters, initial centroids, dataset, and max_iterations

    Raises:
        HTTPException: If training fails

    Returns:
        KMeansTrainResponse: All iterations, final centroids, and visualization data
    """
    try:
        # Convert feature_1 and feature_2 from parameters into visualisation_features array
        viz_features = request.visualisation_features

        # If visualisation_features not provided, build from feature_1/feature_2 in parameters
        if viz_features is None:
            params_dict = (
                request.parameters.model_dump()
                if hasattr(request.parameters, "model_dump")
                else request.parameters
            )
            feature_1 = params_dict.get("feature_1", 0)
            feature_2 = params_dict.get("feature_2")

            # Build array from feature_1 and feature_2
            if feature_2 is not None and feature_2 != feature_1:
                viz_features = [feature_1, feature_2]
            else:
                viz_features = [feature_1]

        result = await kmeans_service.train(
            parameters=request.parameters,
            centroids=request.centroids,
            dataset_param=request.dataset,
            visualisation_features=viz_features,
            max_iterations=request.max_iterations,
            include_boundary=request.include_boundary,
            boundary_resolution=request.boundary_resolution,
        )
        return KMeansTrainResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/predict", response_model=KMeansPredictResponse)
async def predict(
    request: KMeansPredictRequest,
) -> KMeansPredictResponse:
    """Predict cluster assignments for query points given centroids.

    This endpoint assigns query points to their nearest centroid
    and returns distance information for visualization.

    Args:
        request: Prediction request with parameters, centroids, and query points

    Raises:
        HTTPException: If prediction fails

    Returns:
        KMeansPredictResponse: Assignments and distances for query points
    """
    try:
        result = await kmeans_service.predict(
            parameters=request.parameters,
            centroids=request.centroids,
            query_points=request.query_points,
        )
        return KMeansPredictResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
