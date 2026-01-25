/**
 * KNN Training Visualization
 * Displays the training dataset with decision boundaries
 * Similar to DecisionTree training mode but for KNN
 */

import { renderKNNTraining } from "@/components/knn/classifier/KNNRenderer";
import type { KNNVisualizationData } from "@/components/knn/classifier/types";
import BaseVisualisation from "@/components/visualisation/BaseVisualisation";
import type { VisualisationRenderContext } from "@/components/visualisation/types";
import type { components } from "@/types/api";
import * as d3 from "d3";
import { useCallback, useMemo } from "react";

type KNNVisualisationResponse =
    components["schemas"]["KNNVisualisationResponse"];

interface VisualisationProps {
    data?: KNNVisualisationResponse;
}

const Visualisation: React.FC<VisualisationProps> = ({ data: knnData }) => {
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
            featureNames: knnData.metadata?.feature_names || [],
            classNames: knnData.metadata?.class_names || [],
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
    // Use decision boundary bounds if available, otherwise use training data bounds
    const contentBounds = useMemo(() => {
        if (!visualizationData.decisionBoundary) return undefined;

        // Get all mesh points to calculate bounds
        const meshPoints = visualizationData.decisionBoundary.meshPoints;
        if (meshPoints.length === 0) return undefined;

        // Calculate min/max for each dimension
        const xValues = meshPoints.map(p => p[0]);
        const yValues = meshPoints.map(p => p[1]);

        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);

        // Return bounds in the format expected by zoom controls
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

    // Early return AFTER all hooks
    if (!knnData) return <></>;

    return (
        <BaseVisualisation
            dataConfig={{
                data: visualizationData,
                renderContent: renderCallback,
            }}
            capabilities={{
                zoomable: {
                    scaleExtent: [1.0, 5],  // Min zoom 1.0 = can't zoom out beyond initial view
                    enableReset: true,
                    enablePan: true,
                    panMargin: 50,
                    contentBounds: contentBounds,  // Restrict panning to decision boundary area
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
