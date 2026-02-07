from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class KMeansParameters(BaseModel):
    """Core K-Means algorithm parameters for manual step-by-step clustering."""

    metric: Literal["euclidean", "manhattan"] = Field(
        "euclidean",
        description="Distance metric for assigning points to clusters"
    )

    # Feature selection parameters
    feature_1: int = Field(
        0, ge=0, le=10,
        description="First feature index for visualization"
    )
    feature_2: Optional[int] = Field(
        1, ge=0, le=10,
        description="Second feature index for visualization"
    )


class ClusterInfo(BaseModel):
    """Information about a single cluster."""
    cluster_id: int = Field(description="Cluster identifier")
    centroid: List[float] = Field(description="Centroid coordinates")
    n_points: int = Field(description="Number of points in cluster")
    point_indices: List[int] = Field(description="Indices of points in this cluster")
