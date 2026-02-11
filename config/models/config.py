from typing import Dict, Optional, Union, Annotated
from pydantic import BaseModel, Field
from .base import Index, DynamicPage, ModelPage, StaticPage
from .dataset import DatasetEntry
from .decision_tree_page import DTreePageUnion
from .knn_page import KNNPageUnion
from .kmeans_page import KMeansPageUnion
from .story import Story

# Unions
ModelPageUnion = Annotated[
    Union[DTreePageUnion, KNNPageUnion, KMeansPageUnion],
    Field(discriminator="model_name")
]

DynamicPageUnion = Annotated[
    Union[ModelPageUnion, DynamicPage],
    Field(discriminator="dynamic_type")
]

PageUnion = Annotated[
    Union[StaticPage, DynamicPageUnion],
    Field(discriminator="page_type")
]

# Config
class Config(BaseModel):
    datasets: Optional[Dict[str, DatasetEntry]] = None
    stories: Dict[str, Story]
    pages: Dict[Index, PageUnion]

Config.model_rebuild()
