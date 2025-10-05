from typing import Annotated, List, Literal, Optional, Union, Dict, Any
from pydantic import BaseModel, Field

from models import TreeNode, BaseMetrics, DatasetInfo, DecisionTreeParameters


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
    classes: List[str]
    matrix: List[List[int]]
    scores: BaseMetrics


class DecisionTreePredictionRequest(BaseModel):
    """Request model for making predictions."""
    model_params: DecisionTreeTrainingRequest
    input_data: List[List[float]]


class DecisionTreePredictionResponse(BaseModel):
    """Response model for predictions."""
    predictions: List[str]
    prediction_indices: List[int]


class BaseParameterInfo(BaseModel):
    """Base parameter information."""
    name: str
    description: str
    default: Any


class SelectParameterInfo(BaseParameterInfo):
    """Select parameter with predefined options."""
    type: Literal["select"]
    options: List[Any]


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
