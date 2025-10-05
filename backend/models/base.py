from typing import Any, Dict, Optional
from pydantic import BaseModel


class BaseMLRequest(BaseModel):
    dataset: Optional[Dict[str, Any]] = None


class BaseMLResponse(BaseModel):
    success: bool
    model_key: str
    cached: bool
    metadata: Dict[str, Any]


class BaseMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1: float
