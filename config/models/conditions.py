from typing import List, Literal, Optional, Any, Annotated, Union
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

# Defined BEFORE Condition, using string forward ref for Condition
class AndCondition(BaseCondition):
    condition_type: Literal["And"] = "And"
    conditions: List["Condition"]

class OrCondition(BaseCondition):
    condition_type: Literal["Or"] = "Or"
    conditions: List["Condition"]

# Condition defined LAST, using actual classes
Condition = Annotated[
    Union[BypassCheck, ParameterCheck, TimeCheck,
          ButtonPress, Lambda, AndCondition, OrCondition, SlideCheck],
    Field(discriminator="condition_type")
]

# Rebuild models to resolve "Condition" string reference
AndCondition.model_rebuild()
OrCondition.model_rebuild()
