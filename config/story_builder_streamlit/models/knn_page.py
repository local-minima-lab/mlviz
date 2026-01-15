from typing import Literal, Union, Annotated
from pydantic import BaseModel, Field
from .base import ModelPage

# Parameters
class KNNVizParameters(BaseModel):
    """Parameters for KNN visualization"""
    visualisation_features: list[int] = Field(
        default_factory=lambda: [0, 1],
        description="Feature indices to visualize"
    )
    include_boundary: bool = Field(
        default=True,
        description="Whether to include decision boundary"
    )

# Pages
class KNNPage(ModelPage):
    model_name: Literal["knn"] = "knn"

class KNNVizPage(KNNPage):
    component_type: Literal["viz_only"] = "viz_only"
    parameters: KNNVizParameters = Field(default_factory=KNNVizParameters)

# Union
KNNPageUnion = Annotated[
    Union[KNNVizPage],
    Field(discriminator="component_type")
]
