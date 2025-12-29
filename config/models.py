import hashlib
from typing import List, Literal, Optional, Union, Any, Annotated
from pydantic import BaseModel, Field


class BaseCondition(BaseModel):
    condition_type: str


class BypassCheck(BaseCondition):
    condition_type: Literal["Bypass"] = "Bypass"


class SlideCheck(BaseCondition):
    condition_type: Literal["Slide"] = "Slide"
    slide_name: str
    slide_description: Optional[str] = None


class ParameterCheck(BaseCondition):
    condition_type: Literal["Parameter"] = "Parameter"
    category: str
    parameter: str
    comparator: Literal["<", "<=", ">=", ">", "="]
    value: Any


class TimeCheck(BaseCondition):
    condition_type: Literal["Time"] = "Time"
    wait: int


class ButtonPress(BaseCondition):
    condition_type: Literal["Button"] = "Button"
    button_id: str


class Lambda(BaseCondition):
    condition_type: Literal["Lambda"] = "Lambda"
    exec_str: str


Condition = Annotated[
    Union[BypassCheck, ParameterCheck, TimeCheck,
          ButtonPress, Lambda, "AndCondition", "OrCondition", "SlideCheck"],
    Field(discriminator="condition_type")
]


class AndCondition(BaseCondition):
    condition_type: Literal["And"] = "And"
    conditions: List[Condition]


class OrCondition(BaseCondition):
    condition_type: Literal["Or"] = "Or"
    conditions: List[Condition]


Index = int


class Slide(BaseModel):
    slide_name: str
    slide_description: Optional[str] = None


class EdgeNode(BaseModel):
    local_index: int
    story_name: Optional[str] = None


class Edge(BaseModel):
    start: EdgeNode
    end: EdgeNode
    condition: Condition = BypassCheck()


class BasePage(BaseModel):
    page_type: Literal["static", "dynamic"]
    parameters: dict[str, Any] = {}


class StaticPage(BasePage):
    page_type: Literal["static"] = "static"


class DynamicPageAbstract(BasePage):
    page_type: Literal["dynamic"] = "dynamic"
    dynamic_type: Literal["model", "none"]


class DynamicPage(DynamicPageAbstract):
    dynamic_type: Literal["none"] = "none"


class ModelPage(DynamicPageAbstract):
    dynamic_type: Literal["model"] = "model"
    model_name: str
    component_type: Literal["train", "predict"]


DynamicPageUnion = Annotated[
    Union[DynamicPage, ModelPage],
    Field(discriminator="dynamic_type")
]

PageUnion = Annotated[
    Union[StaticPage, DynamicPageUnion],
    Field(discriminator="page_type")
]


class StoryNode(BaseModel):
    index: Index


class Story(BaseModel):
    name: str
    description: str
    start_page: int = 0
    nodes: list[StoryNode]
    edges: list[Edge]


class Config(BaseModel):
    stories: dict[str, Story]
    pages: dict[Index, PageUnion]


def compute_object_hash(item: Union[PageUnion, Story]) -> int:
    item_json = item.model_dump_json()
    sha256_hash = hashlib.sha256(item_json.encode()).hexdigest()
    return int(sha256_hash[:8], 16)


def create_page_dict(pages: list[PageUnion]):
    return {compute_object_hash(p): p for p in pages}
