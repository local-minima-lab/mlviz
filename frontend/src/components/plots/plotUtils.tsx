/**
 * BasePlot - Dimension-aware abstraction layer for ML visualizations
 *
 * This component uses pure D3 render functions (following the pattern from histogramUtils).
 * It handles:
 * - Auto-detection of data dimensions (1D, 2D, 3D)
 * - Routing to appropriate D3 render function based on dimensions
 * - Standardized data transformation via VisualisationRenderContext
 * - Integration with BaseVisualisation capabilities (zoom, pan, playback)
 *
 * Use cases:
 * - KNN visualization (showing K-nearest neighbors over time)
 * - SVM decision boundaries
 * - Clustering algorithms (K-means, DBSCAN, etc.)
 * - Any ML algorithm requiring 1D-3D feature space visualization
 */

import type {
    BaseScatterPlotProps,
    Config,
    DecisionBoundary,
    SupportedDimensions,
} from "@/components/plots/types";
import {
    calculateCombinedBounds,
    createPlotPoints,
    detectDimensions,
    validateDimensions,
} from "@/components/plots/utils/dataTransformers";
import {
    renderScatter1D,
    renderScatter2D,
    renderScatter3D,
    type Scatter3DRotation,
} from "@/components/plots/utils/scatterRenderers";
import BaseVisualisation from "@/components/visualisation/BaseVisualisation";
import type { VisualisationRenderContext } from "@/components/visualisation/types";
import * as d3 from "d3";
import React, { useCallback, useMemo, useState } from "react";

// ============================================================================
// BasePlot Props
// ============================================================================

export interface BasePlotProps
    extends Omit<BaseScatterPlotProps, "capabilities"> {
    // Layout customization
    topControls?: React.ReactNode;
    bottomInfo?: React.ReactNode;

    // Playback configuration (for algorithm animations)
    enablePlayback?: boolean;
    maxSteps?: number;
    stepDuration?: number;
    onStepChange?: (step: number) => void;

    // Zoom configuration override
    zoomConfig?: {
        scaleExtent?: [number, number];
        enablePan?: boolean;
        panMargin?: number;
    };

    // Custom renderer override (for advanced use cases)
    customRenderer?: (props: {
        container: d3.Selection<SVGGElement, unknown, null, undefined>;
        data: number[][];
        config: Config;
        decisionBoundary?: DecisionBoundary;
        context: VisualisationRenderContext;
        plotProps: BaseScatterPlotProps;
    }) => void;
}

// ============================================================================
// BasePlot Component
// ============================================================================

const BasePlot: React.FC<BasePlotProps> = ({
    data,
    featureNames,
    config,
    decisionBoundary,
    pointRadius,
    pointOpacity,
    showGrid,
    showLegend,
    showAxes,
    onPointClick,
    onPointHover,
    topControls,
    bottomInfo,
    enablePlayback = false,
    maxSteps = 10,
    stepDuration = 1000,
    onStepChange,
    zoomConfig,
    customRenderer,
}) => {
    // ============================================================================
    // State Management
    // ============================================================================

    // 3D rotation state (only used for 3D plots)
    const [rotation, setRotation] = useState<Scatter3DRotation>({
        alpha: 0.5,
        beta: 0.5,
    });

    // ============================================================================
    // Dimension Detection
    // ============================================================================

    const dimensions = useMemo<SupportedDimensions>(() => {
        validateDimensions(data);
        return detectDimensions(data);
    }, [data]);

    // ============================================================================
    // Render Callback for BaseVisualisation
    // ============================================================================

    /**
     * Main render callback that uses D3 render functions
     * This approach follows the pattern used in DecisionTreeRenderer and histogramUtils
     */
    const renderCallback = useCallback(
        (
            container: d3.Selection<SVGGElement, unknown, null, undefined>,
            plotData: number[][],
            context: VisualisationRenderContext
        ) => {
            // Clear previous render
            container.selectAll("*").remove();

            // If custom renderer provided, use it
            if (customRenderer) {
                customRenderer({
                    container,
                    data: plotData,
                    config,
                    decisionBoundary,
                    context,
                    plotProps: {
                        data: plotData,
                        featureNames,
                        config,
                        decisionBoundary,
                        pointRadius,
                        pointOpacity,
                        showGrid,
                        showLegend,
                        showAxes,
                        onPointClick,
                        onPointHover,
                    },
                });
                return;
            }

            // Transform data to plot points
            const plotPoints = createPlotPoints(plotData, config);
            const bounds = calculateCombinedBounds(
                plotData,
                decisionBoundary,
                0.1
            );

            // Get dimensions from context
            const { width, height, margin } = context.dimensions;

            // Render options
            const renderOptions = {
                width,
                height,
                margin,
                pointRadius,
                pointOpacity,
                showGrid,
                showLegend,
                showAxes,
                onPointClick,
                onPointHover,
            };

            // Select appropriate render function based on dimensions
            switch (dimensions) {
                case 1:
                    renderScatter1D(
                        container,
                        plotPoints,
                        bounds,
                        featureNames,
                        config,
                        decisionBoundary,
                        renderOptions
                    );
                    break;
                case 2:
                    renderScatter2D(
                        container,
                        plotPoints,
                        bounds,
                        featureNames,
                        config,
                        decisionBoundary,
                        renderOptions
                    );
                    break;
                case 3:
                    renderScatter3D(
                        container,
                        plotPoints,
                        bounds,
                        featureNames,
                        config,
                        decisionBoundary,
                        rotation,
                        renderOptions
                    );
                    break;
                default:
                    throw new Error(`Unsupported dimensions: ${dimensions}`);
            }
        },
        [
            customRenderer,
            config,
            decisionBoundary,
            featureNames,
            pointRadius,
            pointOpacity,
            showGrid,
            showLegend,
            showAxes,
            onPointClick,
            onPointHover,
            dimensions,
            rotation,
            setRotation,
        ]
    );

    // ============================================================================
    // Capabilities Configuration
    // ============================================================================

    const capabilities = useMemo(() => {
        return {
            ...(enablePlayback && {
                playable: {
                    maxSteps,
                    stepDuration,
                    showSlider: true,
                    interpolationSteps: 30,
                    autoPlay: false,
                },
            }),
            zoomable: {
                scaleExtent:
                    zoomConfig?.scaleExtent || ([0.5, 5] as [number, number]),
                enableReset: true,
                enablePan: zoomConfig?.enablePan ?? true,
                panMargin: zoomConfig?.panMargin ?? 50,
            },
        };
    }, [enablePlayback, maxSteps, stepDuration, zoomConfig]);

    // ============================================================================
    // 3D Rotation Controls
    // ============================================================================

    const rotation3DControls = dimensions === 3 ? (
        <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                3D Rotation
            </h3>

            {/* Horizontal Rotation (Alpha - Y axis) */}
            <div className="space-y-1">
                <label className="flex justify-between text-xs text-gray-600">
                    <span>Horizontal (α)</span>
                    <span className="font-mono text-gray-500">{Math.round(rotation.alpha * 360)}°</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={rotation.alpha}
                    onChange={(e) => setRotation(prev => ({ ...prev, alpha: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>

            {/* Vertical Rotation (Beta - X axis) */}
            <div className="space-y-1">
                <label className="flex justify-between text-xs text-gray-600">
                    <span>Vertical (β)</span>
                    <span className="font-mono text-gray-500">{Math.round(rotation.beta * 360)}°</span>
                </label>
                <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={rotation.beta}
                    onChange={(e) => setRotation(prev => ({ ...prev, beta: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-green-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
            </div>

            {/* Reset Button */}
            <button
                onClick={() => setRotation({ alpha: 0.5, beta: 0.5 })}
                className="w-full px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
                Reset View
            </button>
        </div>
    ) : null;

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <BaseVisualisation
            dataConfig={{
                data,
                renderContent: renderCallback,
            }}
            capabilities={capabilities}
            controlsConfig={{
                controlsPosition: "top-left",
                controlsStyle: "overlay",
            }}
            layoutConfig={{
                topControls: (
                    <>
                        {rotation3DControls}
                        {topControls}
                    </>
                ),
                bottomInfo,
            }}
            eventHandlers={{
                onStepChange,
            }}
        />
    );
};

export default BasePlot;
