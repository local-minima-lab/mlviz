import hashlib
from typing import Union, TYPE_CHECKING
import json

if TYPE_CHECKING:
    from .config import PageUnion
    from .story import Story

def compute_object_hash(item: Union["PageUnion", "Story"]) -> str:
    # Convert model to dict
    item_dict = item.model_dump()

    # Remove 'name' field if present to ensure hash is independent of name
    if "name" in item_dict:
        del item_dict["name"]

    # Serialize to JSON with sorted keys for consistency
    item_json = json.dumps(item_dict, sort_keys=True)

    sha256_hash = hashlib.sha256(item_json.encode()).hexdigest()
    return str(int(sha256_hash[:8], 16))

def create_page_dict(pages: list["PageUnion"]):
    return {compute_object_hash(p): p for p in pages}
