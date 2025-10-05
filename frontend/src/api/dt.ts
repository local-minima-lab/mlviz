import type { TrainModelResponse } from "@/types/model";
import type { ModelOption } from "@/types/parameters";
import type { TrainingParameters } from "@/types/story";

const API_BASE_URL = "/api/dt"; // Adjust if your Flask app is on a different origin

/**
 * Gets the parameters of the decision tree parameters.
 * @returns A promise resolving to ModelStatusResponse.
 */
export const getParameters = async (): Promise<ModelOption[]> => {
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
 * @returns A promise resolving to TrainModelResponse, which includes all model details and performance metrics.
 */
export const trainModel = async (
    params: TrainingParameters = {}
): Promise<TrainModelResponse> => {
    const response = await fetch(`${API_BASE_URL}/train`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });

    const data: TrainModelResponse = await response.json();

    if (!response.ok || !data.success) {
        const errorMessage =
            (data as any).message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return data;
};

/**
 * Gets the parameters of the decision tree model parameters.
 * @returns A promise resolving to ModelStatusResponse.
 */
export const getPredictParameters = async (): Promise<Record<string, any>> => {
    const response = await fetch(`${API_BASE_URL}/predict_params`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!response.ok || !data.success) {
        const errorMessage =
            (data as any).message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return data;
};
