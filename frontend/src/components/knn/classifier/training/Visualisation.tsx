/**
 * KNN Training Visualization
 * Displays the training dataset with decision boundaries
 * Integrates with KNN context to load and display visualization data
 */

import { renderKNNTraining } from "@/components/knn/classifier/KNNRenderer";
import type { KNNVisualizationData } from "@/components/knn/classifier/types";
import BaseVisualisation from "@/components/visualisation/BaseVisualisation";
import type { VisualisationRenderContext } from "@/components/visualisation/types";
import { useKNN } from "@/contexts/models/KNNContext";
import * as d3 from "d3";
import { useCallback, useEffect, useMemo } from "react";

interface VisualisationProps {
    data?: any; // Optional data prop for compatibility with component registry
}

const Visualisation: React.FC<VisualisationProps> = () => {
    const {
        visualizationData: knnData,
        isVisualizationLoading,
        visualizationError,
        loadVisualization,
        lastVisualizationParams,
    } = useKNN();

    // Auto-load visualization on mount if we have stored params
    useEffect(() => {
        if (!knnData && !isVisualizationLoading && Object.keys(lastVisualizationParams).length > 0) {
            loadVisualization(lastVisualizationParams);
        }
    }, []); // Only run on mount

    const dimensions = knnData?.visualisation_feature_indices?.length || 0;

    const visualizationData: KNNVisualizationData = useMemo(() => {
        if (!knnData) {
            return {
                trainingPoints: [],
                trainingLabels: [],
                decisionBoundary: undefined,
                featureNames: [],
                classNames: [],
                nDimensions: 0,
                k: 5,
                queries: undefined,
            };
        }

        const decisionBoundary = knnData.decision_boundary
            ? {
                  meshPoints: knnData.decision_boundary.mesh_points,
                  predictions: knnData.decision_boundary.predictions,
                  dimensions: dimensions,
              }
            : undefined;

        return {
            trainingPoints: knnData.training_points,
            trainingLabels: knnData.training_labels,
            decisionBoundary,
            featureNames: (knnData as any).metadata?.feature_names || [],
            classNames: (knnData as any).metadata?.class_names || [],
            nDimensions: dimensions,
            k: 5, // Default K, can be made configurable
            queries: undefined,
        };
    }, [knnData, dimensions]);

    // Create color scale
    const colorScale = useMemo(
        () =>
            d3
                .scaleOrdinal<string>()
                .domain(visualizationData.classNames)
                .range(
                    d3.schemeDark2.slice(0, visualizationData.classNames.length)
                ),
        [visualizationData.classNames]
    );

    // Calculate content bounds for zoom restrictions
    const contentBounds = useMemo(() => {
        if (!visualizationData.decisionBoundary) return undefined;

        const meshPoints = visualizationData.decisionBoundary.meshPoints;
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
    }, [visualizationData.decisionBoundary]);

    const renderCallback = useCallback(
        (
            container: d3.Selection<SVGGElement, unknown, null, undefined>,
            _data: any,
            context: VisualisationRenderContext
        ) => {
            renderKNNTraining({
                container,
                data: visualizationData,
                context,
                props: {
                    colorScale,
                    k: visualizationData.k,
                },
            });
        },
        [visualizationData, colorScale]
    );

    // Early returns AFTER all hooks
    // Show loading state
    if (isVisualizationLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading visualization...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (visualizationError) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                    <p className="text-destructive mb-2">Error loading visualization</p>
                    <p className="text-sm text-muted-foreground">{visualizationError}</p>
                </div>
            </div>
        );
    }

    // Show empty state
    if (!knnData) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                    <p className="text-muted-foreground">
                        No visualization data available. Please configure and load a dataset.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <BaseVisualisation
            dataConfig={{
                data: visualizationData,
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
