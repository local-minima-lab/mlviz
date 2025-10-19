// src/context/ModelContext.tsx

import { trainModel as initiateTrainModel } from "@/api/dt";
import type { Parameters } from "@/types/story";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import type { TrainModelResponse } from "../types/model";

const LOCAL_STORAGE_PARAMS_KEY = "params";

interface ModelContextType {
    isModelLoading: boolean;
    modelError: string | null;
    currentModelData: TrainModelResponse | null;
    lastTrainedParams: Parameters;
    trainNewModel: (params: Parameters) => Promise<void>;
    retrieveStoredModel: () => Promise<void>;
    clearStoredModelParams: () => void;
    // Helper methods for prediction components
    getFeatureNames: () => string[] | null;
    getClassNames: () => string[] | null;
    getModelKey: () => string | null;
    isModelReady: () => boolean;
}

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
    const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
    const [modelError, setModelError] = useState<string | null>(null);
    const [currentModelData, setCurrentModelData] =
        useState<TrainModelResponse | null>(null);

    const [lastTrainedParams, setLastTrainedParams] = useState<Parameters>(
        () => {
            const storedParams = localStorage.getItem(LOCAL_STORAGE_PARAMS_KEY);
            if (storedParams == null) return {};
            else return JSON.parse(storedParams as string);
        }
    );

    const trainNewModel = useCallback(async (params: Parameters = {}) => {
        setIsModelLoading(true);
        setModelError(null);
        try {
            const data: TrainModelResponse = await initiateTrainModel(params);

            if (data.success) {
                setCurrentModelData(data);
                setLastTrainedParams(params);
                localStorage.setItem(
                    LOCAL_STORAGE_PARAMS_KEY,
                    JSON.stringify(params)
                );
            } else {
                throw new Error(
                    "Training failed - API returned success: false"
                );
            }
        } catch (error) {
            console.error("❌ Failed to train model:", error);
            setModelError(
                error instanceof Error
                    ? error.message
                    : "Unknown error training model"
            );
            setCurrentModelData(null);
        } finally {
            setIsModelLoading(false);
        }
    }, []);

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
        if (
            !currentModelData &&
            !isModelLoading &&
            Object.keys(lastTrainedParams).length > 0
        ) {
            trainNewModel(lastTrainedParams);
        } else if (!currentModelData && !isModelLoading) {
        }
    }, [currentModelData, isModelLoading, lastTrainedParams]);

    // Helper functions for prediction components
    const getFeatureNames = useCallback((): string[] | null => {
        if (!currentModelData?.metadata?.feature_names) {
            return null;
        }
        return currentModelData.metadata.feature_names;
    }, [currentModelData]);

    const getClassNames = useCallback((): string[] | null => {
        if (!currentModelData?.classes) {
            return null;
        }
        return currentModelData.classes;
    }, [currentModelData]);

    const getModelKey = useCallback((): string | null => {
        return currentModelData?.model_key || null;
    }, [currentModelData]);

    const isModelReady = useCallback((): boolean => {
        const ready = !!(
            currentModelData?.success &&
            currentModelData?.metadata?.feature_names &&
            currentModelData?.classes
        );

        return ready;
    }, [currentModelData]);

    const contextValue: ModelContextType = {
        isModelLoading,
        modelError,
        currentModelData,
        lastTrainedParams,
        trainNewModel,
        retrieveStoredModel,
        clearStoredModelParams,
        // Helper methods for prediction components
        getFeatureNames,
        getClassNames,
        getModelKey,
        isModelReady,
    };

    return (
        <ModelContext.Provider value={contextValue}>
            {children}
        </ModelContext.Provider>
    );
};

export const useModel = () => {
    const context = useContext(ModelContext);
    if (context === undefined) {
        throw new Error("useModel must be used within a ModelProvider");
    }
    return context;
};
