from typing import List, Literal, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from .util import HistogramData


class DecisionTreeParameters(BaseModel):
    """Core decision tree algorithm parameters."""
    max_depth: Optional[int] = Field(
        5, ge=1, description="Maximum depth of the tree")
    criterion: Literal["gini", "entropy"] = Field(
        "gini", description="Split quality criterion")
    min_samples_split: Optional[int] = Field(
        2, ge=2, description="Minimum samples to split")
    min_samples_leaf: Optional[int] = Field(
        1, ge=1, description="Minimum samples at leaf")
    max_features: Optional[Literal["sqrt", "log2"]] = Field(
        None, description="Number of features to consider")
    random_state: Optional[int] = Field(
        2025, ge=0, description="Random seed for reproducibility")

    def to_sklearn_params(self) -> Dict[str, Any]:
        """Convert to sklearn DecisionTreeClassifier parameters."""
        params = self.model_dump(exclude_none=True)
        return params


# Base class for shared node properties
class BaseNode(BaseModel):
    """Base class for all tree node types."""
    samples: int
    impurity: float
    value: List[List[float]]
    samples_mask: Optional[List[int]] = Field(
        None,
        description="Indices of samples that reached this node (None for trained models, populated for manual trees)"
    )
    terminal: Optional[bool] = Field(
        None,
        description="Whether this node is marked as terminal (frontend-only, used in manual tree building)"
    )


class LeafNode(BaseNode):
    """Leaf node in a decision tree (no further splits)."""
    type: Literal["leaf"] = "leaf"


class SplitNode(BaseNode):
    """Binary split node in a decision tree."""
    type: Literal["split"] = "split"
    feature: str
    feature_index: Optional[int] = Field(
        None,
        description="Numeric index of the feature (None for manual trees, populated for trained models)"
    )
    threshold: float
    histogram_data: Optional[HistogramData] = None
    left: 'TreeNode'
    right: 'TreeNode'


# Union type for tree nodes (backward compatibility)
TreeNode = Union[SplitNode, LeafNode]


# Manual Tree Builder Domain Models

class NodeStatParameters(BaseModel):
    feature: str = Field(..., description="Feature name to split on")
    threshold: float = Field(..., description="Threshold value for the split")
    parent_samples_mask: Optional[List[int]] = Field(
        None,
        description="Indices of samples that reached this node (None for root)"
    )
    criterion: str = Field(
        default="gini",
        description="Criterion to use for impurity calculation (gini or entropy)"
    )


class NodeStatistics(BaseModel):
    """Statistics for a node before/after split."""
    samples: int
    impurity: float  # Gini or entropy
    class_distribution: Dict[str, int]  # class_name -> count
    class_probabilities: Dict[str, float]  # class_name -> probability


class SplitStatistics(BaseModel):
    """Statistics for evaluating a split."""
    parent_stats: NodeStatistics
    left_stats: NodeStatistics
    right_stats: NodeStatistics
    information_gain: float
    weighted_impurity: float  # Weighted average of children impurities


class ThresholdStatistics(BaseModel):
    """Statistics for a single threshold value."""
    threshold: float
    information_gain: float
    split_stats: SplitStatistics
    left_samples_mask: List[int] = Field(
        description="Indices of samples that go to left child (<= threshold)"
    )
    right_samples_mask: List[int] = Field(
        description="Indices of samples that go to right child (> threshold)"
    )


class ManualFeatureStatsParameters(BaseModel):
    """Parameters for calculating all threshold statistics for a feature."""
    feature: str = Field(..., description="Feature name to analyze")
    parent_samples_mask: Optional[List[int]] = Field(
        None,
        description="Indices of samples that reached this node (None for root)"
    )
    criterion: str = Field(
        default="gini",
        description="Criterion to use for impurity calculation (gini or entropy)"
    )
    max_thresholds: int = Field(
        default=100,
        ge=10,
        le=500,
        description="Maximum number of thresholds to return"
    )
