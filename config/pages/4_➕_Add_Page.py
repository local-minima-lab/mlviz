"""Add Page - Create new pages using Pydantic form generator"""
import streamlit as st
import sys
from pathlib import Path

# Add parent directory to path to import models
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import model_pages, compute_object_hash
from utils.pydantic_form_generator import generate_form_with_validation

st.set_page_config(page_title="Add Page", page_icon="➕", layout="wide")

st.header("Add Page")

# Initialize session state if not exists
if 'config' not in st.session_state:
    st.session_state.config = {"stories": {}, "pages": {}}

st.markdown("""
Select a page type below and the form will be automatically generated based on the Pydantic model.
""")

# Dropdown for selecting page type
page_type = st.selectbox(
    "Select Page Type",
    options=list(model_pages.keys()),
    help="Choose which type of page to create"
)

st.divider()

# Get the selected model
selected_model = model_pages[page_type]

# Display model info
st.subheader(f"Create {page_type}")
if selected_model.__doc__:
    st.caption(selected_model.__doc__)

# Generate form automatically from the Pydantic model
page_instance = generate_form_with_validation(
    selected_model,
    title=None,  # We already have a subheader
    submit_label=f"➕ Add {page_type}",
    exclude_fields=["page_type", "dynamic_type"],  # These are set automatically
    key_prefix=f"{page_type}_"
)

if page_instance:
    try:
        # Compute hash for the page
        page_id = compute_object_hash(page_instance)
        
        # Add to config
        st.session_state.config["pages"][str(page_id)] = page_instance.model_dump()
        
        # Show success message
        st.success(f"✅ {page_type} added with ID: {page_id}")
        
        # Show the created page
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Page Data")
            st.json(page_instance.model_dump())
        
        with col2:
            st.subheader("Page ID")
            st.code(page_id)
            st.metric("Total Pages", len(st.session_state.config["pages"]))
            
    except Exception as e:
        st.error(f"Error adding page: {str(e)}")

# Show info about available page types
st.divider()
with st.expander("ℹ️ About Page Types"):
    st.markdown("""
    ### Available Page Types
    
    The form above is **automatically generated** from Pydantic models. Each page type has:
    
    - **Automatic validation** - Pydantic ensures data is correct
    - **Type-safe fields** - Appropriate widgets for each field type
    - **Default values** - Pre-filled with sensible defaults
    - **Help text** - Field descriptions as tooltips
    
    To add a new page type, simply add it to `model_pages` in `models.py`!
    """)
    
    st.markdown("### Current Page Types")
    for name, model in model_pages.items():
        st.markdown(f"- **{name}**: `{model.__name__}`")
