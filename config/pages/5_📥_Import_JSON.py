"""Import JSON Page - Import configuration from JSON text"""
import streamlit as st
import json
import sys
from pathlib import Path

# Add parent directory to path to import models
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Config

st.set_page_config(page_title="Import JSON", page_icon="📥")

st.header("Import Config from JSON")

# Initialize session state if not exists
if 'config' not in st.session_state:
    st.session_state.config = {"stories": {}, "pages": {}}

st.markdown("Paste your JSON config below:")

json_text = st.text_area(
    "JSON Config",
    height=400,
    placeholder='''{
  "stories": {
    "intro": {
      "name": "intro",
      "description": "Introduction story",
      "start_page": 0,
      "nodes": [{"index": 0}],
      "edges": []
    }
  },
  "pages": {
    "0": {
      "page_type": "static",
      "parameters": {
        "text": "Welcome!",
        "link": null
      }
    }
  }
}'''
)

col1, col2 = st.columns(2)

with col1:
    if st.button("📥 Import Config", type="primary"):
        if not json_text.strip():
            st.error("Please paste JSON config")
        else:
            try:
                config_data = json.loads(json_text)
                config = Config.model_validate(config_data)
                st.session_state.config = config.model_dump()
                st.success("✅ Config imported successfully!")
                st.rerun()
            except json.JSONDecodeError as e:
                st.error(f"Invalid JSON: {str(e)}")
            except Exception as e:
                st.error(f"Error validating config: {str(e)}")

with col2:
    if st.button("🔍 Validate Only", type="secondary"):
        if not json_text.strip():
            st.warning("Please paste JSON config")
        else:
            try:
                config_data = json.loads(json_text)
                config = Config.model_validate(config_data)
                st.success("✅ Valid config!")
                st.json(config.model_dump())
            except json.JSONDecodeError as e:
                st.error(f"Invalid JSON: {str(e)}")
            except Exception as e:
                st.error(f"Validation error: {str(e)}")
