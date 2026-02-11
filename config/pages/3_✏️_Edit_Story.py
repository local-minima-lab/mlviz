"""Edit Story Page - Modify existing stories"""

import sys
from pathlib import Path

import streamlit as st

# Add parent directory to path to import models
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Story

st.set_page_config(page_title="Edit Story", page_icon="✏️", layout="wide")

st.header("✏️ Edit Story")

# Initialize session state if not exists
if "config" not in st.session_state:
    st.session_state.config = {"datasets": {}, "stories": {}, "pages": {}}

# Check if there are any stories
if not st.session_state.config["stories"]:
    st.warning("⚠️ No stories found in config. Please add a story first!")
    st.stop()

# Select story to edit
st.subheader("Select Story to Edit")
story_names = list(st.session_state.config["stories"].keys())
selected_story_name = st.selectbox("Story", story_names)

if selected_story_name:
    # Load existing story data
    existing_story = st.session_state.config["stories"][selected_story_name]

    st.divider()
    st.subheader("Edit Story Details")

    # Story name (can be changed)
    new_story_name = st.text_input(
        "Story Name", value=selected_story_name, key="story_name_input"
    )

    col1, col2 = st.columns(2)

    with col1:
        name = st.text_input(
            "Name", value=existing_story.get("name", selected_story_name)
        )
        description = st.text_area(
            "Description", value=existing_story.get("description", "")
        )
        existing_nodes = existing_story.get("nodes", [])
        existing_start = existing_story.get("start_page", 0)
        start_page_index = st.number_input(
            "Start Page (node index)",
            min_value=0,
            max_value=max(len(existing_nodes) - 1, 0),
            value=min(existing_start, max(len(existing_nodes) - 1, 0)),
            help="Index of the node to use as the starting page",
        )

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
        st.error("Please add at least one page to the config before editing the story.")
        num_nodes = 0
    else:
        # Get existing nodes count
        existing_nodes = existing_story.get("nodes", [])
        num_nodes = st.number_input(
            "Number of nodes",
            min_value=1,
            max_value=20,
            value=len(existing_nodes) if existing_nodes else 1,
        )

    nodes_data = []
    for i in range(num_nodes):
        with st.expander(f"Node {i + 1}", expanded=(i == 0)):
            # Show available pages as selectbox
            page_options = {}
            for page_id in available_pages:
                page = st.session_state.config["pages"][page_id]
                display_name = page.get("name")
                if not display_name:
                    display_name = page.get("page_type", "unknown")
                page_options[page_id] = f"{page_id} - {display_name}"

            # Pre-select existing node if available
            default_page = None
            if i < len(existing_nodes):
                default_page = existing_nodes[i].get("index")
                if default_page not in available_pages:
                    st.warning(
                        f"⚠️ Original page {default_page} no longer exists in config"
                    )
                    default_page = None

            selected_page = st.selectbox(
                f"Select Page for Node {i + 1}",
                options=list(page_options.keys()),
                format_func=lambda x: page_options[x],
                index=list(page_options.keys()).index(default_page)
                if default_page and default_page in page_options
                else 0,
                key=f"node_page_{i}",
            )

            # Show page preview
            if selected_page:
                st.json(st.session_state.config["pages"][selected_page])
                nodes_data.append({"index": selected_page})

    # Edges section
    st.divider()
    st.subheader("Edges")

    existing_edges = existing_story.get("edges", [])

    # Option to keep existing edges or recreate
    edge_mode = st.radio(
        "Edge editing mode",
        ["Keep existing edges", "Recreate edges"],
        help="Keep existing: preserves current edges. Recreate: allows you to redefine all edges.",
    )

    edges_data = []

    if edge_mode == "Keep existing edges":
        edges_data = existing_edges
        st.info(f"📌 Keeping {len(existing_edges)} existing edge(s)")
        if existing_edges:
            with st.expander("View existing edges"):
                st.json(existing_edges)

    else:  # Recreate edges
        add_edges = st.checkbox(
            "Add edges to this story", value=len(existing_edges) > 0
        )

        if add_edges:
            num_edges = st.number_input(
                "Number of edges",
                min_value=1,
                max_value=10,
                value=max(1, len(existing_edges)),
            )

            for i in range(num_edges):
                with st.expander(f"Edge {i + 1}", expanded=(i == 0)):
                    col_a, col_b = st.columns(2)

                    # Get existing edge data if available
                    existing_edge = (
                        existing_edges[i] if i < len(existing_edges) else None
                    )

                    with col_a:
                        st.markdown("**Start Node**")
                        default_start_idx = (
                            existing_edge.get("start", {}).get("local_index", 0)
                            if existing_edge
                            else 0
                        )
                        start_local_index = st.number_input(
                            "Local Index",
                            min_value=0,
                            value=default_start_idx,
                            key=f"start_idx_{i}",
                        )
                        default_start_story = (
                            existing_edge.get("start", {}).get("story_name", "")
                            if existing_edge
                            else ""
                        )
                        start_story_name = st.text_input(
                            "Story Name (optional)",
                            value=default_start_story,
                            key=f"start_story_{i}",
                            placeholder="Leave empty for current story",
                        )

                    with col_b:
                        st.markdown("**End Node**")
                        default_end_idx = (
                            existing_edge.get("end", {}).get("local_index", 0)
                            if existing_edge
                            else 0
                        )
                        end_local_index = st.number_input(
                            "Local Index",
                            min_value=0,
                            value=default_end_idx,
                            key=f"end_idx_{i}",
                        )
                        default_end_story = (
                            existing_edge.get("end", {}).get("story_name", "")
                            if existing_edge
                            else ""
                        )
                        end_story_name = st.text_input(
                            "Story Name (optional)",
                            value=default_end_story,
                            key=f"end_story_{i}",
                            placeholder="Leave empty for current story",
                        )

                    # Condition
                    st.markdown("**Condition**")

                    # Get existing condition type
                    default_condition_type = "Bypass"
                    if existing_edge and "condition" in existing_edge:
                        default_condition_type = existing_edge["condition"].get(
                            "condition_type", "Bypass"
                        )

                    condition_types = [
                        "Bypass",
                        "Parameter",
                        "Time",
                        "Button",
                        "Lambda",
                        "Slide",
                    ]
                    condition_type = st.selectbox(
                        "Condition Type",
                        condition_types,
                        index=condition_types.index(default_condition_type)
                        if default_condition_type in condition_types
                        else 0,
                        key=f"cond_type_{i}",
                    )

                    condition = None
                    existing_condition = (
                        existing_edge.get("condition", {}) if existing_edge else {}
                    )

                    cond_name = st.text_input(
                        "Display Name (optional)",
                        value=existing_condition.get("name", "") or "",
                        key=f"cond_name_{i}",
                        placeholder="Override navigation button title",
                    )
                    cond_description = st.text_area(
                        "Display Description (optional)",
                        value=existing_condition.get("description", "") or "",
                        key=f"cond_desc_{i}",
                        placeholder="Override navigation button description",
                    )

                    if condition_type == "Bypass":
                        condition = {"condition_type": "Bypass"}

                    elif condition_type == "Parameter":
                        col_p1, col_p2, col_p3 = st.columns(3)
                        with col_p1:
                            category = st.text_input(
                                "Category",
                                value=existing_condition.get("category", ""),
                                key=f"cat_{i}",
                            )
                        with col_p2:
                            parameter = st.text_input(
                                "Parameter",
                                value=existing_condition.get("parameter", ""),
                                key=f"param_{i}",
                            )
                        with col_p3:
                            comparators = ["<", "<=", ">=", ">", "="]
                            default_comp = existing_condition.get("comparator", "<")
                            comparator = st.selectbox(
                                "Comparator",
                                comparators,
                                index=comparators.index(default_comp)
                                if default_comp in comparators
                                else 0,
                                key=f"comp_{i}",
                            )
                        value = st.text_input(
                            "Value",
                            value=str(existing_condition.get("value", "")),
                            key=f"val_{i}",
                        )

                        condition = {
                            "condition_type": "Parameter",
                            "category": category,
                            "parameter": parameter,
                            "comparator": comparator,
                            "value": value,
                        }

                    elif condition_type == "Time":
                        wait = st.number_input(
                            "Wait (seconds)",
                            min_value=0,
                            value=existing_condition.get("wait", 5),
                            key=f"wait_{i}",
                        )
                        condition = {"condition_type": "Time", "wait": wait}

                    elif condition_type == "Button":
                        button_id = st.text_input(
                            "Button ID",
                            value=existing_condition.get("button_id", ""),
                            key=f"btn_{i}",
                        )
                        condition = {"condition_type": "Button", "button_id": button_id}

                    elif condition_type == "Lambda":
                        exec_str = st.text_area(
                            "Lambda Expression",
                            value=existing_condition.get("exec_str", ""),
                            key=f"lambda_{i}",
                            placeholder="e.g., x > 5",
                        )
                        condition = {"condition_type": "Lambda", "exec_str": exec_str}

                    elif condition_type == "Slide":
                        slide_name = st.text_input(
                            "Slide Name",
                            value=existing_condition.get("slide_name", ""),
                            key=f"slide_name_{i}",
                        )
                        slide_desc = st.text_input(
                            "Slide Description (optional)",
                            value=existing_condition.get("slide_description", "") or "",
                            key=f"slide_desc_{i}",
                        )
                        condition = {
                            "condition_type": "Slide",
                            "slide_name": slide_name,
                            "slide_description": slide_desc if slide_desc else None,
                        }

                    # Add optional display overrides
                    if condition is not None:
                        if cond_name:
                            condition["name"] = cond_name
                        if cond_description:
                            condition["description"] = cond_description

                    # Build edge
                    edge = {
                        "start": {
                            "local_index": start_local_index,
                            "story_name": start_story_name
                            if start_story_name
                            else None,
                        },
                        "end": {
                            "local_index": end_local_index,
                            "story_name": end_story_name if end_story_name else None,
                        },
                        "condition": condition,
                    }
                    edges_data.append(edge)

    # Update button
    st.divider()
    col_btn1, col_btn2 = st.columns([1, 1])

    with col_btn1:
        if st.button("💾 Update Story", type="primary", use_container_width=True):
            if not new_story_name:
                st.error("Please provide a story name")
            elif not nodes_data:
                st.error("Please add at least one node to the story")
            else:
                try:
                    story_data = {
                        "name": name or new_story_name,
                        "description": description,
                        "start_page": start_page_index,
                        "nodes": nodes_data,
                        "edges": edges_data,
                    }

                    # Validate with Pydantic
                    story = Story.model_validate(story_data)

                    # If story name changed, remove old entry
                    if new_story_name != selected_story_name:
                        del st.session_state.config["stories"][selected_story_name]

                    # Update config
                    st.session_state.config["stories"][new_story_name] = (
                        story.model_dump()
                    )

                    st.success(
                        f"✅ Story '{new_story_name}' updated with {len(nodes_data)} node(s) and {len(edges_data)} edge(s)!"
                    )
                    st.json(story.model_dump())

                except Exception as e:
                    st.error(f"Error: {str(e)}")

    with col_btn2:
        if st.button("🗑️ Delete Story", type="secondary", use_container_width=True):
            if st.session_state.get("confirm_delete") == selected_story_name:
                del st.session_state.config["stories"][selected_story_name]
                st.session_state.confirm_delete = None
                st.success(f"✅ Story '{selected_story_name}' deleted!")
                st.rerun()
            else:
                st.session_state.confirm_delete = selected_story_name
                st.warning("⚠️ Click again to confirm deletion")
