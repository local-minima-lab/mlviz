// src/context/ModelContext.tsx

import { trainModel as initiateTrainModel } from "@/api/dt";
import type { TrainingParameters } from "@/types/story";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import type { TrainModelResponse } from "../types/model";

// Define a key for localStorage to store training parameters
const LOCAL_STORAGE_PARAMS_KEY = "dt_last_trained_params";

/**
 * Defines the shape of the data and functions provided by the ModelContext.
 */
interface ModelContextType {
    isModelLoading: boolean;
    modelError: string | null;
    currentModelData: TrainModelResponse | null; // Stores the comprehensive data from train_model
    lastTrainedParams: TrainingParameters; // To keep track of params used for last successful training
    trainNewModel: (params: TrainingParameters) => Promise<void>;
    retrieveStoredModel: () => Promise<void>;
    clearStoredModelParams: () => void;
}

// Create the context with a default undefined value
const ModelContext = createContext<ModelContextType | undefined>(undefined);

/**
 * Props for the ModelProvider component.
 */
interface ModelProviderProps {
    children: ReactNode;
}

/**
 * Provides the ModelContext to its children components.
 * It manages the state and interactions with the model API.
 */
export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
    // FIX: Initialize isModelLoading to false.
    // It will be set to true by trainNewModel when an actual API call starts.
    const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
    const [modelError, setModelError] = useState<string | null>(null);
    const [currentModelData, setCurrentModelData] =
        useState<TrainModelResponse | null>(null);

    const [lastTrainedParams, setLastTrainedParams] =
        useState<TrainingParameters>(() => {
            const storedParams = localStorage.getItem(LOCAL_STORAGE_PARAMS_KEY);
            if (storedParams == null) return {};
            else return JSON.parse(storedParams as string);
        });

    /**
     * Triggers the training (or retrieval from cache) of a new model.
     * This will update `currentModelData` with the new model's details.
     */
    const trainNewModel = useCallback(
        async (params: TrainingParameters = {}) => {
            setIsModelLoading(true);
            setModelError(null);
            try {
                const data: TrainModelResponse = await initiateTrainModel(
                    params
                );

                setCurrentModelData(data);
                setLastTrainedParams(params);
                localStorage.setItem(
                    LOCAL_STORAGE_PARAMS_KEY,
                    JSON.stringify(params)
                );
            } catch (error) {
                console.error("Failed to train model:", error);
                setModelError(
                    error instanceof Error
                        ? error.message
                        : "Unknown error training model"
                );
                setCurrentModelData(null);
            } finally {
                setIsModelLoading(false);
            }
        },
        []
    );

    const retrieveStoredModel = useCallback(async () => {
        await trainNewModel(lastTrainedParams);
    }, [trainNewModel, lastTrainedParams]);

    const clearStoredModelParams = useCallback(() => {
        localStorage.removeItem(LOCAL_STORAGE_PARAMS_KEY);
        setLastTrainedParams({});
        setCurrentModelData(null);
        setModelError(null);
        setIsModelLoading(false);
    }, []);

    useEffect(() => {
        if (!currentModelData && !isModelLoading) {
            console.log(
                "Attempting initial model training with parameters:",
                lastTrainedParams
            );
            trainNewModel(lastTrainedParams);
        }
    }, [trainNewModel, currentModelData, isModelLoading, lastTrainedParams]);

    const contextValue: ModelContextType = {
        isModelLoading,
        modelError,
        currentModelData,
        lastTrainedParams,
        trainNewModel,
        retrieveStoredModel,
        clearStoredModelParams,
    };

    return (
        <ModelContext.Provider value={contextValue}>
            {children}
        </ModelContext.Provider>
    );
};

/**
 * Custom hook to consume the ModelContext.
 * Throws an error if used outside of a ModelProvider.
 */
export const useModel = () => {
    const context = useContext(ModelContext);
    if (context === undefined) {
        throw new Error("useModel must be used within a ModelProvider");
    }
    return context;
};
