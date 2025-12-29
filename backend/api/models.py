from typing import Annotated, List, Literal, Optional, Union, Dict, Any
from pydantic import BaseModel, Field

from models import (
    TreeNode,
    BaseMetrics,
    DatasetInfo,
    DecisionTreeParameters,
    KNNParameters,
    NeighborInfo,
    DecisionBoundaryData,
)


class DecisionTreeTrainingRequest(DecisionTreeParameters):
    """Request model for Decision Tree."""

    dataset: Optional[Dict[str, Any]] = Field(
        None, description="Dataset to use for training")


class DecisionTreeTrainingResponse(BaseModel):
    """Response model for Decision Tree."""
    success: bool
    model_key: str
    cached: bool
    metadata: Dict[str, Any]
    tree: TreeNode
    classes: list[str]
    matrix: list[list[int]]
    scores: BaseMetrics


class DecisionTreePredictionRequest(BaseModel):
    """Request model for making predictions."""
    model_params: DecisionTreeTrainingRequest
    input_data: list[list[float]]


class DecisionTreePredictionResponse(BaseModel):
    """Response model for predictions."""
    predictions: list[str]
    prediction_indices: list[int]


class BaseParameterInfo(BaseModel):
    """Base parameter information."""
    name: str
    description: str
    default: Any


class SelectParameterInfo(BaseParameterInfo):
    """Select parameter with predefined options."""
    type: Literal["select"]
    options: list[Any]


class IntParameterInfo(BaseParameterInfo):
    """Integer parameter with optional range."""
    type: Literal["int"]
    min: Optional[int] = None
    max: Optional[int] = None


class NumberParameterInfo(BaseParameterInfo):
    """Number parameter with optional range and step."""
    type: Literal["number"]
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None


class FloatParameterInfo(BaseParameterInfo):
    """Float parameter with optional range and step."""
    type: Literal["float"]
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None


class AnyParameterInfo(BaseParameterInfo):
    """Any type parameter."""
    type: Literal["any"]


ParameterInfo = Annotated[
    Union[
        SelectParameterInfo,
        IntParameterInfo,
        NumberParameterInfo,
        FloatParameterInfo,
        AnyParameterInfo,
    ], Field(discriminator="type")]


class DatasetListResponse(BaseModel):
    """Response model for available datasets."""
    datasets: Dict[str, DatasetInfo]


class DatasetResponse(BaseModel):
    """Response model for loaded dataset."""
    success: bool
    X: List[List[float]] = Field(description="Feature matrix")
    y: List[int] = Field(description="Target vector")
    feature_names: List[str] = Field(description="Names of features")
    target_names: List[str] = Field(description="Names of target classes")
    info: DatasetInfo = Field(description="Dataset metadata")
    test_size: float = Field(description="Test set proportion")
    random_state: int = Field(description="Random seed for reproducibility")


class CacheInfoResponse(BaseModel):
    """Response model for cache information."""
    enabled: bool
    current_size: int
    max_size: int
    keys: Union[List[str], str]


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    module: str
    cache_info: CacheInfoResponse


class KNNVisualisationRequest(BaseModel):
    """Request model for KNN visualisation without prediction."""
    parameters: KNNParameters = Field(
        default_factory=KNNParameters,
        description="KNN algorithm parameters"
    )
    dataset: Optional[Dict[str, Any]] = Field(
        None,
        description="Training dataset. Defaults to Iris dataset."
    )
    visualisation_features: Optional[List[int]] = Field(
        None,
        description="Feature indices to visualise (1-3 features)"
    )
    include_boundary: bool = Field(
        True, description="Whether to include decision boundary"
    )
    boundary_resolution: int = Field(
        50, ge=10, le=200, description="Resolution of boundary mesh"
    )


class KNNVisualisationResponse(BaseModel):
    """Response model for KNN visualisation without prediction."""
    success: bool

    # Training data
    training_points: list[list[float]] = Field(
        description="All training point coordinates (visualisation features only)"
    )
    training_labels: list[str] = Field(
        description="All training point labels"
    )

    # Distance information for interactive exploration
    distance_matrix: list[list[float]] = Field(
        description="Distance from each training point to all other training points (0 for self)"
    )
    neighbor_indices: list[list[int]] = Field(
        description="Indices of K nearest neighbors for each training point (sorted by distance)"
    )

    # Decision boundary data (optional)
    decision_boundary: Optional[DecisionBoundaryData] = Field(
        None, description="Decision boundary visualisation data"
    )

    # Metadata
    feature_names: list[str]
    class_names: list[str]
    n_dimensions: int
    visualisation_feature_indices: Optional[list[int]] = Field(
        None, description="Feature indices used for visualisation"
    )
    visualisation_feature_names: Optional[list[str]] = Field(
        None, description="Names of features used for visualisation"
    )


class KNNPredictionRequest(BaseModel):
    """Request model for KNN prediction."""
    parameters: KNNParameters = Field(
        default_factory=KNNParameters,
        description="KNN algorithm parameters (defaults to n_neighbors=5, uniform weights, etc.)"
    )
    dataset: Optional[Dict[str, Any]] = Field(
        None,
        description="Training dataset with X, y, feature_names, class_names. Defaults to Iris dataset."
    )
    query_points: List[List[float]] = Field(
        description="Test points to classify"
    )
    visualisation_features: Optional[List[int]] = Field(
        None,
        description="Indices for visualisation features"
    )
    include_boundary: bool = Field(
        True, description="Whether to include decision boundary data"
    )
    boundary_resolution: int = Field(
        50, ge=10, le=200, description="Resolution of boundary mesh"
    )


class KNNPredictionResponse(BaseModel):
    """Response model for KNN prediction."""
    success: bool
    predictions: list[str] = Field(description="Predicted class labels")
    prediction_indices: list[int] = Field(
        description="Predicted class indices")

    # Per-query point neighbor information
    neighbors_info: list[list[NeighborInfo]] = Field(
        description="Neighbor information for each query point"
    )

    # All training points information
    training_points: list[list[float]] = Field(
        description="All training point coordinates"
    )
    training_labels: list[str] = Field(
        description="All training point labels"
    )

    # All distances from query point to training points (for visualization)
    all_distances: list[list[float]] = Field(
        description="Distance from each query point to all training points"
    )

    # Distance information for training points (for interactive exploration)
    distance_matrix: list[list[float]] = Field(
        description="Distance from each training point to all other training points (0 for self)"
    )
    neighbor_indices: list[list[int]] = Field(
        description="Indices of K nearest neighbors for each training point (sorted by distance)"
    )

    # Decision boundary data (optional)
    decision_boundary: Optional[DecisionBoundaryData] = Field(
        None, description="Decision boundary visualization data"
    )

    # Metadata
    feature_names: List[str]
    class_names: List[str]
    n_dimensions: int
