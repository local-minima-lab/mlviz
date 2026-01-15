# Streamlit Multi-Page App - How It Works

## ✅ Yes! State is Shared Across All Pages

Streamlit's `st.session_state` is **automatically shared** across all pages in a multi-page app. This is the recommended way to build Streamlit apps now!

## How It Works

### File Structure
```
config/story_builder_streamlit/
├── app.py                          # Main landing page
└── pages/                          # Streamlit auto-detects this folder
    ├── 1_📄_View_Config.py        # Numbered for ordering
    ├── 2_➕_Add_Story.py
    ├── 3_➕_Add_Page.py
    ├── 4_💾_Export.py
    ├── 5_📥_Import_JSON.py
    └── 6_📋_Templates.py
```

### Key Points

1. **Automatic Navigation**
   - Streamlit automatically creates a sidebar menu from files in `pages/`
   - Files are sorted alphabetically (use numbers to control order)
   - Emojis in filenames show up in the menu!

2. **Shared State**
   - `st.session_state` is shared across ALL pages
   - Initialize state in `app.py` (main page)
   - Access the same state in any page file

3. **File Naming**
   - Format: `{number}_{emoji}_{Title}.py`
   - Example: `1_📄_View_Config.py`
   - The number controls order
   - The emoji and title show in the sidebar

### Example Page File

```python
# pages/1_📄_View_Config.py
import streamlit as st

st.set_page_config(page_title="View Config", page_icon="📄")

# Initialize if needed
if 'config' not in st.session_state:
    st.session_state.config = {"stories": {}, "pages": {}}

# Use the shared state
st.json(st.session_state.config)

# Modify the shared state
if st.button("Clear"):
    st.session_state.config = {"stories": {}, "pages": {}}
```

### Importing Models

Each page file needs to import models independently:

```python
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import StaticPage, ModelPage
```

## Benefits

✅ **Automatic Navigation** - No manual routing code  
✅ **Shared State** - `st.session_state` works across all pages  
✅ **Clean URLs** - Each page gets its own URL  
✅ **Better UX** - Native Streamlit navigation  
✅ **Easier to Maintain** - Each page is independent  

## Migration from Custom Routing

**Before** (Custom routing):
- 700+ line `app.py` with if/elif chains
- Manual `st.radio()` for navigation
- Import all pages in main file

**After** (Multi-page app):
- Small `app.py` as landing page
- Automatic sidebar navigation
- Each page is independent
- State automatically shared

## Running the App

```bash
uv run streamlit run app.py
```

Streamlit will automatically:
1. Show `app.py` as the main page
2. Detect files in `pages/` folder
3. Create sidebar navigation
4. Share `st.session_state` across all pages

That's it! Much cleaner and more maintainable! 🎉
