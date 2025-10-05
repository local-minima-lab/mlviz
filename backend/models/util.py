from typing import Dict, List, Optional
from pydantic import BaseModel


class HistogramData(BaseModel):
    feature_values: List[float]
    class_labels: List[int]
    bins: List[float]
    counts_by_class: Dict[str, List[int]]
    threshold: Optional[float]
    total_samples: int
