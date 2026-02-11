/**
 * KMeans Prediction Visualization
 * Displays training data, query points, and cluster assignments
 * Integrates with KMeans context to make predictions and display results
 */

import { renderKMeansPrediction } from "@/components/kmeans/clustering/KMeansRenderer";
import type { KMeansVisualizationData } from "@/components/kmeans/clustering/types";
import { DEFAULT_2D_ZOOM_CONFIG } from "@/components/plots/utils/zoomConfig";
import BaseVisualisation from "@/components/visualisation/BaseVisualisation";
import type { VisualisationRenderContext } from "@/components/visualisation/types";
import { useKMeans } from "@/contexts/models/KMeansContext";
import * as d3 from "d3";
import { useCallback, useEffect, useMemo } from "react";

interface VisualisationProps {
    points?: Record<string, any> | null;
}

const Visualisation: React.FC<VisualisationProps> = ({ points }) => {
    const {
        predictionData,
        isPredictionLoading,
        predictionError,
        visualizationData,
        loadVisualization,
        isVisualizationLoading,
    } = useKMeans();

    // Load visualization data if not already loaded
    useEffect(() => {
        if (!visualizationData && !predictionData && !isVisualizationLoading) {
            loadVisualization({});
        }
    }, [visualizationData, predictionData, loadVisualization, isVisualizationLoading]);

    // Always use visualization data for training data
    // predictionData only contains prediction results, not training data
    const kmeansData = visualizationData;

    // Get dimensions robustly from visualization-specific data only:
    const dimensions =
        (kmeansData as any)?.visualisation_feature_indices?.length ||
        (kmeansData as any)?.data_points?.[0]?.length ||
        2;

    const visualizationData_transformed: KMeansVisualizationData = useMemo(() => {
        if (!kmeansData) {
            return {
                dataPoints: [],
                iterations: [],
                totalIterations: 0,
                converged: false,
                finalCentroids: [],
                finalAssignments: [],
                decisionBoundary: undefined,
                featureNames: [],
                nDimensions: 0,
                nClusters: 0,
                queries: undefined,
            };
        }

        // For prediction mode, use the training data iterations (not prediction assignments)
        // Prediction assignments are only for query points, not training data
        const iterations = (kmeansData as any).iterations || [];

        const decisionBoundary = (kmeansData as any).decision_boundary
            ? {
                  meshPoints: (kmeansData as any).decision_boundary.mesh_points,
                  predictions: (kmeansData as any).decision_boundary.predictions,
                  dimensions: dimensions,
              }
            : undefined;

        // Resolve the effective feature names for visualization
        const allFeatureNames =
            ((kmeansData as any).metadata?.feature_names as string[]) ||
            ((kmeansData as any).feature_names as string[]) ||
            [];

        const vizIndices = (kmeansData as any).visualisation_feature_indices as number[];
        const explicitVizNames = (kmeansData as any).visualisation_feature_names as string[];

        // Infer features from points if provided and no explicit visualization features are set
        const pointsFeatures = points ? Object.keys(points).filter(k => allFeatureNames.includes(k)) : [];
        const inferredVizNames = pointsFeatures.length > 0 ? pointsFeatures : [];

        const effectiveVizFeatureNames =
            (explicitVizNames && explicitVizNames.length > 0) ? explicitVizNames :
            (vizIndices && vizIndices.length > 0 && allFeatureNames.length > 0) ? vizIndices.map(i => allFeatureNames[i]) :
            (inferredVizNames.length > 0) ? inferredVizNames :
            allFeatureNames.slice(0, dimensions);

        console.log("[KMeans Visualisation] Feature debug:", {
            allFeatureNames,
            vizIndices,
            explicitVizNames,
            effectiveVizFeatureNames,
            points,
            dimensions
        });

        const featureNames = effectiveVizFeatureNames;

        // Transform prediction data to include queries
        const queries = predictionData
            ? predictionData.query_points.map((queryPoint, idx) => {
                  return {
                      queryPoint: queryPoint, // Use the actual query point from API
                      assignment: predictionData.assignments[idx],
                      distances: predictionData.distance_matrix[idx],
                      assignedDistance: predictionData.assigned_distances[idx],
                  };
              })
            : undefined;


        const result = {
            dataPoints: (kmeansData as any).data_points || [],
            iterations,
            totalIterations: iterations.length,
            converged: (kmeansData as any).converged || false,
            finalCentroids: predictionData?.centroids || (kmeansData as any).final_centroids || [],
            finalAssignments: (kmeansData as any).final_assignments || [],
            decisionBoundary,
            featureNames,
            nDimensions: dimensions,
            nClusters: predictionData?.centroids?.length || (kmeansData as any).metadata?.n_clusters || 0,
            queries,
        };
        
        console.log('[KMeans Prediction Viz] Transformed data:', {
            dataPointsLength: result.dataPoints.length,
            iterationsLength: result.iterations.length,
            finalCentroidsLength: result.finalCentroids.length,
            finalAssignmentsLength: result.finalAssignments.length,
            queriesLength: result.queries?.length,
            nClusters: result.nClusters,
        });
        
        return result;
    }, [kmeansData, predictionData, dimensions, points]);

    // Create color scale - Use category10 to match the renderer's default
    const colorScale = useMemo(() => {
        const nClusters = visualizationData_transformed.nClusters;
        const clusterNames = nClusters > 0
            ? Array.from({ length: nClusters }, (_, i) => `Cluster ${i}`)
            : [];

        return d3
            .scaleOrdinal<string>()
            .domain(clusterNames)
            .range(
                d3.schemeCategory10.slice(
                    0,
                    clusterNames.length
                )
            );
    }, [visualizationData_transformed.nClusters]);



    const renderCallback = useCallback(
        (
            container: d3.Selection<SVGGElement, unknown, null, undefined>,
            _data: any,
            context: VisualisationRenderContext
        ) => {
            renderKMeansPrediction({
                container,
                data: visualizationData_transformed,
                context,
                props: {
                    colorScale,
                    showCentroidLines: true,
                    centroidLineColor: "#666",
                    centroidLineWidth: 1.5,
                    queryPointSize: 8,
                    highlightColor: "#666",
                },
            });
        },
        [visualizationData_transformed, colorScale]
    );

    // Move early returns AFTER all hooks
    if (isPredictionLoading || isVisualizationLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                        {isPredictionLoading ? "Making prediction..." : "Loading visualization..."}
                    </p>
                </div>
            </div>
        );
    }

    if (predictionError) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                    <p className="text-destructive mb-2">Error making prediction</p>
                    <p className="text-sm text-muted-foreground">{predictionError}</p>
                </div>
            </div>
        );
    }

    if (!predictionData && !visualizationData) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                    <p className="text-muted-foreground">
                        No data available. Please enter query points to make a prediction.
                    </p>
                </div>
            </div>
        );
    }

    if (!kmeansData) return null;

    return (
        <BaseVisualisation
            dataConfig={{
                data: visualizationData_transformed,
                renderContent: renderCallback,
            }}
            capabilities={{
                zoomable: DEFAULT_2D_ZOOM_CONFIG,
            }}
            controlsConfig={{
                controlsPosition: "top-left",
                controlsStyle: "overlay",
            }}
        />
    );
};

export default Visualisation;
