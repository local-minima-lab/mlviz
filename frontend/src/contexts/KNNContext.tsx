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
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

const LOCAL_STORAGE_KEY = "knn_params";

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
}

const KNNContext = createContext<KNNContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface KNNProviderProps {
    children: ReactNode;
}

export const KNNProvider: React.FC<KNNProviderProps> = ({ children }) => {
    // Visualization state
    const [isVisualizationLoading, setIsVisualizationLoading] =
        useState<boolean>(false);
    const [visualizationError, setVisualizationError] = useState<string | null>(
        null
    );
    const [visualizationData, setVisualizationData] =
        useState<KNNVisualisationResponse | null>(null);

    const [lastVisualizationParams, setLastVisualizationParams] = useState<
        Partial<KNNVisualisationRequest>
    >(() => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : { parameters: { n_neighbors: 5 } };
    });

    // Prediction state
    const [isPredictionLoading, setIsPredictionLoading] =
        useState<boolean>(false);
    const [predictionError, setPredictionError] = useState<string | null>(null);
    const [predictionData, setPredictionData] =
        useState<KNNPredictionResponse | null>(null);
    const [queryPoints, setQueryPoints] = useState<number[][] | null>(null);

    // ========================================================================
    // Visualization Methods
    // ========================================================================

    const loadVisualization = useCallback(
        async (request: Partial<KNNVisualisationRequest> = {}) => {
            setIsVisualizationLoading(true);
            setVisualizationError(null);

            try {
                const data = await getVisualisation(request);
                if (data.success) {
                    setVisualizationData(data);
                    if (request) {
                        setLastVisualizationParams(request);
                        localStorage.setItem(
                            LOCAL_STORAGE_KEY,
                            JSON.stringify(request)
                        );
                    }
                } else {
                    throw new Error(
                        "Visualization failed - API returned success: false"
                    );
                }
            } catch (error) {
                console.error("Failed to load KNN visualization:", error);
                setVisualizationError(
                    error instanceof Error
                        ? error.message
                        : "Unknown error loading visualization"
                );
                setVisualizationData(null);
            } finally {
                setIsVisualizationLoading(false);
            }
        },
        []
    );

    const clearVisualization = useCallback(() => {
        setVisualizationData(null);
        setVisualizationError(null);
        setIsVisualizationLoading(false);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }, []);

    // ========================================================================
    // Prediction Methods
    // ========================================================================

    const makePrediction = useCallback(
        async (request: Partial<KNNPredictionRequest>) => {
            setIsPredictionLoading(true);
            setPredictionError(null);

            try {
                const data = await predict(request);

                if (data.success) {
                    setPredictionData(data);
                    setQueryPoints(request.query_points || null);
                } else {
                    throw new Error(
                        "Prediction failed - API returned success: false"
                    );
                }
            } catch (error) {
                console.error("Failed to make KNN prediction:", error);
                setPredictionError(
                    error instanceof Error
                        ? error.message
                        : "Unknown error making prediction"
                );
                setPredictionData(null);
            } finally {
                setIsPredictionLoading(false);
            }
        },
        []
    );

    const clearPrediction = useCallback(() => {
        setPredictionData(null);
        setPredictionError(null);
        setIsPredictionLoading(false);
        setQueryPoints(null);
    }, []);

    // ========================================================================
    // Auto-load on mount
    // ========================================================================

    useEffect(() => {
        if (
            !visualizationData &&
            !isVisualizationLoading &&
            lastVisualizationParams
        ) {
            loadVisualization(lastVisualizationParams);
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
        return lastVisualizationParams?.parameters?.n_neighbors || null;
    }, [predictionData, lastVisualizationParams]);

    const isVisualizationReady = useCallback((): boolean => {
        return !!(
            visualizationData?.success &&
            visualizationData?.feature_names &&
            visualizationData?.class_names
        );
    }, [visualizationData]);

    // ========================================================================
    // Context Value
    // ========================================================================

    const contextValue: KNNContextType = {
        // Visualization state
        isVisualizationLoading,
        visualizationError,
        visualizationData,
        lastVisualizationParams,

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
