from typing import List, Literal, Optional, Dict, Any
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


class TreeNode(BaseModel):
    """Core domain model for decision tree nodes."""
    type: Literal["split", "leaf"]
    samples: int
    impurity: float
    value: List[List[float]]

    # Split node specific fields
    feature: Optional[str] = None
    feature_index: Optional[int] = None
    threshold: Optional[float] = None
    histogram_data: Optional[HistogramData] = None
    left: Optional['TreeNode'] = None
    right: Optional['TreeNode'] = None