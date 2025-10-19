import type { ParameterInfo } from "@/api/types";
import type { components } from "@/types/api";

// Type aliases: auto generated from OpenAPI spec.

export type DecisionTreeRequest =
    components["schemas"]["DecisionTreeTrainingRequest"];
export type DecisionTreeResponse =
    components["schemas"]["DecisionTreeTrainingResponse"];

const API_BASE_URL = "/api/dt";

/**
 * Gets the parameters of the decision tree parameters.
 * @returns A promise resolving to ModelStatusResponse.
 */
export const getParameters = async (): Promise<ParameterInfo[]> => {
    const response = await fetch(`${API_BASE_URL}/train_params`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

/**
 * Initiates model training and retrieves its initial metrics and tree structure.
 * This function also leverages the backend's caching mechanism,
 * so it will return a cached model if one exists for the given parameters.
 * @param params Optional parameters for training the model. Defaults to server-side defaults if not provided.
 * @returns A promise resolving to DecisionTreeResponse, which includes all model details and performance metrics.
 */
export const trainModel = async (
    params: Partial<DecisionTreeRequest> = {}
): Promise<DecisionTreeResponse> => {
    const response = await fetch(`${API_BASE_URL}/train`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });

    const data: DecisionTreeResponse = await response.json();

    if (!response.ok || !data.success) {
        const errorMessage =
            (data as any).message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return data;
};

/**
 * Gets the feature names for prediction based on training parameters.
 * @param request Training request parameters to determine the dataset
 * @returns A promise resolving to an array of feature names
 */
export const getPredictParameters = async (
    request: Partial<DecisionTreeRequest>
): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/predict_params`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};
