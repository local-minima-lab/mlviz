"""
Config Builder - Main Page

Quick tool for creating Config objects using the models from models.py
"""

import streamlit as st

st.set_page_config(
    page_title="Config Builder",
    page_icon="⚙️",
    layout="wide"
)

st.title("⚙️ Config Builder")
st.markdown("Quick tool for creating Config objects")

# Initialize session state (shared across all pages)
if 'config' not in st.session_state:
    st.session_state.config = {
        "stories": {},
        "pages": {}
    }

# Main landing page
st.header("Welcome to Config Builder")

st.markdown("""
This tool helps you create configuration files for MLviz stories and pages.

### Quick Start

Use the sidebar to navigate between different sections:

- **📄 View Config** - See your current configuration
- **➕ Add Story** - Create new stories with nodes and edges
- **✏️ Edit Story** - Modify existing stories
- **➕ Add Page** - Create static, model, or dynamic pages
- **💾 Export** - Export your configuration to JSON
- **📥 Import JSON** - Import configuration from JSON text
- **📋 Templates** - Load quick start templates

### Current Status
""")

col1, col2 = st.columns(2)

with col1:
    st.metric("Stories", len(st.session_state.config["stories"]))

with col2:
    st.metric("Pages", len(st.session_state.config["pages"]))

if st.session_state.config["stories"] or st.session_state.config["pages"]:
    st.success("✅ You have an active configuration")
else:
    st.info("💡 Start by adding pages, then create stories that use those pages")
