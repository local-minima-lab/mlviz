"""Templates Page - Quick start templates and examples"""
import streamlit as st
import sys
from pathlib import Path

# Add parent directory to path to import models
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import (
    StaticPage, ModelPage, Story, StoryNode,
    StaticParameters, compute_object_hash
)

st.set_page_config(page_title="Templates", page_icon="📋")

st.header("Templates")

# Initialize session state if not exists
if 'config' not in st.session_state:
    st.session_state.config = {"stories": {}, "pages": {}}

st.subheader("Quick Start Templates")

col1, col2 = st.columns(2)

with col1:
    if st.button("📄 Minimal Config", use_container_width=True):
        st.session_state.config = {
            "stories": {},
            "pages": {}
        }
        st.success("✅ Minimal config loaded")
        st.rerun()
    
    if st.button("📚 Simple Story Config", use_container_width=True):
        # Create a simple page
        page = StaticPage(
            parameters=StaticParameters(
                text="Welcome to MLviz!",
                link=None
            )
        )
        page_id = compute_object_hash(page)
        
        # Create a simple story
        story = Story(
            name="intro",
            description="Introduction story",
            start_page=page_id,
            nodes=[StoryNode(index=page_id)],
            edges=[]
        )
        
        st.session_state.config = {
            "stories": {"intro": story.model_dump()},
            "pages": {str(page_id): page.model_dump()}
        }
        st.success("✅ Simple story config loaded")
        st.rerun()

with col2:
    if st.button("🤖 ML Model Config", use_container_width=True):
        # Create model pages
        train_page = ModelPage(
            model_name="decision_tree",
            component_type="train"
        )
        predict_page = ModelPage(
            model_name="decision_tree",
            component_type="predict"
        )
        
        train_id = compute_object_hash(train_page)
        predict_id = compute_object_hash(predict_page)
        
        # Create story
        story = Story(
            name="ml_workflow",
            description="ML training and prediction workflow",
            start_page=train_id,
            nodes=[
                StoryNode(index=train_id),
                StoryNode(index=predict_id)
            ],
            edges=[]
        )
        
        st.session_state.config = {
            "stories": {"ml_workflow": story.model_dump()},
            "pages": {
                str(train_id): train_page.model_dump(),
                str(predict_id): predict_page.model_dump()
            }
        }
        st.success("✅ ML model config loaded")
        st.rerun()

st.divider()
st.subheader("Example JSON Snippets")

with st.expander("Static Page"):
    st.code('''
{
  "page_type": "static",
  "parameters": {
    "text": "Hello World",
    "link": null
  }
}
    ''', language="json")

with st.expander("Model Page"):
    st.code('''
{
  "page_type": "dynamic",
  "dynamic_type": "model",
  "model_name": "decision_tree",
  "component_type": "train"
}
    ''', language="json")

with st.expander("Story"):
    st.code('''
{
  "name": "my_story",
  "description": "Story description",
  "start_page": 0,
  "nodes": [{"index": 0}],
  "edges": []
}
    ''', language="json")
