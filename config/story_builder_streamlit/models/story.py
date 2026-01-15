from typing import Optional, List
from pydantic import BaseModel
from .base import Index
from .conditions import Condition, BypassCheck

class EdgeNode(BaseModel):
    local_index: int
    story_name: Optional[str] = None

class Edge(BaseModel):
    start: EdgeNode
    end: EdgeNode
    condition: Condition = BypassCheck()

class StoryNode(BaseModel):
    index: Index

class Story(BaseModel):
    name: str
    description: str
    start_page: int = 0
    nodes: List[StoryNode]
    edges: List[Edge]

Story.model_rebuild()
