/**
 * KMeans Model Context
 * Manages state and API interactions for KMeans clustering visualizations
 * Follows the same pattern as KNN and DecisionTree contexts
 */

import {
    getParameters as getParametersAPI,
    predict as predictAPI,
    step as stepAPI,
    train as trainAPI,
    type KMeansPredictRequest,
    type KMeansPredictResponse,
    type KMeansStepRequest,
    type KMeansStepResponse,
    type KMeansTrainRequest,
    type KMeansTrainResponse,
} from "@/api/kmeans";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    type ReactNode,
} from "react";
import {
    createBaseModelContext,
    type BaseModelData,
    type PredictableModelContext,
    type PredictionResult,
    type TrainableModelContext,
    type VisualizableModelContext,
} from "./BaseModelContext";

// ============================================================================
// Types
// ============================================================================

/**
 * KMeans-specific model data
 * Extends base model data with KMeans training response data
 */
interface KMeansModelData extends BaseModelData, KMeansTrainResponse {
    // Persisted query points (optional)
    queryPoints: number[][] | null;
}

/**
 * KMeans-specific prediction additional data
 * Contains cluster assignment details
 */
export interface KMeansPredictionAdditionalData {
    assignments: number[];
    distance_matrix: number[][];
    assigned_distances: number[];
    centroids: number[][];
}

// Create base context instance for KMeans
const { Provider: BaseProvider, useBaseModel } =
    createBaseModelContext<KMeansModelData>({
        localStorageKey: "kmeans_model_data",
        paramsStorageKey: "kmeans_params",
        getParameters: getParametersAPI,
    });

interface KMeansContextType
    extends
        TrainableModelContext<KMeansModelData>,
        PredictableModelContext<
            KMeansModelData,
            KMeansPredictionAdditionalData
        >,
        VisualizableModelContext<KMeansModelData> {
    // KMeans-specific properties
    isStepLoading: boolean;
    stepError: string | null;
    stepData: KMeansStepResponse | null;

    // Prediction state (Original names for backward compatibility)
    isPredictionLoading: boolean;
    predictionError: string | null;
    predictionData: KMeansPredictResponse | null;
    queryPoints: number[][] | null;

    // Visualization/Training state (Original names)
    isVisualizationLoading: boolean;
    visualizationError: string | null;
    visualizationData: KMeansModelData | null;
    lastVisualizationParams: Partial<KMeansTrainRequest>;

    // Specialized methods
    performStep: (request: Partial<KMeansStepRequest>) => Promise<void>;
    makePrediction: (request: Partial<KMeansPredictRequest>) => Promise<void>;
    getClusterCount: () => number | null;
    getCentroids: () => number[][] | null;
    isVisualizationReady: () => boolean;

    // Centroid selection state
    selectedCentroids: number[][];
    setSelectedCentroids: React.Dispatch<React.SetStateAction<number[][]>>;
    clearSelectedCentroids: () => void;
    isPlacingCentroids: boolean;
    setIsPlacingCentroids: React.Dispatch<React.SetStateAction<boolean>>;
}

const KMeansContext = createContext<KMeansContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface KMeansProviderProps {
    children: ReactNode;
}

export const KMeansProvider: React.FC<KMeansProviderProps> = ({ children }) => {
    return (
        <BaseProvider>
            <KMeansProviderInner>{children}</KMeansProviderInner>
        </BaseProvider>
    );
};

const KMeansProviderInner: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const baseContext = useBaseModel();
    const {
        currentModelData,
        lastParams,
        setCurrentModelData,
        setLastParams,
        resetModelData: baseResetModelData,
        getLastParams,
        getParameters,
    } = baseContext;

    // Extract values from currentModelData or use defaults
    const [isVisualizationLoading, setIsVisualizationLoading] =
        React.useState<boolean>(false);
    const [visualizationError, setVisualizationError] = React.useState<
        string | null
    >(null);

    // For backward compatibility and specialized use
    const visualizationData = currentModelData || null;

    // Step state (for manual stepping through iterations)
    const [isStepLoading, setIsStepLoading] = React.useState<boolean>(false);
    const [stepError, setStepError] = React.useState<string | null>(null);
    const [stepData, setStepData] = React.useState<KMeansStepResponse | null>(
        null,
    );

    // Prediction state (Local to avoid infinite loops with persisted state)
    const [isPredictionLoading, setIsPredictionLoading] =
        React.useState<boolean>(false);
    const [predictionError, setPredictionError] = React.useState<string | null>(
        null,
    );
    const [predictionData, setPredictionData] =
        React.useState<KMeansPredictResponse | null>(null);
    const [queryPoints, setQueryPoints] = React.useState<number[][] | null>(
        currentModelData?.queryPoints || null,
    );

    // Centroid selection state
    const [selectedCentroids, setSelectedCentroids] = React.useState<
        number[][]
    >([]);
    const [isPlacingCentroids, setIsPlacingCentroids] =
        React.useState<boolean>(true);
    const selectedCentroidsRef = React.useRef<number[][]>(selectedCentroids);

    // Keep ref in sync with state for API calls without triggering re-renders of stable callbacks
    React.useEffect(() => {
        selectedCentroidsRef.current = selectedCentroids;
    }, [selectedCentroids]);

    // Sync queryPoints from currentModelData if needed
    useEffect(() => {
        if (currentModelData?.queryPoints) {
            setQueryPoints(currentModelData.queryPoints);
        }
    }, [currentModelData?.queryPoints]);

    // ========================================================================
    // Training/Visualization Methods
    // ========================================================================

    const trainModel = useCallback(
        async (params?: Partial<KMeansTrainRequest>) => {
            setIsVisualizationLoading(true);
            setVisualizationError(null);

            try {
                // Automatically include selected centroids if not provided
                // Use Ref for stability to break infinite loops in components that auto-train
                const currentCentroids = selectedCentroidsRef.current;
                const requestParams = {
                    ...params,
                    centroids:
                        params?.centroids ||
                        (currentCentroids.length > 0
                            ? currentCentroids
                            : undefined),
                };

                const data = await trainAPI(requestParams);

                if (data.success) {
                    console.log("Training successful:", data);
                    setCurrentModelData({
                        ...data,
                        queryPoints: null,
                    });

                    // Update selected centroids to the final results
                    if (data.final_centroids) {
                        setSelectedCentroids(data.final_centroids);
                    }

                    setIsPlacingCentroids(false);
                    setIsVisualizationLoading(false);
                    setVisualizationError(null);
                    setLastParams(params || {});
                }
            } catch (error) {
                console.error("Error training KMeans:", error);
                setIsVisualizationLoading(false);
                setVisualizationError(
                    error instanceof Error
                        ? error.message
                        : "Unknown error training KMeans",
                );
            }
        },
        [setCurrentModelData, setLastParams],
    );

    const loadVisualization = useCallback(
        async (request: Partial<KMeansTrainRequest> = {}) => {
            // For KMeans, visualization is the same as training
            await trainModel(request);
        },
        [trainModel],
    );

    // ========================================================================
    // Step Method (for manual iteration control)
    // ========================================================================

    const performStep = useCallback(
        async (request: Partial<KMeansStepRequest>) => {
            setIsStepLoading(true);
            setStepError(null);

            try {
                // Automatically include selected centroids if not provided
                const currentCentroids = selectedCentroidsRef.current;
                const requestParams = {
                    ...request,
                    centroids:
                        request?.centroids ||
                        (currentCentroids.length > 0
                            ? currentCentroids
                            : undefined),
                };

                const data = await stepAPI(requestParams);

                if (data.success) {
                    setStepData(data);

                    // Update selected centroids to the new positions
                    if (data.new_centroids) {
                        setSelectedCentroids(data.new_centroids);
                    }

                    setIsPlacingCentroids(false);
                    setIsStepLoading(false);
                    setStepError(null);
                } else {
                    throw new Error(
                        "Step failed - API returned success: false",
                    );
                }
            } catch (error) {
                console.error("Failed to perform KMeans step:", error);
                setStepData(null);
                setIsStepLoading(false);
                setStepError(
                    error instanceof Error
                        ? error.message
                        : "Unknown error performing step",
                );
            }
        },
        [],
    );

    // ========================================================================
    // Helper Methods
    // ========================================================================

    const getFeatureNames = useCallback((): string[] | null => {
        return visualizationData?.metadata?.feature_names || null;
    }, [visualizationData]);

    const getPredictiveFeatureNames = useCallback((): string[] | null => {
        return (
            visualizationData?.visualisation_feature_names || getFeatureNames()
        );
    }, [visualizationData, getFeatureNames]);

    const getClassNames = useCallback((): string[] | null => {
        // KMeans doesn't have class names, but we can return cluster IDs as strings
        const clusterCount = getClusterCount();
        if (clusterCount === null) return null;
        return Array.from({ length: clusterCount }, (_, i) => `Cluster ${i}`);
    }, []);

    const getClusterCount = useCallback((): number | null => {
        return visualizationData?.metadata?.n_clusters || null;
    }, [visualizationData]);

    const getCentroids = useCallback((): number[][] | null => {
        return visualizationData?.final_centroids || null;
    }, [visualizationData]);

    const isVisualizationReady = useCallback((): boolean => {
        return !!(
            visualizationData?.success &&
            visualizationData?.metadata?.feature_names &&
            visualizationData?.final_centroids
        );
    }, [visualizationData]);

    const clearSelectedCentroids = useCallback(() => {
        setSelectedCentroids([]);
    }, []);

    // ========================================================================
    // Prediction Methods
    // ========================================================================

    const makePrediction = useCallback(
        async (request: Partial<KMeansPredictRequest>) => {
            setIsPredictionLoading(true);
            setPredictionError(null);

            try {
                const data = await predictAPI(request);

                if (data.success) {
                    setPredictionData(data);
                    setIsPredictionLoading(false);
                    setPredictionError(null);
                    setQueryPoints(request.query_points || null);

                    // Opt-in: persist query points if desired
                    if (currentModelData) {
                        setCurrentModelData({
                            ...currentModelData,
                            queryPoints: request.query_points || null,
                        });
                    }
                } else {
                    throw new Error(
                        "Prediction failed - API returned success: false",
                    );
                }
            } catch (error) {
                console.error("Failed to make KMeans prediction:", error);
                setPredictionData(null);
                setIsPredictionLoading(false);
                setPredictionError(
                    error instanceof Error
                        ? error.message
                        : "Unknown error making prediction",
                );
            }
        },
        [currentModelData, setCurrentModelData],
    );

    const predict = useCallback(
        async (points: Record<string, number>) => {
            const featureNames = getPredictiveFeatureNames(); // Use visualization features, not all features
            const centroids = getCentroids();
            if (!featureNames || !centroids) return;

            // Convert points object to array format expected by API
            // Only use the features that were used for training (visualization features)
            const queryPoint = featureNames.map((name) => points[name] || 0);

            await makePrediction({
                query_points: [queryPoint],
                centroids: centroids,
            });
        },
        [getPredictiveFeatureNames, getCentroids, makePrediction],
    );

    const clearPrediction = useCallback(() => {
        setPredictionData(null);
        setPredictionError(null);
        setIsPredictionLoading(false);
        setQueryPoints(null);

        // Also clear persisted query points
        if (currentModelData) {
            setCurrentModelData({
                ...currentModelData,
                queryPoints: null,
            });
        }
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

    const resetModelData = useCallback(() => {
        console.log("[KMeansContext] Resetting model data");
        baseResetModelData();
    }, [baseResetModelData]);

    // ========================================================================
    // Context Value
    // ========================================================================

    const predictionResult: PredictionResult<KMeansPredictionAdditionalData> | null =
        React.useMemo(() => {
            if (
                !predictionData ||
                predictionData.assignments?.[0] === undefined
            )
                return null;

            const clusterNames = getClassNames();
            const clusterIndex = predictionData.assignments[0];

            return {
                predictedClass:
                    clusterNames?.[clusterIndex] || `Cluster ${clusterIndex}`,
                predictedClassIndex: clusterIndex,
                additionalData: {
                    assignments: predictionData.assignments,
                    distance_matrix: predictionData.distance_matrix,
                    assigned_distances: predictionData.assigned_distances,
                    centroids: predictionData.centroids,
                },
            };
        }, [predictionData, getClassNames]);

    const contextValue: KMeansContextType = {
        // BaseModelContextType
        currentModelData,
        lastParams,
        setCurrentModelData,
        setLastParams,
        resetModelData,
        getLastParams,
        getParameters,

        // TrainableModelContext
        isLoading: isVisualizationLoading,
        error: visualizationError,
        data: currentModelData,
        train: trainModel,

        // PredictableModelContext
        isPredicting: isPredictionLoading,
        predictionError,
        predictionResult,
        predict,
        clearPrediction,
        getFeatureNames,
        getClassNames,
        getPredictiveFeatureNames,

        // VisualizableModelContext
        isVisualizing: isVisualizationLoading,
        visualizationError,
        visualizationData,
        loadVisualization,

        // KMeans-specifics
        isStepLoading,
        stepError,
        stepData,
        performStep,
        isPredictionLoading,
        predictionData,
        queryPoints,
        isVisualizationLoading,
        lastVisualizationParams: lastParams,
        makePrediction,
        getClusterCount,
        getCentroids,
        isVisualizationReady,

        // Centroid selection
        selectedCentroids,
        setSelectedCentroids,
        clearSelectedCentroids,
        isPlacingCentroids,
        setIsPlacingCentroids,
    };

    return (
        <KMeansContext.Provider value={contextValue}>
            {children}
        </KMeansContext.Provider>
    );
};

// ============================================================================
// Hook
// ============================================================================

export const useKMeans = () => {
    const context = useContext(KMeansContext);
    if (context === undefined) {
        throw new Error("useKMeans must be used within a KMeansProvider");
    }
    return context;
};
