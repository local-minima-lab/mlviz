/**
 * Parameter types - now auto-generated from backend Pydantic models.
 * These types are automatically synced with the FastAPI OpenAPI spec.
 *
 * To regenerate: npm run generate:types
 */
import type { components } from "./api";

// Export backend-generated types with frontend-friendly aliases
export type SelectOption = components["schemas"]["SelectParameterInfo"];
export type IntOption = components["schemas"]["IntParameterInfo"];
export type NumberOption = components["schemas"]["NumberParameterInfo"];
export type FloatOption = components["schemas"]["FloatParameterInfo"];
export type AnyOption = components["schemas"]["AnyParameterInfo"];

// Union type for all parameter options
export type ModelOption =
    | SelectOption
    | IntOption
    | NumberOption
    | FloatOption
    | AnyOption;
