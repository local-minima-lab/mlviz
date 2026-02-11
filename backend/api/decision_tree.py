from typing import List

from fastapi import APIRouter, HTTPException
from services import dt_service, manual_tree_service

from .models import (
    CacheInfoResponse,
    DecisionTreeTrainingRequest,
    DecisionTreeTrainingResponse,
    DecisionTreeTraversalPredictRequest,
    DecisionTreeTraversalPredictResponse,
    ManualFeatureStatsRequest,
    ManualFeatureStatsResponse,
    ManualNodeStatsRequest,
    ManualNodeStatsResponse,
    ManualTreeEvaluateRequest,
    ManualTreeEvaluateResponse,
    ParameterInfo,
)

router = APIRouter()


@router.get("/train_params", response_model=List[ParameterInfo])
async def get_parameters() -> List[ParameterInfo]:
    """Gets the parameters for training.

    Returns:
        List[ParameterInfo]: List of parameters for training
    """
    params_config = await dt_service.get_parameters()
    return params_config


@router.post("/train", response_model=DecisionTreeTrainingResponse)
async def train_model(
    request: DecisionTreeTrainingRequest,
) -> DecisionTreeTrainingResponse:
    """Train a decision tree model with the specified parameters.

    Supports both predefined datasets (iris, wine, breast_cancer, digits)
    and custom datasets. Models are automatically cached for efficiency.

    Args:
        request (DecisionTreeTrainingRequest): The request parameters

    Raises:
        HTTPException: Exception if unable to train model

    Returns:
        DecisionTreeTrainingResponse: Model details
    """
    try:
        result = await dt_service.train_model(request, request.dataset)
        return DecisionTreeTrainingResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/predict_params", response_model=List[str])
async def get_predict_params(request: DecisionTreeTrainingRequest):
    """Gets params for prediction

    Args:
        request (DecisionTreeTrainingRequest): Request

    Raises:
        HTTPException: Exception if retrieval failed

    Returns:
        List[str]: Feature names
    """
    try:
        return await dt_service.get_predict_params(request.dataset)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/predict", response_model=DecisionTreeTraversalPredictResponse)
async def predict_with_instructions(
    request: DecisionTreeTraversalPredictRequest,
) -> DecisionTreeTraversalPredictResponse:
    """Make a prediction and return traversal instructions for visualization.

    This endpoint traverses the provided decision tree using the input feature
    values and returns:
    - The predicted class and confidence
    - A list of traversal instructions ("left", "right", "stop") that can be
      used by the frontend to animate the prediction path through the tree

    Args:
        request: Contains the tree structure, feature values, and optional class names

    Raises:
        HTTPException: If prediction fails (e.g., missing feature value)

    Returns:
        DecisionTreeTraversalPredictResponse: Prediction result with instructions
    """
    try:
        result = await dt_service.predict_with_instructions(
            tree=request.tree,
            points=request.points,
            class_names=request.class_names,
        )
        return DecisionTreeTraversalPredictResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.delete("/cache")
async def clear_cache():
    """Clear all cached models."""
    await dt_service.cache.clear()
    return {"message": "Cache cleared successfully"}


@router.get("/cache/info", response_model=CacheInfoResponse)
async def get_cache_info():
    """Get cache statistics and information."""
    cache_info = dt_service.cache.get_cache_info()
    return CacheInfoResponse(**cache_info)


# Manual Tree Builder Endpoints


@router.post("/manual/node-stats", response_model=ManualNodeStatsResponse)
async def calculate_node_stats(
    request: ManualNodeStatsRequest,
) -> ManualNodeStatsResponse:
    """Calculate statistics for a potential node split in manual tree building.

    This endpoint calculates entropy/gini, information gain, class distributions,
    and histogram data for a given feature and threshold split.

    Args:
        request (ManualNodeStatsRequest): Contains dataset, feature, threshold,
                                         parent samples mask, and criterion

    Raises:
        HTTPException: If feature not found or calculation fails

    Returns:
        ManualNodeStatsResponse: Statistics for parent and child nodes,
                                information gain, histogram data, and sample masks
    """
    try:
        result = await manual_tree_service.calculate_node_statistics(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to calculate statistics: {str(e)}"
        )


@router.post("/manual/feature-stats", response_model=ManualFeatureStatsResponse)
async def calculate_feature_stats(
    request: ManualFeatureStatsRequest,
) -> ManualFeatureStatsResponse:
    """Calculate statistics for all possible thresholds of a feature.

    This endpoint returns statistics for all valid split points of a feature,
    enabling instant slider feedback without additional API calls.

    Args:
        request (ManualFeatureStatsRequest): Contains dataset, feature,
                                            parent samples mask, criterion,
                                            and max_thresholds limit

    Raises:
        HTTPException: If feature not found, has only one value, or calculation fails

    Returns:
        ManualFeatureStatsResponse: Array of threshold statistics, best threshold,
                                   feature range, histogram, and metadata
    """
    try:
        result = await manual_tree_service.calculate_feature_statistics(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to calculate feature statistics: {str(e)}"
        )


@router.post("/manual/evaluate", response_model=ManualTreeEvaluateResponse)
async def evaluate_manual_tree(
    request: ManualTreeEvaluateRequest,
) -> ManualTreeEvaluateResponse:
    """Evaluate a manually built tree against test data.

    This endpoint calculates accuracy, precision, recall, and F1 scores
    by making predictions on the test set using the provided tree structure.

    Args:
        request (ManualTreeEvaluateRequest): Contains tree structure and optional dataset

    Raises:
        HTTPException: If evaluation fails

    Returns:
        ManualTreeEvaluateResponse: Metrics (accuracy, precision, recall, F1) and confusion matrix
    """
    try:
        result = await dt_service.evaluate_manual_tree(request.tree, request.dataset)
        return ManualTreeEvaluateResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to evaluate tree: {str(e)}"
        )
