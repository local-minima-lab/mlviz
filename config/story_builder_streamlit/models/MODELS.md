# Models Package Structure

The `models` package contains all Pydantic models used in the Config Builder. It has been refactored from a monolithic file into a modular structure.

## File Structure

```
models/
├── __init__.py            # Exports everything + model_pages registry
├── base.py                # Base classes (BasePage) + Primitives (Index)
├── conditions.py          # Condition models (Bypass, Parameter, etc.)
├── config.py              # Config model + Union definitions
├── story.py               # Story, StoryNode, Edge
├── static_page.py         # StaticPage + StaticParameters
├── decision_tree_page.py  # DTree pages + parameters
├── knn_page.py           # KNN pages + parameters
└── utils.py               # Hashing utility
```

## How to Add a New Page Type

1. **Create a new file** (or add to existing domain file) in `models/`:
   ```python
   # models/my_new_page.py
   from pydantic import BaseModel, Field
   from .base import ModelPage
   
   class MyParams(BaseModel):
       my_field: str = Field(..., description="My field")
       
   class MyPage(ModelPage):
       model_name: Literal["my_model"] = "my_model"
       component_type: Literal["my_type"] = "my_type"
       parameters: MyParams = Field(default_factory=MyParams)
   ```

2. **Register it in `models/__init__.py`**:
   - Import your new classes
   - Add to `__all__`
   - Add to `model_pages` dictionary:
     ```python
     model_pages = {
         ...,
         "My New Page": MyPage
     }
     ```

## Key Relationships

- **Config** -> **Story** + **PageUnion**
- **PageUnion** -> **StaticPage** + **DynamicPageUnion**
- **DynamicPageUnion** -> **ModelPageUnion** + **DynamicPage**
- **ModelPageUnion** -> **DTreePageUnion** + **KNNPageUnion**
- **Story** -> **Edge** -> **Condition**

## Circular Dependency Handling

- `config.py` is the top-level aggregator.
- `story.py` handles the graph structure.
- `conditions.py` handles the logic within edges.
- `base.py` provides common types to avoid cycles.
- `utils.py` uses `TYPE_CHECKING` imports to verify types without runtime cycles.
