/**
 * KNN Training Visualization
 * Displays the training dataset with decision boundaries
 * Similar to DecisionTree training mode but for KNN
 */

import { renderKNNTraining } from "@/components/knn/classifier/KNNRenderer";
import type { KNNVisualizationData } from "@/components/knn/classifier/types";
import { DEFAULT_2D_ZOOM_CONFIG } from "@/components/plots/utils/zoomConfig";
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
    // Get dimensions robustly from visualization-specific data only:
    const dimensions = 
        knnData?.visualisation_feature_indices?.length || 
        (knnData?.training_points?.[0]?.length) || 
        2; // Default to 2 if no data yet

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
            featureNames:
                ((knnData as any).visualisation_feature_names as string[]) ||
                (knnData.metadata?.feature_names as string[]) ||
                ((knnData as any).feature_names as string[]) ||
                [],
            classNames:
                (knnData.metadata?.class_names as string[]) ||
                ((knnData as any).class_names as string[]) ||
                [],
            nDimensions: dimensions,
            k: 5, // Default K, can be made configurable
            queries: undefined,
        };
    }, [knnData, dimensions]);

    // Create color scale - Use category10 to match renderer
    const colorScale = useMemo(
        () =>
            d3
                .scaleOrdinal<string>()
                .domain(visualizationData.classNames)
                .range(
                    d3.schemeCategory10.slice(
                        0,
                        visualizationData.classNames.length
                    )
                ),
        [visualizationData.classNames]
    );



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
