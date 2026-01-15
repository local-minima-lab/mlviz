/**
 * KNN Model Context
 * Manages state and API interactions for KNN visualizations
 * Follows the same pattern as ModelContext (Decision Tree)
 */

import {
    getVisualisation,
    predict,
    type KNNPredictionRequest,
    type KNNPredictionResponse,
    type KNNVisualisationRequest,
    type KNNVisualisationResponse,
} from "@/api/knn";
import type { ParameterInfo } from "@/api/types";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    type ReactNode
} from "react";
import { createBaseModelContext, type BaseModelData } from "./BaseModelContext";

// Define comprehensive KNN model data type
interface KNNModelData extends BaseModelData {
    // Visualization data (primary model state)
    visualizationData: KNNVisualisationResponse | null;
    isVisualizationLoading: boolean;
    visualizationError: string | null;
    
    // Prediction data
    predictionData: KNNPredictionResponse | null;
    isPredictionLoading: boolean;
    predictionError: string | null;
    queryPoints: number[][] | null;
}

// Create base context instance for KNN
const { Provider: BaseProvider, useBaseModel } = createBaseModelContext<KNNModelData>({
    localStorageKey: "knn_model_data",
    paramsStorageKey: "knn_params",
    // TODO: Replace with actual getParameters from @/api/knn when backend endpoint is ready
    getParameters: async () => {
        console.warn('[KNNContext] getParameters API not yet implemented');
        return [];
    },
});

// ============================================================================
// Types
// ============================================================================

interface KNNContextType {
    // Visualization (training) state
    isVisualizationLoading: boolean;
    visualizationError: string | null;
    visualizationData: KNNVisualisationResponse | null;
    lastVisualizationParams: Partial<KNNVisualisationRequest>;

    // Prediction state
    isPredictionLoading: boolean;
    predictionError: string | null;
    predictionData: KNNPredictionResponse | null;
    queryPoints: number[][] | null;

    // Visualization methods
    loadVisualization: (
        params?: Partial<KNNVisualisationRequest>
    ) => Promise<void>;
    clearVisualization: () => void;

    // Prediction methods
    makePrediction: (request: Partial<KNNPredictionRequest>) => Promise<void>;
    clearPrediction: () => void;

    // Helper methods
    getFeatureNames: () => string[] | null;
    getClassNames: () => string[] | null;
    getK: () => number | null;
    isVisualizationReady: () => boolean;
    getParameters: () => Promise<ParameterInfo[]>;
    
    // Reset method
    resetModelData: () => void;
}

const KNNContext = createContext<KNNContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface KNNProviderProps {
    children: ReactNode;
}

export const KNNProvider: React.FC<KNNProviderProps> = ({ children }) => {
    return (
        <BaseProvider>
            <KNNProviderInner>
                {children}
            </KNNProviderInner>
        </BaseProvider>
    );
};

const KNNProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
    const baseContext = useBaseModel();
    const { currentModelData, lastParams, setCurrentModelData, setLastParams, resetModelData: baseResetModelData, getParameters } = baseContext;

    // Extract values from currentModelData or use defaults
    const visualizationData = currentModelData?.visualizationData || null;
    const isVisualizationLoading = currentModelData?.isVisualizationLoading || false;
    const visualizationError = currentModelData?.visualizationError || null;
    const predictionData = currentModelData?.predictionData || null;
    const isPredictionLoading = currentModelData?.isPredictionLoading || false;
    const predictionError = currentModelData?.predictionError || null;
    const queryPoints = currentModelData?.queryPoints || null;

    // ========================================================================
    // Visualization Methods
    // ========================================================================

    const loadVisualization = useCallback(
        async (request: Partial<KNNVisualisationRequest> = {}) => {
            // Update loading state
            setCurrentModelData({
                ...(currentModelData || {
                    visualizationData: null,
                    isVisualizationLoading: false,
                    visualizationError: null,
                    predictionData: null,
                    isPredictionLoading: false,
                    predictionError: null,
                    queryPoints: null,
                }),
                isVisualizationLoading: true,
                visualizationError: null,
            });

            try {
                const data = await getVisualisation(request);
                if (data.success) {
                    setCurrentModelData({
                        ...(currentModelData || {
                            visualizationData: null,
                            isVisualizationLoading: false,
                            visualizationError: null,
                            predictionData: null,
                            isPredictionLoading: false,
                            predictionError: null,
                            queryPoints: null,
                        }),
                        visualizationData: data,
                        isVisualizationLoading: false,
                        visualizationError: null,
                    });
                    setLastParams(request);
                } else {
                    throw new Error(
                        "Visualization failed - API returned success: false"
                    );
                }
            } catch (error) {
                console.error("Failed to load KNN visualization:", error);
                setCurrentModelData({
                    ...(currentModelData || {
                        visualizationData: null,
                        isVisualizationLoading: false,
                        visualizationError: null,
                        predictionData: null,
                        isPredictionLoading: false,
                        predictionError: null,
                        queryPoints: null,
                    }),
                    visualizationData: null,
                    isVisualizationLoading: false,
                    visualizationError:
                        error instanceof Error
                            ? error.message
                            : "Unknown error loading visualization",
                });
            }
        },
        [currentModelData, setCurrentModelData, setLastParams]
    );

    const clearVisualization = useCallback(() => {
        setCurrentModelData({
            ...(currentModelData || {
                visualizationData: null,
                isVisualizationLoading: false,
                visualizationError: null,
                predictionData: null,
                isPredictionLoading: false,
                predictionError: null,
                queryPoints: null,
            }),
            visualizationData: null,
            visualizationError: null,
            isVisualizationLoading: false,
        });
        setLastParams({});
    }, [currentModelData, setCurrentModelData, setLastParams]);

    // ========================================================================
    // Prediction Methods
    // ========================================================================

    const makePrediction = useCallback(
        async (request: Partial<KNNPredictionRequest>) => {
            setCurrentModelData({
                ...(currentModelData || {
                    visualizationData: null,
                    isVisualizationLoading: false,
                    visualizationError: null,
                    predictionData: null,
                    isPredictionLoading: false,
                    predictionError: null,
                    queryPoints: null,
                }),
                isPredictionLoading: true,
                predictionError: null,
            });

            try {
                const data = await predict(request);

                if (data.success) {
                    setCurrentModelData({
                        ...(currentModelData || {
                            visualizationData: null,
                            isVisualizationLoading: false,
                            visualizationError: null,
                            predictionData: null,
                            isPredictionLoading: false,
                            predictionError: null,
                            queryPoints: null,
                        }),
                        predictionData: data,
                        isPredictionLoading: false,
                        predictionError: null,
                        queryPoints: request.query_points || null,
                    });
                } else {
                    throw new Error(
                        "Prediction failed - API returned success: false"
                    );
                }
            } catch (error) {
                console.error("Failed to make KNN prediction:", error);
                setCurrentModelData({
                    ...(currentModelData || {
                        visualizationData: null,
                        isVisualizationLoading: false,
                        visualizationError: null,
                        predictionData: null,
                        isPredictionLoading: false,
                        predictionError: null,
                        queryPoints: null,
                    }),
                    predictionData: null,
                    isPredictionLoading: false,
                    predictionError:
                        error instanceof Error
                            ? error.message
                            : "Unknown error making prediction",
                });
            }
        },
        [currentModelData, setCurrentModelData]
    );

    const clearPrediction = useCallback(() => {
        setCurrentModelData({
            ...(currentModelData || {
                visualizationData: null,
                isVisualizationLoading: false,
                visualizationError: null,
                predictionData: null,
                isPredictionLoading: false,
                predictionError: null,
                queryPoints: null,
            }),
            predictionData: null,
            predictionError: null,
            isPredictionLoading: false,
            queryPoints: null,
        });
    }, [currentModelData, setCurrentModelData]);

    // ========================================================================
    // Auto-load on mount
    // ========================================================================

    const autoLoadAttempted = useRef(false);

    useEffect(() => {
        if (
            !autoLoadAttempted.current &&
            !visualizationData &&
            !isVisualizationLoading &&
            lastParams &&
            Object.keys(lastParams).length > 0
        ) {
            autoLoadAttempted.current = true;
            loadVisualization(lastParams);
        }
    }, []); // Only run on mount

    // ========================================================================
    // Helper Methods
    // ========================================================================

    const getFeatureNames = useCallback((): string[] | null => {
        return (
            visualizationData?.feature_names ||
            predictionData?.feature_names ||
            null
        );
    }, [visualizationData, predictionData]);

    const getClassNames = useCallback((): string[] | null => {
        return (
            visualizationData?.class_names ||
            predictionData?.class_names ||
            null
        );
    }, [visualizationData, predictionData]);

    const getK = useCallback((): number | null => {
        if (predictionData?.neighbors_info?.[0]) {
            return predictionData.neighbors_info[0].length;
        }
        return lastParams?.parameters?.n_neighbors || null;
    }, [predictionData, lastParams]);

    const isVisualizationReady = useCallback((): boolean => {
        return !!(
            visualizationData?.success &&
            visualizationData?.feature_names &&
            visualizationData?.class_names
        );
    }, [visualizationData]);

    const resetModelData = useCallback(() => {
        console.log('[KNNContext] Resetting model data');
        baseResetModelData();
    }, [baseResetModelData]);

    // ========================================================================
    // Context Value
    // ========================================================================

    const contextValue: KNNContextType = {
        // Visualization state
        isVisualizationLoading,
        visualizationError,
        visualizationData,
        lastVisualizationParams: lastParams,

        // Prediction state
        isPredictionLoading,
        predictionError,
        predictionData,
        queryPoints,

        // Visualization methods
        loadVisualization,
        clearVisualization,

        // Prediction methods
        makePrediction,
        clearPrediction,

        // Helper methods
        getFeatureNames,
        getClassNames,
        getK,
        isVisualizationReady,
        getParameters,
        
        // Reset method
        resetModelData,
    };

    return (
        <KNNContext.Provider value={contextValue}>
            {children}
        </KNNContext.Provider>
    );
};

// ============================================================================
// Hook
// ============================================================================

export const useKNN = () => {
    const context = useContext(KNNContext);
    if (context === undefined) {
        throw new Error("useKNN must be used within a KNNProvider");
    }
    return context;
};
