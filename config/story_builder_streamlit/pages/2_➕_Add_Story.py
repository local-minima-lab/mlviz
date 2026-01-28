"""Add Story Page - Create new stories with nodes and edges"""
import streamlit as st
import sys
from pathlib import Path

# Add parent directory to path to import models
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Story

st.set_page_config(page_title="Add Story", page_icon="➕", layout="wide")

st.header("Add Story")

# Initialize session state if not exists
if 'config' not in st.session_state:
    st.session_state.config = {"stories": {}, "pages": {}}

story_name = st.text_input("Story Name", placeholder="e.g., intro")

col1, col2 = st.columns(2)

with col1:
    name = st.text_input("Name", value=story_name)
    description = st.text_area("Description", placeholder="Story description")

with col2:
    # Get available pages
    available_pages = list(st.session_state.config["pages"].keys())
    if available_pages:
        st.info(f"📄 {len(available_pages)} page(s) available in config")
    else:
        st.warning("⚠️ No pages in config yet. Add pages first!")

# Nodes section
st.divider()
st.subheader("Nodes")

if not available_pages:
    st.error("Please add at least one page to the config before creating a story.")
    num_nodes = 0
else:
    num_nodes = st.number_input("Number of nodes", min_value=1, max_value=20, value=1)

nodes_data = []
for i in range(num_nodes):
    with st.expander(f"Node {i+1}", expanded=(i==0)):
        # Show available pages as selectbox
        # Show available pages as selectbox
        page_options = {}
        for page_id in available_pages:
            page = st.session_state.config['pages'][page_id]
            display_name = page.get('name')
            if not display_name:
                display_name = page.get('page_type', 'unknown')
            page_options[page_id] = f"{page_id} - {display_name}"
        
        selected_page = st.selectbox(
            f"Select Page for Node {i+1}",
            options=list(page_options.keys()),
            format_func=lambda x: page_options[x],
            key=f"node_page_{i}"
        )
        
        # Show page preview
        if selected_page:
            st.json(st.session_state.config["pages"][selected_page])
            nodes_data.append({"index": int(selected_page)})

# Edges section
st.divider()
st.subheader("Edges (Optional)")

add_edges = st.checkbox("Add edges to this story")

edges_data = []
if add_edges:
    if not available_pages:
        st.warning("⚠️ No pages available. Add pages first to create edges.")
    else:
        num_edges = st.number_input("Number of edges", min_value=1, max_value=10, value=1)
        
        for i in range(num_edges):
            with st.expander(f"Edge {i+1}", expanded=(i==0)):
                col_a, col_b = st.columns(2)
                
                with col_a:
                    st.markdown("**Start Node**")
                    
                    # Option to select from pages or enter manually
                    start_mode = st.radio("Start node selection", ["Select from pages", "Manual index"], key=f"start_mode_{i}", horizontal=True)
                    
                    if start_mode == "Select from pages":
                        page_options = {}
                        for page_id in available_pages:
                            page = st.session_state.config['pages'][page_id]
                            display_name = page.get('name')
                            if not display_name:
                                display_name = page.get('page_type', 'unknown')
                            page_options[page_id] = f"{page_id} - {display_name}"
                        start_page_id = st.selectbox(
                            "Start Page",
                            options=list(page_options.keys()),
                            format_func=lambda x: page_options[x],
                            key=f"start_page_sel_{i}"
                        )
                        start_local_index = int(start_page_id)
                    else:
                        start_local_index = st.number_input(f"Start Local Index", min_value=0, value=0, key=f"start_idx_{i}")
                    
                    start_story_name = st.text_input(f"Start Story Name (optional)", key=f"start_story_{i}", placeholder="Leave empty for current story")
                
                with col_b:
                    st.markdown("**End Node**")
                    
                    # Option to select from pages or enter manually
                    end_mode = st.radio("End node selection", ["Select from pages", "Manual index"], key=f"end_mode_{i}", horizontal=True)
                    
                    if end_mode == "Select from pages":
                        page_options = {}
                        for page_id in available_pages:
                            page = st.session_state.config['pages'][page_id]
                            display_name = page.get('name')
                            if not display_name:
                                display_name = page.get('page_type', 'unknown')
                            page_options[page_id] = f"{page_id} - {display_name}"
                        end_page_id = st.selectbox(
                            "End Page",
                            options=list(page_options.keys()),
                            format_func=lambda x: page_options[x],
                            key=f"end_page_sel_{i}"
                        )
                        end_local_index = int(end_page_id)
                    else:
                        end_local_index = st.number_input(f"End Local Index", min_value=0, value=0, key=f"end_idx_{i}")
                    
                    end_story_name = st.text_input(f"End Story Name (optional)", key=f"end_story_{i}", placeholder="Leave empty for current story")
            
            # Condition
            st.markdown("**Condition**")
            condition_type = st.selectbox(
                "Condition Type",
                ["Bypass", "Parameter", "Time", "Button", "Lambda", "Slide"],
                key=f"cond_type_{i}"
            )
            
            condition = None
            if condition_type == "Bypass":
                condition = {"condition_type": "Bypass"}
            
            elif condition_type == "Parameter":
                col_p1, col_p2, col_p3 = st.columns(3)
                with col_p1:
                    category = st.text_input("Category", key=f"cat_{i}")
                with col_p2:
                    parameter = st.text_input("Parameter", key=f"param_{i}")
                with col_p3:
                    comparator = st.selectbox("Comparator", ["<", "<=", ">=", ">", "="], key=f"comp_{i}")
                value = st.text_input("Value", key=f"val_{i}")
                
                condition = {
                    "condition_type": "Parameter",
                    "category": category,
                    "parameter": parameter,
                    "comparator": comparator,
                    "value": value
                }
            
            elif condition_type == "Time":
                wait = st.number_input("Wait (seconds)", min_value=0, value=5, key=f"wait_{i}")
                condition = {
                    "condition_type": "Time",
                    "wait": wait
                }
            
            elif condition_type == "Button":
                button_id = st.text_input("Button ID", key=f"btn_{i}")
                condition = {
                    "condition_type": "Button",
                    "button_id": button_id
                }
            
            elif condition_type == "Lambda":
                exec_str = st.text_area("Lambda Expression", key=f"lambda_{i}", placeholder="e.g., x > 5")
                condition = {
                    "condition_type": "Lambda",
                    "exec_str": exec_str
                }
            
            elif condition_type == "Slide":
                slide_name = st.text_input("Slide Name", key=f"slide_name_{i}")
                slide_desc = st.text_input("Slide Description (optional)", key=f"slide_desc_{i}")
                condition = {
                    "condition_type": "Slide",
                    "slide_name": slide_name,
                    "slide_description": slide_desc if slide_desc else None
                }
            
            # Build edge
            edge = {
                "start": {
                    "local_index": start_local_index,
                    "story_name": start_story_name if start_story_name else None
                },
                "end": {
                    "local_index": end_local_index,
                    "story_name": end_story_name if end_story_name else None
                },
                "condition": condition
            }
            edges_data.append(edge)
    
if st.button("➕ Add Story", type="primary"):
    if not story_name:
        st.error("Please provide a story name")
    elif not nodes_data:
        st.error("Please add at least one node to the story")
    else:
        try:
            # Use the first node's index as start_page
            start_page = nodes_data[0]["index"]
            
            story_data = {
                "name": name or story_name,
                "description": description,
                "start_page": start_page,
                "nodes": nodes_data,
                "edges": edges_data
            }
            
            # Validate with Pydantic
            story = Story.model_validate(story_data)
            
            # Add to config
            st.session_state.config["stories"][story_name] = story.model_dump()
            
            st.success(f"✅ Story '{story_name}' added with {len(nodes_data)} node(s) and {len(edges_data)} edge(s)!")
            st.json(story.model_dump())
            
        except Exception as e:
            st.error(f"Error: {str(e)}")
