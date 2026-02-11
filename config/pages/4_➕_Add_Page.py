"""Add Page - Create new pages using Pydantic form generator"""
import json

import streamlit as st
import sys
from pathlib import Path

from pydantic import BaseModel

# Add parent directory to path to import models
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import model_pages, compute_object_hash, ModelPage
from utils.pydantic_form_generator import generate_form_from_pydantic

st.set_page_config(page_title="Add Page", page_icon="➕", layout="wide")

st.header("Add Page")

# Initialize session state if not exists
if 'config' not in st.session_state:
    st.session_state.config = {"datasets": {}, "stories": {}, "pages": {}}

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

# Check if the model has a typed parameters field with actual fields
has_typed_params = False
if "parameters" in selected_model.model_fields:
    param_annotation = selected_model.model_fields["parameters"].annotation
    if (isinstance(param_annotation, type)
            and issubclass(param_annotation, BaseModel)
            and len(param_annotation.model_fields) > 0):
        has_typed_params = True

# Exclude fields that are set automatically + dataset (handled manually below)
# Also exclude parameters if it has no typed fields (will show JSON box instead)
exclude = ["page_type", "dynamic_type", "dataset"]
if not has_typed_params:
    exclude.append("parameters")

# Generate form automatically from the Pydantic model
form_data = generate_form_from_pydantic(
    selected_model,
    title=None,
    exclude_fields=exclude,
    key_prefix=f"{page_type}_"
)

# Show JSON box for parameters if the model doesn't have a typed parameters class
if not has_typed_params and "parameters" in selected_model.model_fields:
    st.divider()
    st.subheader("Parameters")
    params_json = st.text_area(
        "Parameters (JSON)",
        value="{}",
        height=150,
        help="Free-form JSON object for page parameters",
        key=f"{page_type}_params_json",
    )
    try:
        form_data["parameters"] = json.loads(params_json)
    except json.JSONDecodeError:
        st.error("Invalid JSON for parameters")

# Dataset selector for model pages
is_model_page = issubclass(selected_model, ModelPage)
dataset_value = None

if is_model_page:
    st.divider()
    st.subheader("Dataset")

    PREDEFINED_DATASETS = ["iris", "wine", "breast_cancer", "digits"]
    custom_datasets = list(st.session_state.config.get("datasets", {}).keys())

    ds_type = st.selectbox(
        "Dataset Type",
        options=["None", "reference", "predefined"],
        help="'reference' links to a custom dataset added in Add Dataset. "
             "'predefined' uses a built-in sklearn dataset.",
        key=f"{page_type}_dataset_type",
    )

    if ds_type == "reference":
        if not custom_datasets:
            st.warning("No custom datasets added yet. Add one in the Add Dataset page first.")
        else:
            ds_name = st.selectbox(
                "Dataset Name",
                options=custom_datasets,
                key=f"{page_type}_dataset_ref_name",
            )
            dataset_value = {"type": "reference", "name": ds_name}

    elif ds_type == "predefined":
        ds_name = st.selectbox(
            "Dataset Name",
            options=PREDEFINED_DATASETS,
            key=f"{page_type}_dataset_pred_name",
        )
        dataset_value = {"type": "predefined", "name": ds_name}

# Submit button
if st.button(f"➕ Add {page_type}", type="primary"):
    try:
        if dataset_value is not None:
            form_data["dataset"] = dataset_value

        page_instance = selected_model.model_validate(form_data)

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
        st.error(f"❌ Validation error: {str(e)}")

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
