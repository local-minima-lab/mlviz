/**
 * Model types - now auto-generated from backend Pydantic models.
 * These types are automatically synced with the FastAPI OpenAPI spec.
 *
 * To regenerate: npm run generate:types
 */
import type { components } from "./api";

// Core tree structure types (auto-synced with backend)
export type TreeNode = components["schemas"]["TreeNode"];
export type HistogramData = components["schemas"]["HistogramData"];

// Metrics/scores types
export type ModelScores = components["schemas"]["BaseMetrics"];

export interface ModelMetadata {
    created_at: string;
    dataset_info: any;
    feature_names: string[];      // ✅ Critical for prediction!
    class_names: string[];       // ✅ Also needed for prediction
    // Sklearn parameters
    max_depth?: number;
    criterion?: string;
    min_samples_split?: number;
    min_samples_leaf?: number;
    random_state?: number;
    max_features?: string | number | null;
}

// Training response type (auto-synced with backend DecisionTreeTrainingResponse)
export type TrainModelResponse = components["schemas"]["DecisionTreeTrainingResponse"];

export interface PredictionProps {
    data?: Record<string, any>;
    points?: Record<string, any>;
}
