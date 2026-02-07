import { API_BASE_URL as BASE_URL } from "@/api/config";

import type { components } from "@/types/api";

const API_BASE_URL = `${BASE_URL}/api/dataset`;

export type DatasetResponse = components["schemas"]["DatasetResponse"];

/**
 * Load a dataset with default parameters
 * @param name Dataset name (defaults to "iris")
 * @returns Promise resolving to dataset with features, labels, and metadata
 */
export const loadDataset = async (
    name: string = "iris"
): Promise<DatasetResponse> => {
    const response = await fetch(`${API_BASE_URL}/load?name=${name}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};
