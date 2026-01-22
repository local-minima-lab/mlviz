/**
 * KNN Renderer
 * D3-based rendering functions for K-Nearest Neighbors visualization
 * Follows the pattern from DecisionTreeRenderer and histogramUtils
 */

import type {
    KNNVisualizationData,
    RenderKNNVisualisationProps,
} from "@/components/knn/classifier/types";
import type { ClassificationConfig } from "@/components/plots/types";
import {
    calculateCombinedBounds,
    createPlotPoints,
} from "@/components/plots/utils/dataTransformers";
import {
    renderScatter1D,
    renderScatter2D
} from "@/components/plots/utils/scatterRenderers";
import {
    calculateInterpolationFactor,
    isElementVisible,
} from "@/components/visualisation/utils/interpolationUtils";
import * as d3 from "d3";

// ============================================================================
// Main Render Functions
// ============================================================================

/**
 * Renders KNN visualization for training/exploration mode
 * Shows training data with decision boundary
 */
export function renderKNNTraining({
    container,
    data,
    context,
    props,
}: RenderKNNVisualisationProps) {
    const { dimensions, state } = context;
    const { width, height, margin } = dimensions;
    const { currentStep = 0 } = state;

    // Clear previous render
    container.selectAll("*").remove();

    // Prepare plot data
    const plotData = data.trainingPoints;
    const config: ClassificationConfig = {
        type: "classification",
        classNames: data.classNames,
        labels: data.trainingLabels,
    };

    // Create decision boundary if available
    const decisionBoundary = data.decisionBoundary
        ? {
              type: "classification" as const,
              meshPoints: data.decisionBoundary.meshPoints,
              predictions: data.decisionBoundary.predictions,
              dimensions: data.decisionBoundary.dimensions,
          }
        : undefined;

    // Transform data to plot points
    const plotPoints = createPlotPoints(plotData, config);
    // Use 0 padding when decision boundary exists (it already has 10% margin from backend)
    const bounds = calculateCombinedBounds(plotData, decisionBoundary, decisionBoundary ? 0 : 0.1);

    // Render options
    const renderOptions = {
        width,
        height,
        margin,
        pointRadius: 5,
        pointOpacity: 0.8,
        showGrid: true,
        showLegend: true,
        showAxes: true,
        useNiceScales: !decisionBoundary,  // Disable nice scales when decision boundary exists to avoid whitespace
    };

    // Render appropriate scatter plot based on dimensions
    switch (data.nDimensions) {
        case 1:
            renderScatter1D(
                container,
                plotPoints,
                bounds,
                data.featureNames,
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
                data.featureNames,
                config,
                decisionBoundary,
                renderOptions
            );
            break;
    }



    // Add custom tooltips to all training points
    addTrainingPointTooltips(container, data, plotPoints);

    // If there are queries (selected points), render neighbor visualization
    if (data.queries && data.queries.length > 0) {
        const query = data.queries[0]; // Use first query (only one for training mode)
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        if (data.nDimensions === 2) {
            render2DQueryVisualization(
                container,
                query,
                data,
                bounds,
                innerWidth,
                innerHeight,
                {
                    colorScale: props.colorScale,
                    k: props.k,
                    showNeighborLines: true,
                    showDistanceCircles: false,
                    neighborLineColor: "#666",
                    neighborLineWidth: 1.5,
                    queryPointSize: 8,
                    highlightColor: "#ff6b6b",
                    interpolationFactor: 1,
                }
            );
        } else if (data.nDimensions === 1) {
            render1DQueryVisualization(
                container,
                query,
                data,
                bounds,
                innerWidth,
                innerHeight,
                {
                    colorScale: props.colorScale,
                    k: props.k,
                    showNeighborLines: true,
                    neighborLineColor: "#666",
                    neighborLineWidth: 1.5,
                    queryPointSize: 8,
                    highlightColor: "#ff6b6b",
                    interpolationFactor: 1,
                }
            );
        }
    }

    // Apply interpolation if in playback mode
    // Note: Only apply interpolation if we're actually in playback mode (maxSteps > 0)
    // For static training visualization, skip interpolation to keep points fully visible
    const maxSteps = context.state.maxSteps || 0;
    if (currentStep !== undefined && maxSteps > 0) {
        applyInterpolation(container, currentStep, context);
    }
}

/**
 * Renders KNN visualization for prediction mode
 * Shows training data, query points, and neighbor connections
 */
export function renderKNNPrediction({
    container,
    data,
    context,
    props,
}: RenderKNNVisualisationProps) {
    const {
        colorScale,
        k,
        showNeighborLines = true,
        showDistanceCircles = false,
        neighborLineColor = "#666",
        neighborLineWidth = 1.5,
        queryPointSize = 8,
        highlightColor = "#ff6b6b",
    } = props;
    const { dimensions, state } = context;
    const { width, height, margin } = dimensions;
    const { currentStep = 0 } = state;

    // Clear previous render
    container.selectAll("*").remove();

    // First, render the base visualization (training data + decision boundary)
    renderKNNTraining({ container, data, context, props });

    // If no queries, we're done
    if (!data.queries || data.queries.length === 0) {
        return;
    }

    // Determine which query to show based on current step
    const visibleQueryIndex = Math.min(currentStep, data.queries.length - 1);
    const currentQuery = data.queries[visibleQueryIndex];

    // Calculate interpolation factor for smooth animations
    const interpolationFactor = calculateInterpolationFactor(
        visibleQueryIndex,
        context
    );

    // Only show if element is visible (for playback)
    if (!isElementVisible(visibleQueryIndex, context)) {
        return;
    }

    // Setup for rendering query-specific elements
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales based on dimension
    const bounds = calculateCombinedBounds(data.trainingPoints, undefined, 0.1);

    if (data.nDimensions === 2) {
        render2DQueryVisualization(
            container,
            currentQuery,
            data,
            bounds,
            innerWidth,
            innerHeight,
            {
                colorScale,
                k,
                showNeighborLines,
                showDistanceCircles,
                neighborLineColor,
                neighborLineWidth,
                queryPointSize,
                highlightColor,
                interpolationFactor,
            }
        );
    } else if (data.nDimensions === 1) {
        render1DQueryVisualization(
            container,
            currentQuery,
            data,
            bounds,
            innerWidth,
            innerHeight,
            {
                colorScale,
                k,
                showNeighborLines,
                neighborLineColor,
                neighborLineWidth,
                queryPointSize,
                highlightColor,
                interpolationFactor,
            }
        );
    }
    // 3D would require more complex visualization
}

// ============================================================================
// Helper Functions - 2D Query Visualization
// ============================================================================

function render2DQueryVisualization(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    query: any,
    data: KNNVisualizationData,
    bounds: { min: number[]; max: number[] },
    width: number,
    height: number,
    options: {
        colorScale: d3.ScaleOrdinal<string, string>;
        k: number;
        showNeighborLines: boolean;
        showDistanceCircles: boolean;
        neighborLineColor: string;
        neighborLineWidth: number;
        queryPointSize: number;
        highlightColor: string;
        interpolationFactor: number;
    }
) {
    const {
        colorScale,
        k,
        showNeighborLines,
        showDistanceCircles,
        neighborLineWidth,
        queryPointSize,
        highlightColor,
        interpolationFactor,
    } = options;

    // Create scales
    const xScale = d3
        .scaleLinear()
        .domain([bounds.min[0], bounds.max[0]])
        .range([0, width])
        .nice();

    const yScale = d3
        .scaleLinear()
        .domain([bounds.min[1], bounds.max[1]])
        .range([height, 0])
        .nice();

    const queryGroup = container.append("g").attr("class", "knn-query");

    // Draw distance circle if enabled
    if (showDistanceCircles && query.neighbors.length > 0) {
        const maxNeighbor = query.neighbors[k - 1];
        const maxDistance = maxNeighbor.distance;

        // Convert distance to screen coordinates (approximate)
        const xDist =
            xScale(query.queryPoint[0] + maxDistance) -
            xScale(query.queryPoint[0]);

        queryGroup
            .append("circle")
            .attr("class", "knn-distance-circle")
            .attr("cx", xScale(query.queryPoint[0]))
            .attr("cy", yScale(query.queryPoint[1]))
            .attr("r", xDist)
            .attr("fill", "none")
            .attr("stroke", highlightColor)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "5,5")
            .attr("opacity", 0.3 * interpolationFactor);
    }

    // Draw lines to ALL points
    if (showNeighborLines) {
        const neighborSet = new Set(
            query.neighbors.slice(0, k).map((n: any) => n.index)
        );
        const pointRadius = 5; // Should match the actual point radius

        // Create a group for lines (will be behind hover circles)
        const linesGroup = queryGroup
            .append("g")
            .attr("class", "distance-lines");

        // Draw lines to all training points
        const lineData: Array<{
            trainingPoint: number[];
            idx: number;
            isNeighbor: boolean;
            distance: number;
            line: d3.Selection<SVGLineElement, unknown, null, undefined>;
        }> = [];

        data.trainingPoints.forEach((trainingPoint: number[], idx: number) => {
            // Skip the query point itself
            if (
                trainingPoint[0] === query.queryPoint[0] &&
                trainingPoint[1] === query.queryPoint[1]
            ) {
                return;
            }

            const isNeighbor = neighborSet.has(idx);
            const distance = query.allDistances[idx];

            // Calculate angle from query point to training point
            const dx = xScale(trainingPoint[0]) - xScale(query.queryPoint[0]);
            const dy = yScale(trainingPoint[1]) - yScale(query.queryPoint[1]);
            const angle = Math.atan2(dy, dx);

            // Calculate edge points (offset by circle radius)
            const x1 =
                xScale(query.queryPoint[0]) + pointRadius * Math.cos(angle);
            const y1 =
                yScale(query.queryPoint[1]) + pointRadius * Math.sin(angle);
            const x2 = xScale(trainingPoint[0]) - pointRadius * Math.cos(angle);
            const y2 = yScale(trainingPoint[1]) - pointRadius * Math.sin(angle);

            // Create line
            const line = linesGroup
                .append("line")
                .attr(
                    "class",
                    isNeighbor ? "knn-neighbor-line" : "knn-other-line"
                )
                .attr("x1", x1)
                .attr("y1", y1)
                .attr("x2", x2)
                .attr("y2", y2)
                .attr("stroke", isNeighbor ? highlightColor : "#ccc")
                .attr("stroke-width", isNeighbor ? neighborLineWidth : 0.5)
                .attr(
                    "opacity",
                    (isNeighbor ? 0.7 : 0.15) * interpolationFactor
                )
                .attr("data-point-index", idx);

            lineData.push({ trainingPoint, idx, isNeighbor, distance, line });
        });

        // Create hover circles over each training point (except query point)
        const hoverGroup = queryGroup
            .append("g")
            .attr("class", "hover-targets");

        lineData.forEach(
            ({ trainingPoint, idx, isNeighbor, distance, line }) => {
                // Distance label group (hidden by default)
                const textGroup = queryGroup
                    .append("g")
                    .style("display", "none");

                const textBg = textGroup
                    .append("rect")
                    .attr("fill", "white")
                    .attr("stroke", "#333")
                    .attr("stroke-width", 1)
                    .attr("rx", 3);

                const distanceText = textGroup
                    .append("text")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .attr("font-size", "11px")
                    .attr("font-weight", "500")
                    .attr("fill", "#333")
                    .text(`d = ${distance.toFixed(2)}`);

                // Get the class label for this point
                const classLabel = data.trainingLabels[idx];

                // Create tooltip text with point details
                const tooltipLines = [
                    `Point: (${trainingPoint[0].toFixed(
                        2
                    )}, ${trainingPoint[1].toFixed(2)})`,
                    `Class: ${classLabel}`,
                    `Distance: ${distance.toFixed(2)}`,
                ];

                // Create invisible larger circle for hover detection
                const hoverCircle = hoverGroup
                    .append("circle")
                    .attr("cx", xScale(trainingPoint[0]))
                    .attr("cy", yScale(trainingPoint[1]))
                    .attr("r", pointRadius + 3) // Slightly larger for easier hover
                    .attr("fill", "transparent")
                    .attr("data-point-index", idx)
                    .style("cursor", "default")
                    .style("pointer-events", "all");

                // Hover behavior - show tooltip
                hoverCircle
                    .on("mouseenter", function () {
                        // Highlight the line
                        line.attr(
                            "stroke-width",
                            isNeighbor ? neighborLineWidth + 1 : 1.5
                        ).attr("opacity", 0.9);

                        // Position tooltip near the hovered point
                        const cx = xScale(trainingPoint[0]);
                        const cy = yScale(trainingPoint[1]);

                        // Clear previous text and add new lines
                        distanceText.text("");
                        tooltipLines.forEach((line, i) => {
                            distanceText
                                .append("tspan")
                                .attr("x", 0)
                                .attr("dy", i === 0 ? 0 : "1.2em")
                                .text(line);
                        });

                        // Get text dimensions and set background
                        const bbox = (
                            distanceText.node() as SVGTextElement
                        ).getBBox();
                        const padding = 6;
                        const labelX = cx;
                        const labelY =
                            cy - pointRadius - bbox.height - padding * 2 - 5;

                        textBg
                            .attr("x", labelX - bbox.width / 2 - padding)
                            .attr("y", labelY - padding)
                            .attr("width", bbox.width + padding * 2)
                            .attr("height", bbox.height + padding * 2);

                        distanceText
                            .attr("x", labelX)
                            .attr("y", labelY + bbox.height / 2);

                        textGroup.style("display", null).raise();
                    })
                    .on("mouseleave", function () {
                        // Reset line
                        line.attr(
                            "stroke-width",
                            isNeighbor ? neighborLineWidth : 0.5
                        ).attr(
                            "opacity",
                            (isNeighbor ? 0.7 : 0.15) * interpolationFactor
                        );

                        textGroup.style("display", "none");
                    });
            }
        );
    }

    // Highlight neighbor points
    query.neighbors.slice(0, k).forEach((neighbor: any) => {
        const trainingPoint = data.trainingPoints[neighbor.index];

        queryGroup
            .append("circle")
            .attr("class", "knn-neighbor-highlight")
            .attr("cx", xScale(trainingPoint[0]))
            .attr("cy", yScale(trainingPoint[1]))
            .attr("r", 7)
            .attr("fill", "none")
            .attr("stroke", highlightColor)
            .attr("stroke-width", 2.5)
            .attr("opacity", 0.8 * interpolationFactor);
    });

    // Draw query point
    queryGroup
        .append("circle")
        .attr("class", "knn-query-point")
        .attr("cx", xScale(query.queryPoint[0]))
        .attr("cy", yScale(query.queryPoint[1]))
        .attr("r", queryPointSize)
        .attr("fill", colorScale(query.prediction))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2.5)
        .attr("opacity", interpolationFactor);

    // Add query point marker (X or star)
    queryGroup
        .append("text")
        .attr("class", "knn-query-marker")
        .attr("x", xScale(query.queryPoint[0]))
        .attr("y", yScale(query.queryPoint[1]))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "#fff")
        .attr("pointer-events", "none")
        .text("?")
        .attr("opacity", interpolationFactor);
}

// ============================================================================
// Helper Functions - 1D Query Visualization
// ============================================================================

function render1DQueryVisualization(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    query: any,
    data: KNNVisualizationData,
    bounds: { min: number[]; max: number[] },
    width: number,
    height: number,
    options: {
        colorScale: d3.ScaleOrdinal<string, string>;
        k: number;
        showNeighborLines: boolean;
        neighborLineColor: string;
        neighborLineWidth: number;
        queryPointSize: number;
        highlightColor: string;
        interpolationFactor: number;
    }
) {
    const {
        colorScale,
        k,
        showNeighborLines,
        neighborLineWidth,
        queryPointSize,
        highlightColor,
        interpolationFactor,
    } = options;

    // Create scale
    const xScale = d3
        .scaleLinear()
        .domain([bounds.min[0], bounds.max[0]])
        .range([0, width])
        .nice();

    const stripCenter = height / 2;

    const queryGroup = container.append("g").attr("class", "knn-query");

    // Draw lines to ALL points
    if (showNeighborLines) {
        const neighborSet = new Set(
            query.neighbors.slice(0, k).map((n: any) => n.index)
        );
        const pointRadius = 6; // Should match the actual point radius for 1D

        // Create a group for lines (will be behind hover circles)
        const linesGroup = queryGroup
            .append("g")
            .attr("class", "distance-lines");

        // Draw lines to all training points
        const lineData: Array<{
            trainingPoint: number[];
            idx: number;
            isNeighbor: boolean;
            distance: number;
            line: d3.Selection<SVGLineElement, unknown, null, undefined>;
        }> = [];

        data.trainingPoints.forEach((trainingPoint: number[], idx: number) => {
            // Skip the query point itself
            if (trainingPoint[0] === query.queryPoint[0]) {
                return;
            }

            const isNeighbor = neighborSet.has(idx);
            const distance = query.allDistances[idx];

            // Calculate edge points (offset by circle radius in x direction)
            const x1Pos = xScale(query.queryPoint[0]);
            const x2Pos = xScale(trainingPoint[0]);
            const direction = x2Pos > x1Pos ? 1 : -1;

            const x1 = x1Pos + pointRadius * direction;
            const x2 = x2Pos - pointRadius * direction;

            // Create line
            const line = linesGroup
                .append("line")
                .attr(
                    "class",
                    isNeighbor ? "knn-neighbor-line" : "knn-other-line"
                )
                .attr("x1", x1)
                .attr("y1", stripCenter)
                .attr("x2", x2)
                .attr("y2", stripCenter)
                .attr("stroke", isNeighbor ? highlightColor : "#ccc")
                .attr("stroke-width", isNeighbor ? neighborLineWidth : 0.5)
                .attr(
                    "opacity",
                    (isNeighbor ? 0.7 : 0.15) * interpolationFactor
                )
                .attr("data-point-index", idx);

            lineData.push({ trainingPoint, idx, isNeighbor, distance, line });
        });

        // Create hover circles over each training point (except query point)
        const hoverGroup = queryGroup
            .append("g")
            .attr("class", "hover-targets");

        lineData.forEach(
            ({ trainingPoint, idx, isNeighbor, distance, line }) => {
                // Distance label group (hidden by default)
                const textGroup = queryGroup
                    .append("g")
                    .style("display", "none");

                const textBg = textGroup
                    .append("rect")
                    .attr("fill", "white")
                    .attr("stroke", "#333")
                    .attr("stroke-width", 1)
                    .attr("rx", 3);

                const distanceText = textGroup
                    .append("text")
                    .attr("text-anchor", "middle")
                    .attr("dominant-baseline", "middle")
                    .attr("font-size", "11px")
                    .attr("font-weight", "500")
                    .attr("fill", "#333")
                    .text(`d = ${distance.toFixed(2)}`);

                // Get the class label for this point
                const classLabel = data.trainingLabels[idx];

                // Create tooltip text with point details
                const tooltipLines = [
                    `Point: ${trainingPoint[0].toFixed(2)}`,
                    `Class: ${classLabel}`,
                    `Distance: ${distance.toFixed(2)}`,
                ];

                // Create invisible larger circle for hover detection
                const hoverCircle = hoverGroup
                    .append("circle")
                    .attr("cx", xScale(trainingPoint[0]))
                    .attr("cy", stripCenter)
                    .attr("r", pointRadius + 3) // Slightly larger for easier hover
                    .attr("fill", "transparent")
                    .attr("data-point-index", idx)
                    .style("cursor", "default")
                    .style("pointer-events", "all");

                // Hover behavior - show tooltip
                hoverCircle
                    .on("mouseenter", function () {
                        // Highlight the line
                        line.attr(
                            "stroke-width",
                            isNeighbor ? neighborLineWidth + 1 : 1.5
                        ).attr("opacity", 0.9);

                        // Position tooltip near the hovered point
                        const cx = xScale(trainingPoint[0]);

                        // Clear previous text and add new lines
                        distanceText.text("");
                        tooltipLines.forEach((line, i) => {
                            distanceText
                                .append("tspan")
                                .attr("x", 0)
                                .attr("dy", i === 0 ? 0 : "1.2em")
                                .text(line);
                        });

                        // Get text dimensions and set background
                        const bbox = (
                            distanceText.node() as SVGTextElement
                        ).getBBox();
                        const padding = 6;
                        const labelX = cx;
                        const labelY =
                            stripCenter -
                            pointRadius -
                            bbox.height -
                            padding * 2 -
                            5;

                        textBg
                            .attr("x", labelX - bbox.width / 2 - padding)
                            .attr("y", labelY - padding)
                            .attr("width", bbox.width + padding * 2)
                            .attr("height", bbox.height + padding * 2);

                        distanceText
                            .attr("x", labelX)
                            .attr("y", labelY + bbox.height / 2);

                        textGroup.style("display", null).raise();
                    })
                    .on("mouseleave", function () {
                        // Reset line
                        line.attr(
                            "stroke-width",
                            isNeighbor ? neighborLineWidth : 0.5
                        ).attr(
                            "opacity",
                            (isNeighbor ? 0.7 : 0.15) * interpolationFactor
                        );

                        textGroup.style("display", "none");
                    });
            }
        );
    }

    // Highlight neighbor points
    query.neighbors.slice(0, k).forEach((neighbor: any) => {
        const trainingPoint = data.trainingPoints[neighbor.index];

        queryGroup
            .append("circle")
            .attr("class", "knn-neighbor-highlight")
            .attr("cx", xScale(trainingPoint[0]))
            .attr("cy", stripCenter)
            .attr("r", 7)
            .attr("fill", "none")
            .attr("stroke", highlightColor)
            .attr("stroke-width", 2.5)
            .attr("opacity", 0.8 * interpolationFactor);
    });

    // Draw query point
    queryGroup
        .append("circle")
        .attr("class", "knn-query-point")
        .attr("cx", xScale(query.queryPoint[0]))
        .attr("cy", stripCenter)
        .attr("r", queryPointSize)
        .attr("fill", colorScale(query.prediction))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2.5)
        .attr("opacity", interpolationFactor);

    // Add query point marker
    queryGroup
        .append("text")
        .attr("class", "knn-query-marker")
        .attr("x", xScale(query.queryPoint[0]))
        .attr("y", stripCenter)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "#fff")
        .attr("pointer-events", "none")
        .text("?")
        .attr("opacity", interpolationFactor);
}

// ============================================================================
// Training Point Tooltips
// ============================================================================

/**
 * Setup HTML tooltip (similar to decision tree)
 */
function setupKNNTooltip(): d3.Selection<
    HTMLDivElement,
    unknown,
    HTMLElement,
    any
> {
    const tooltipId = "knn-point-tooltip";
    const existingTooltip = d3.select(`#${tooltipId}`);

    if (existingTooltip.empty()) {
        return d3
            .select("body")
            .append("div")
            .attr("id", tooltipId)
            .attr(
                "class",
                "absolute bg-gray-800 text-white p-3 rounded-lg shadow-lg pointer-events-none opacity-0 z-50 max-w-xs"
            )
            .style("transition", "opacity 0.3s");
    } else {
        existingTooltip.style("opacity", 0);
        return existingTooltip as unknown as d3.Selection<
            HTMLDivElement,
            unknown,
            HTMLElement,
            any
        >;
    }
}

/**
 * Adds custom hover tooltips to all training points
 */
function addTrainingPointTooltips(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: KNNVisualizationData,
    plotPoints: any[]
) {
    // Setup HTML tooltip
    const tooltip = setupKNNTooltip();

    // Find all data point circles (works for both 2D and 3D)
    const circles = container.selectAll(".data-points circle, .data-points-3d circle");

    circles.each(function (_d: any, i: number) {
        const circle = d3.select(this);
        const point = plotPoints[i];
        const classLabel = data.trainingLabels[point.originalIndex];

        // Prepare tooltip content based on dimensions
        const getTooltipContent = () => {
            let content = `<div class="font-semibold text-base mb-2">Training Point</div>`;

            if (data.nDimensions === 1) {
                content += `<div class="text-sm">Position: ${point.coordinates[0].toFixed(
                    2
                )}</div>`;
            } else if (data.nDimensions === 2) {
                content += `<div class="text-sm">Position: (${point.coordinates[0].toFixed(
                    2
                )}, ${point.coordinates[1].toFixed(2)})</div>`;
            } else {
                content += `<div class="text-sm">Position: (${point.coordinates[0].toFixed(
                    2
                )}, ${point.coordinates[1].toFixed(
                    2
                )}, ${point.coordinates[2].toFixed(2)})</div>`;
            }

            content += `<div class="text-sm">Class: <span class="font-semibold">${classLabel}</span></div>`;

            return content;
        };

        // Add hover behavior
        circle
            .style("cursor", "default")
            .on("mouseover.tooltip", function (event: any) {
                tooltip.html(getTooltipContent());

                tooltip
                    .style("background-color", "white")
                    .style("color", "black")
                    .style("opacity", 0.95)
                    .style("left", event.pageX + 15 + "px")
                    .style("top", event.pageY - 10 + "px");
            })
            .on("mousemove.tooltip", function (event: any) {
                tooltip
                    .style("left", event.pageX + 15 + "px")
                    .style("top", event.pageY - 10 + "px");
            })
            .on("mouseout.tooltip", function () {
                tooltip.style("opacity", 0);
            })
            .on("mouseleave.tooltip", function () {
                tooltip.style("opacity", 0);
            });
    });
}

// ============================================================================
// Utility Functions
// ============================================================================

function applyInterpolation(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    currentStep: number,
    context: any
) {
    // Apply fade-in effect based on interpolation
    const factor = calculateInterpolationFactor(currentStep, context);

    container.selectAll(".data-points circle").each(function () {
        const currentOpacity = d3.select(this).attr("opacity");
        const newOpacity = parseFloat(currentOpacity || "0.8") * factor;
        d3.select(this).style("opacity", newOpacity);
    });
}
