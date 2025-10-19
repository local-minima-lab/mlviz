/**
 * Decision Tree Model Context
 * Manages state and API interactions for Decision Tree visualizations
 * Renamed from ModelContext to be explicit about model type
 */

import {
    trainModel as initiateTrainModel,
    type DecisionTreeResponse,
} from "@/api/dt";
import type { Parameters } from "@/types/story";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

const LOCAL_STORAGE_PARAMS_KEY = "dt_params";

interface DecisionTreeContextType {
    isModelLoading: boolean;
    modelError: string | null;
    currentModelData: DecisionTreeResponse | null;
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

const DecisionTreeContext = createContext<DecisionTreeContextType | undefined>(
    undefined
);

/**
 * Props for the DecisionTreeProvider component.
 */
interface DecisionTreeProviderProps {
    children: ReactNode;
}

/**
 * Provides the DecisionTreeContext to its children components.
 * It manages the state and interactions with the Decision Tree API.
 */
export const DecisionTreeProvider: React.FC<DecisionTreeProviderProps> = ({
    children,
}) => {
    const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
    const [modelError, setModelError] = useState<string | null>(null);
    const [currentModelData, setCurrentModelData] =
        useState<DecisionTreeResponse | null>(null);

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
            const data: DecisionTreeResponse = await initiateTrainModel(params);

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
        }
    }, []);

    // Helper functions for prediction components
    const getFeatureNames = useCallback((): string[] | null => {
        if (!currentModelData?.metadata?.feature_names) {
            return null;
        }
        return currentModelData.metadata.feature_names as string[];
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

    const contextValue: DecisionTreeContextType = {
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
        <DecisionTreeContext.Provider value={contextValue}>
            {children}
        </DecisionTreeContext.Provider>
    );
};

export const useDecisionTree = () => {
    const context = useContext(DecisionTreeContext);
    if (context === undefined) {
        throw new Error(
            "useDecisionTree must be used within a DecisionTreeProvider"
        );
    }
    return context;
};
