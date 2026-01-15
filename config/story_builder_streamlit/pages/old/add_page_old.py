"""Add Page - Create new pages (Static, Model, or Dynamic)"""
import streamlit as st
from models import StaticPage, ModelPage, DynamicPage, compute_object_hash


def render():
    """Render the Add Page page."""
    st.header("Add Page")
    
    page_type = st.selectbox("Page Type", ["Static Page", "Model Page", "Dynamic Page"])
    
    if page_type == "Static Page":
        st.subheader("Static Page")
        
        text = st.text_area("Text", placeholder="Page content")
        link = st.text_input("Link (optional)", placeholder="https://...")
        
        if st.button("➕ Add Static Page", type="primary"):
            try:
                page_data = {
                    "page_type": "static",
                    "parameters": {
                        "text": text if text else None,
                        "link": link if link else None
                    }
                }
                
                page = StaticPage.model_validate(page_data)
                page_id = compute_object_hash(page)
                
                st.session_state.config["pages"][str(page_id)] = page.model_dump()
                
                st.success(f"✅ Static page added with ID: {page_id}")
                st.json(page.model_dump())
                
            except Exception as e:
                st.error(f"Error: {str(e)}")
    
    elif page_type == "Model Page":
        st.subheader("Model Page")
        
        col1, col2 = st.columns(2)
        
        with col1:
            model_name = st.selectbox(
                "Model Name", 
                ["decision_tree", "knn"]
            )
        
        with col2:
            component_type = st.selectbox(
                "Component Type", 
                ["train", "predict", "manual", "viz_only"]
            )

        
        if st.button("➕ Add Model Page", type="primary"):
            try:
                page_data = {
                    "page_type": "dynamic",
                    "dynamic_type": "model",
                    "model_name": model_name,
                    "component_type": component_type
                }
                
                page = ModelPage.model_validate(page_data)
                page_id = compute_object_hash(page)
                
                st.session_state.config["pages"][str(page_id)] = page.model_dump()
                
                st.success(f"✅ Model page added with ID: {page_id}")
                st.json(page.model_dump())
                
            except Exception as e:
                st.error(f"Error: {str(e)}")
    
    else:  # Dynamic Page
        st.subheader("Dynamic Page")
        
        if st.button("➕ Add Dynamic Page", type="primary"):
            try:
                page_data = {
                    "page_type": "dynamic",
                    "dynamic_type": "none"
                }
                
                page = DynamicPage.model_validate(page_data)
                page_id = compute_object_hash(page)
                
                st.session_state.config["pages"][str(page_id)] = page.model_dump()
                
                st.success(f"✅ Dynamic page added with ID: {page_id}")
                st.json(page.model_dump())
                
            except Exception as e:
                st.error(f"Error: {str(e)}")
