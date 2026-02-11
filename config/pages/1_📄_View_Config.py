"""View Config Page - Display current configuration"""
import streamlit as st

st.set_page_config(page_title="View Config", page_icon="📄")

st.header("Current Config")

# Initialize session state if not exists
if 'config' not in st.session_state:
    st.session_state.config = {"datasets": {}, "stories": {}, "pages": {}}

col1, col2 = st.columns([3, 1])

with col1:
    st.json(st.session_state.config)

with col2:
    st.metric("Datasets", len(st.session_state.config.get("datasets", {})))
    st.metric("Stories", len(st.session_state.config["stories"]))
    st.metric("Pages", len(st.session_state.config["pages"]))
    
    if st.button("🗑️ Clear Config", type="secondary"):
        st.session_state.config = {"datasets": {}, "stories": {}, "pages": {}}
        st.rerun()
