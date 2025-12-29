"""
Generate OpenAPI specification from FastAPI app.
This script exports the OpenAPI schema to a JSON file for type generation.
"""
import json
from pathlib import Path
from app import app

def generate_openapi_spec():
    """Generate and save OpenAPI specification."""
    openapi_schema = app.openapi()

    # Save to backend directory
    output_path = Path(__file__).parent / "openapi.json"

    with open(output_path, "w") as f:
        json.dump(openapi_schema, f, indent=2)

    print(f"✅ OpenAPI specification generated at: {output_path}")
    print(f"   Total endpoints: {len(openapi_schema.get('paths', {}))}")
    print(f"   Total schemas: {len(openapi_schema.get('components', {}).get('schemas', {}))}")

if __name__ == "__main__":
    generate_openapi_spec()
