from typing import Literal, Optional, TypedDict

from pydantic import BaseModel, Field

# Type definitions
Index = int
ModelNames = Literal["decision_tree", "knn", "kmeans"]
ModelComponentType = Literal["manual", "train", "predict", "viz_only"]
ProblemType = Literal["classifier", "clustering", "regression"]


class Slide(BaseModel):
    slide_name: str
    slide_description: Optional[str] = None


class BasePage(BaseModel):
    name: Optional[str] = None
    page_type: Literal["static", "dynamic"]
    # Parameters are defined in subclasses


class DynamicPageAbstract(BasePage):
    page_type: Literal["dynamic"] = "dynamic"
    dynamic_type: Literal["model", "none"]


class DynamicPage(DynamicPageAbstract):
    dynamic_type: Literal["none"] = "none"


class ModelPage(DynamicPageAbstract):
    dynamic_type: Literal["model"] = "model"
    model_name: ModelNames
    component_type: ModelComponentType
    problem_type: ProblemType


class StaticParameters(BaseModel):
    text: Optional[str] = Field(None, description="Text content for the page")
    link: Optional[str] = Field(None, description="Optional link URL")


class StaticPage(BasePage):
    page_type: Literal["static"] = "static"
    parameters: StaticParameters = Field(default_factory=StaticParameters)
