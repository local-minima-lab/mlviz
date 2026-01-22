/**
 * KNN Prediction Visualization
 * Displays training data, query points, and neighbor connections
 * Integrates with KNN context to make predictions and display results
 */

import { renderKNNPrediction } from "@/components/knn/classifier/KNNRenderer";
import type { KNNVisualizationData } from "@/components/knn/classifier/types";
import BaseVisualisation from "@/components/visualisation/BaseVisualisation";
import type { VisualisationRenderContext } from "@/components/visualisation/types";
import { useKNN } from "@/contexts/models/KNNContext";
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
        makePrediction,
        visualizationData,
        loadVisualization,
    } = useKNN();

    // Make prediction when points change
    useEffect(() => {
        if (points && Object.keys(points).length > 0) {
            // Convert points object to array format expected by API
            const featureNames = Object.keys(points);
            const queryPoint = featureNames.map(name => points[name]);

            makePrediction({
                query_points: [queryPoint],
                // Parameters are optional, defaults will be used
                parameters: undefined,
            });
        }
    }, [points, makePrediction]);

    // Load visualization data if not already loaded
    useEffect(() => {
        if (!visualizationData && !predictionData) {
            loadVisualization({});
        }
    }, [visualizationData, predictionData, loadVisualization]);

    // Show loading state
    if (isPredictionLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Making prediction...</p>
                </div>
            </div>
        );
    }

    // Show error state
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

    // Show empty state
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

    // Use prediction data if available, otherwise fall back to visualization data
    const knnData = predictionData || visualizationData;
    if (!knnData) return null;

    // Get dimensions from visualisation_feature_indices if available, otherwise from n_dimensions
    const dimensions = (knnData as any).visualisation_feature_indices?.length || (knnData as any).n_dimensions || 2;

    const visualizationData_transformed: KNNVisualizationData = useMemo(() => {
        const decisionBoundary = knnData.decision_boundary
            ? {
                  meshPoints: knnData.decision_boundary.mesh_points,
                  predictions: knnData.decision_boundary.predictions,
                  dimensions: dimensions,
              }
            : undefined;

        // Transform prediction data to include queries
        const queries = predictionData
            ? predictionData.predictions.map((prediction, idx) => ({
                  queryPoint: points
                      ? Object.keys(points).map(name => points[name])
                      : [],
                  neighbors: predictionData.neighbors_info[idx].map(n => ({
                      index: n.index,
                      distance: n.distance,
                      label: n.label,
                  })),
                  prediction: prediction,
                  predictionIndex: predictionData.prediction_indices[idx],
                  allDistances: predictionData.all_distances[idx],
              }))
            : undefined;

        return {
            trainingPoints: knnData.training_points,
            trainingLabels: knnData.training_labels,
            decisionBoundary,
            featureNames: knnData.feature_names,
            classNames: knnData.class_names,
            nDimensions: dimensions,
            k: predictionData?.neighbors_info?.[0]?.length || 5,
            queries,
        };
    }, [knnData, predictionData, dimensions, points]);

    // Create color scale
    const colorScale = useMemo(
        () =>
            d3
                .scaleOrdinal<string>()
                .domain(visualizationData_transformed.classNames)
                .range(
                    d3.schemeDark2.slice(
                        0,
                        visualizationData_transformed.classNames.length
                    )
                ),
        [visualizationData_transformed.classNames]
    );

    // Calculate content bounds for zoom restrictions
    const contentBounds = useMemo(() => {
        if (!visualizationData_transformed.decisionBoundary) return undefined;

        const meshPoints =
            visualizationData_transformed.decisionBoundary.meshPoints;
        if (meshPoints.length === 0) return undefined;

        const xValues = meshPoints.map(p => p[0]);
        const yValues = meshPoints.map(p => p[1]);

        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);

        return {
            width: xMax - xMin,
            height: yMax - yMin,
        };
    }, [visualizationData_transformed.decisionBoundary]);

    const renderCallback = useCallback(
        (
            container: d3.Selection<SVGGElement, unknown, null, undefined>,
            _data: any,
            context: VisualisationRenderContext
        ) => {
            renderKNNPrediction({
                container,
                data: visualizationData_transformed,
                context,
                props: {
                    colorScale,
                    k: visualizationData_transformed.k,
                    showNeighborLines: true,
                    showDistanceCircles: false,
                    neighborLineColor: "#666",
                    neighborLineWidth: 1.5,
                    queryPointSize: 8,
                    highlightColor: "#ff6b6b",
                },
            });
        },
        [visualizationData_transformed, colorScale]
    );

    return (
        <BaseVisualisation
            dataConfig={{
                data: visualizationData_transformed,
                renderContent: renderCallback,
            }}
            capabilities={{
                zoomable: {
                    scaleExtent: [1.0, 5],
                    enableReset: true,
                    enablePan: true,
                    panMargin: 50,
                    contentBounds: contentBounds,
                },
            }}
            controlsConfig={{
                controlsPosition: "top-left",
                controlsStyle: "overlay",
            }}
        />
    );
};

export default Visualisation;
