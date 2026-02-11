/**
 * KMeans API Interface
 * Provides functions for interacting with the KMeans backend endpoints
 */

import { API_BASE_URL as BASE_URL } from "@/api/config";
import type { ParameterInfo } from "@/api/types";
import type { components } from "@/types/api";

// ============================================================================
// Type Aliases (auto-generated from OpenAPI spec)
// ============================================================================

type KMeansStepRequest = components["schemas"]["KMeansStepRequest"];
type KMeansStepResponse = components["schemas"]["KMeansStepResponse"];

type KMeansTrainRequest = components["schemas"]["KMeansTrainRequest"];
type KMeansTrainResponse = components["schemas"]["KMeansTrainResponse"];

type KMeansPredictRequest = components["schemas"]["KMeansPredictRequest"];
type KMeansPredictResponse = components["schemas"]["KMeansPredictResponse"];

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = `${BASE_URL}/api/kmeans`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Gets the available parameters for KMeans algorithm configuration.
 * Returns parameter metadata including types, constraints, and default values.
 *
 * @returns A promise resolving to an array of ParameterInfo objects
 * @throws Error if the HTTP request fails
 *
 * @example
 * const params = await getParameters();
 * // params contains: n_clusters, metric, feature_1, feature_2, etc.
 */
export const getParameters = async (): Promise<ParameterInfo[]> => {
    const response = await fetch(`${API_BASE_URL}/params`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

/**
 * Perform one K-Means iteration: assign points to centroids and update centroids.
 *
 * This endpoint takes user-provided centroids and:
 * 1. Assigns each data point to its nearest centroid
 * 2. Calculates new centroid positions as the mean of assigned points
 * 3. Returns all data needed for visualization
 *
 * Use this for step-by-step K-Means visualization where users can:
 * - Place initial centroids manually
 * - Step through iterations one at a time
 * - Observe how clusters evolve
 *
 * @param request Step request with parameters, centroids, and dataset
 * @returns A promise resolving to KMeansStepResponse with assignments, distances, updated centroids, and visualization data
 * @throws Error if the request fails or response is unsuccessful
 *
 * @example
 * const stepData = await step({
 *   parameters: { n_clusters: 3, metric: 'euclidean' },
 *   centroids: [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]],
 *   include_boundary: true
 * });
 */
export const step = async (
    request: Partial<KMeansStepRequest>
): Promise<KMeansStepResponse> => {
    const response = await fetch(`${API_BASE_URL}/step`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    const data: KMeansStepResponse = await response.json();

    if (!response.ok || !data.success) {
        const errorMessage =
            (data as any).message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return data;
};

/**
 * Run K-Means until convergence, returning all iterations.
 *
 * This endpoint takes user-provided initial centroids and:
 * 1. Runs K-Means iterations until convergence or max_iterations
 * 2. Returns data for ALL iterations for playback/animation
 * 3. Includes final results
 *
 * Use this when you want to:
 * - Animate the full K-Means algorithm
 * - Show convergence behavior
 * - Get final clustering results
 *
 * @param request Training request with parameters, initial centroids, dataset, and max_iterations
 * @returns A promise resolving to KMeansTrainResponse with all iterations, final centroids, and visualization data
 * @throws Error if the request fails or response is unsuccessful
 *
 * @example
 * const trainData = await train({
 *   parameters: { n_clusters: 3, metric: 'euclidean' },
 *   centroids: [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]],
 *   max_iterations: 100,
 *   include_boundary: true
 * });
 */
export const train = async (
    request: Partial<KMeansTrainRequest> = {}
): Promise<KMeansTrainResponse> => {
    const response = await fetch(`${API_BASE_URL}/train`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    const data: KMeansTrainResponse = await response.json();

    if (!response.ok || !data.success) {
        const errorMessage =
            (data as any).message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return data;
};

/**
 * Predict cluster assignments for query points given centroids.
 *
 * This endpoint assigns query points to their nearest centroid
 * and returns distance information for visualization.
 *
 * @param request Prediction request with parameters, centroids, and query points
 * @returns A promise resolving to KMeansPredictResponse with assignments and distances for query points
 * @throws Error if the request fails or response is unsuccessful
 *
 * @example
 * const predData = await predict({
 *   parameters: { metric: 'euclidean' },
 *   centroids: [[1.0, 2.0], [3.0, 4.0]],
 *   query_points: [[2.5, 3.0]]
 * });
 */
export const predict = async (
    request: Partial<KMeansPredictRequest>
): Promise<KMeansPredictResponse> => {
    const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    const data: KMeansPredictResponse = await response.json();

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
    KMeansPredictRequest,
    KMeansPredictResponse,
    KMeansStepRequest,
    KMeansStepResponse,
    KMeansTrainRequest,
    KMeansTrainResponse,
    ParameterInfo
};

