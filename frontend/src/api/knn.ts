/**
 * KNN API Interface
 * Provides functions for interacting with the KNN backend endpoints
 */

import type { ParameterInfo } from "@/api/types";
import type { components } from "@/types/api";

// ============================================================================
// Type Aliases (auto-generated from OpenAPI spec)
// ============================================================================

type KNNVisualisationRequest = components["schemas"]["KNNVisualisationRequest"];
type KNNVisualisationResponse =
    components["schemas"]["KNNVisualisationResponse"];

type KNNPredictionRequest = components["schemas"]["KNNPredictionRequest"];
type KNNPredictionResponse = components["schemas"]["KNNPredictionResponse"];

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = "/api/knn";

// ============================================================================
// API Functions
// ============================================================================

/**
 * Gets the available parameters for KNN algorithm configuration.
 * Returns parameter metadata including types, constraints, and default values.
 *
 * @returns A promise resolving to an array of ParameterInfo objects
 * @throws Error if the HTTP request fails
 *
 * @example
 * const params = await getParameters();
 * // params contains: n_neighbors, weights, algorithm, metric, etc.
 */
export const getParameters = async (): Promise<ParameterInfo[]> => {
    const response = await fetch(`${API_BASE_URL}/params`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

/**
 * Gets KNN visualization data for exploring the training dataset.
 * Shows training points with decision boundaries based on K parameter.
 *
 * This endpoint does NOT require query points - it's used for initial
 * dataset exploration and understanding how K affects decision boundaries.
 *
 * @param request Optional request parameters including:
 *   - parameters: KNN algorithm parameters (n_neighbors, weights, etc.)
 *   - dataset: Training data (X, y, feature_names, class_names)
 * @returns A promise resolving to KNNVisualisationResponse with:
 *   - training_points: All training data points
 *   - training_labels: Labels for each training point
 *   - decision_boundary: Mesh points and predictions for visualization
 *   - feature_names, class_names, n_dimensions: Metadata
 * @throws Error if the request fails or response is unsuccessful
 *
 * @example
 * const vizData = await getVisualisation({
 *   parameters: { n_neighbors: 5, weights: 'uniform' },
 *   dataset: { X: [...], y: [...], feature_names: [...] }
 * });
 */
export const getVisualisation = async (
    request: Partial<KNNVisualisationRequest> = {}
): Promise<KNNVisualisationResponse> => {
    const response = await fetch(`${API_BASE_URL}/visualise`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    const data: KNNVisualisationResponse = await response.json();

    if (!response.ok || !data.success) {
        const errorMessage =
            (data as any).message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return data;
};

/**
 * Makes KNN predictions for query points and returns visualization data.
 *
 * KNN is a lazy learner - there's no explicit training phase. This endpoint
 * fits the model on the training data and immediately makes predictions for
 * the provided query points, returning detailed neighbor information.
 *
 * @param request Prediction request including:
 *   - parameters: KNN algorithm parameters (n_neighbors, weights, etc.)
 *   - dataset: Training data (defaults to Iris if not provided)
 *   - query_points: Points to classify
 * @returns A promise resolving to KNNPredictionResponse with:
 *   - predictions: Predicted class labels for each query
 *   - prediction_indices: Predicted class indices
 *   - neighbors_info: K-nearest neighbors for each query (index + distance)
 *   - all_distances: Distance from each query to all training points
 *   - training_points, training_labels: Complete training set
 *   - decision_boundary: Optional decision boundary visualization
 * @throws Error if the request fails or response is unsuccessful
 *
 * @example
 * const predData = await predict({
 *   parameters: { n_neighbors: 3 },
 *   query_points: [[5.1, 3.5], [6.2, 2.9]]
 * });
 * // predData.predictions: ['setosa', 'versicolor']
 * // predData.neighbors_info[0]: [{ index: 0, distance: 0.14 }, ...]
 */
export const predict = async (
    request: Partial<KNNPredictionRequest>
): Promise<KNNPredictionResponse> => {
    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    const data: KNNPredictionResponse = await response.json();

    if (!response.ok || !data.success) {
        const errorMessage =
            (data as any).message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return data;
};

// ============================================================================
// Export Types (for consumer convenience)
// ============================================================================

export type {
    KNNPredictionRequest,
    KNNPredictionResponse,
    KNNVisualisationRequest,
    KNNVisualisationResponse,
    ParameterInfo,
};
