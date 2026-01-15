"""Models package - Pydantic models for configuration"""

# Base types
from .base import (
    Index,
    Slide,
    BasePage,
    StaticParameters,
    StaticPage,
    DynamicPageAbstract,
    DynamicPage,
    ModelNames,
    ModelComponentTypes,
    ModelPage,
)

# Conditions
from .conditions import (
    BaseCondition,
    BypassCheck,
    SlideCheck,
    ParameterCheck,
    TimeCheck,
    ButtonPress,
    Lambda,
    AndCondition,
    OrCondition,
    Condition,
)

# Decision Tree Pages
from .decision_tree_page import (
    DTreeManualParameters,
    DTreeTrainParameters,
    DTreePredictParameters,
    DTreePage,
    DTreeManualPage,
    DTreeTrainPage,
    DTreePredictPage,
    DTreePageUnion,
)

# KNN Pages
from .knn_page import (
    KNNVizParameters,
    KNNPage,
    KNNVizPage,
    KNNPageUnion,
)

# Story
from .story import (
    EdgeNode,
    Edge,
    StoryNode,
    Story,
)

# Config and Unions
from .config import (
    ModelPageUnion,
    DynamicPageUnion,
    PageUnion,
    Config,
)

# Utils
from .utils import (
    compute_object_hash,
    create_page_dict,
)

# Page Registry for UI
model_pages = {
    "Static": StaticPage,
    "Decision Tree: Manual": DTreeManualPage,
    "Decision Tree: Train": DTreeTrainPage,
    "Decision Tree: Predict": DTreePredictPage,
    "KNN: Viz": KNNVizPage,
}

__all__ = [
    # Base
    "Index",
    "Slide",
    "BasePage",
    "DynamicPageAbstract",
    "DynamicPage",
    "ModelNames",
    "ModelComponentTypes",
    "ModelPage",
    
    # Conditions
    "BaseCondition",
    "BypassCheck",
    "SlideCheck",
    "ParameterCheck",
    "TimeCheck",
    "ButtonPress",
    "Lambda",
    "AndCondition",
    "OrCondition",
    "Condition",
    
    # Static
    "StaticParameters",
    "StaticPage",
    
    # Decision Tree
    "DTreeManualParameters",
    "DTreeTrainParameters",
    "DTreePredictParameters",
    "DTreePage",
    "DTreeManualPage",
    "DTreeTrainPage",
    "DTreePredictPage",
    "DTreePageUnion",
    
    # KNN
    "KNNVizParameters",
    "KNNPage",
    "KNNVizPage",
    "KNNPageUnion",
    
    # Story
    "EdgeNode",
    "Edge",
    "StoryNode",
    "Story",
    
    # Config and Unions
    "ModelPageUnion",
    "DynamicPageUnion",
    "PageUnion",
    "Config",
    
    # Utils
    "compute_object_hash",
    "create_page_dict",
    
    # Registry
    "model_pages",
]
