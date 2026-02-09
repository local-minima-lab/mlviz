/**
 * KMeans Renderer
 * D3-based rendering functions for K-Means clustering visualization
 * Handles centroid placement, cluster assignments, and iteration playback
 */

import type {
    KMeansVisualizationData,
    RenderKMeansProps,
} from "@/components/kmeans/clustering/types";
import type { ClusteringConfig, PlotPoint } from "@/components/plots/types";
import {
    calculateCombinedBounds,
    createPlotPoints,
} from "@/components/plots/utils/dataTransformers";
import {
    renderScatter1D,
    renderScatter2D,
} from "@/components/plots/utils/scatterRenderers";
import * as d3 from "d3";

// ============================================================================
// Main Render Function
// ============================================================================

/**
 * Renders KMeans visualization for training mode
 * Shows data points colored by cluster assignment and centroids
 */
export function renderKMeansTraining({
    container,
    data,
    context,
    props,
}: RenderKMeansProps) {
    const { dimensions } = context;
    const { width, height, margin } = dimensions;
    const {
        colorScale,
        currentIteration = 0,
        showCentroidMovement = true,
        centroidSize = 6,
    } = props;

    // Clear previous render
    container.selectAll("*").remove();

    // Get current iteration data
    // Special case: if no iterations exist (prediction mode), use final state
    let iterationData: { assignments: number[]; centroids: number[][] };
    let iterationIndex: number;

    if (!data.iterations || data.iterations.length === 0) {
        // No iterations - use final state (prediction mode)
        iterationData = {
            assignments: data.finalAssignments,
            centroids: data.finalCentroids,
        };
        iterationIndex = -1;
    } else {
        // Use Math.floor and clamp to handle indices from interpolation/playback boundaries
        iterationIndex = Math.min(
            Math.floor(currentIteration),
            data.iterations.length - 1,
        );
        iterationData = data.iterations[iterationIndex];

        if (!iterationData) {
            console.warn(
                "[KMeansRenderer] No iteration data for index:",
                currentIteration,
                "clamped to:",
                iterationIndex,
            );
            return;
        }
    }

    // Prepare plot data with cluster assignments
    const plotData = data.dataPoints;
    // Use activeClusterCount from props if available, otherwise fallback to data's nClusters
    const nClusters =
        props.activeClusterCount !== undefined
            ? props.activeClusterCount
            : data.nClusters;

    // If no clusters, use a default unassigned state
    const clusterNames =
        nClusters > 0
            ? Array.from({ length: nClusters }, (_, i) => `Cluster ${i}`)
            : [];

    // Always include "Unassigned" if there are any unassigned points or if nClusters is 0
    const hasUnassignedPoints =
        nClusters === 0 || iterationData.assignments.some((id) => id === -1);
    if (hasUnassignedPoints && !clusterNames.includes("Unassigned")) {
        clusterNames.push("Unassigned");
    }

    console.log("[KMeansRenderer] Rendering state:", {
        currentIteration,
        iterationIndex,
        nClusters,
        clusterNames,
        totalDataPoints: plotData.length,
    });

    // Map assignments to cluster names
    // If nClusters is 0, all points should be considered "Unassigned"
    const labels = iterationData.assignments.map((clusterId) => {
        if (nClusters === 0 || clusterId === -1) return "Unassigned";
        return clusterNames[clusterId] || "Unassigned";
    });

    const config: ClusteringConfig = {
        type: "clustering",
        clusterNames: clusterNames,
        labels: labels,
    };

    // Create dynamic decision boundary for the current iteration
    let decisionBoundary = undefined;
    if (data.decisionBoundary) {
        const currentCentroids = iterationData.centroids;
        const meshPoints = data.decisionBoundary.meshPoints;

        // Recalculate predictions based on current centroids
        const dynamicPredictions = meshPoints.map((point) => {
            if (currentCentroids.length === 0) return "Unassigned";

            let minDistance = Infinity;
            let closestIndex = -1;

            currentCentroids.forEach((centroid, index) => {
                // Calculate Euclidean distance (renderer only handles 1D/2D)
                let distSq = 0;
                for (let d = 0; d < centroid.length; d++) {
                    distSq += Math.pow(point[d] - centroid[d], 2);
                }

                if (distSq < minDistance) {
                    minDistance = distSq;
                    closestIndex = index;
                }
            });

            return clusterNames[closestIndex] || "Unassigned";
        });

        decisionBoundary = {
            type: "clustering" as const,
            meshPoints: meshPoints,
            predictions: dynamicPredictions,
            dimensions: data.decisionBoundary.dimensions,
        };
    }

    // Transform data to plot points
    const plotPoints = createPlotPoints(plotData, config);

    console.log("[KMeansRenderer] Plot data debug:", {
        plotDataLength: plotData.length,
        plotPointsLength: plotPoints.length,
        samplePlotData: plotData[0],
        hasDecisionBoundary: !!decisionBoundary,
    });

    // Safety check for empty data
    if (plotData.length === 0) {
        console.warn("[KMeansRenderer] No data points to render");
        return;
    }

    const bounds = calculateCombinedBounds(
        plotData,
        decisionBoundary,
        decisionBoundary ? 0 : 0.1,
    );

    // Render options
    const renderOptions = {
        width,
        height,
        margin,
        pointRadius: 5,
        pointOpacity: 0.7,
        showGrid: true,
        showLegend: true,
        showAxes: true,
        useNiceScales: !decisionBoundary,
    };

    // Render appropriate scatter plot based on dimensions
    let renderResult:
        | {
              xScale: d3.ScaleLinear<number, number>;
              yScale?: d3.ScaleLinear<number, number>;
              colorScale?: (point: PlotPoint) => string;
              contentGroup?: d3.Selection<
                  SVGGElement,
                  unknown,
                  null,
                  undefined
              >;
          }
        | undefined;
    const dimensions_to_render = data.nDimensions;

    switch (dimensions_to_render) {
        case 1:
            renderResult = renderScatter1D(
                container,
                plotPoints,
                bounds,
                data.featureNames,
                config,
                decisionBoundary,
                renderOptions,
            );
            break;
        case 2:
            renderResult = renderScatter2D(
                container,
                plotPoints,
                bounds,
                data.featureNames,
                config,
                decisionBoundary,
                renderOptions,
            );
            break;
    }

    if (!renderResult) {
        console.warn(
            "[KMeansRenderer] No render result for dimensions:",
            dimensions_to_render,
        );
        return;
    }

    const targetGroup = renderResult.contentGroup || container;

    // Render centroids
    if (dimensions_to_render === 2 && renderResult.yScale) {
        renderCentroids2D(
            targetGroup,
            iterationData.centroids,
            renderResult.xScale,
            renderResult.yScale,
            {
                colorScale,
                centroidSize,
                clusterNames,
                opacity: props.isPlacementMode ? 0.3 : 1,
                tooltipSuffix: props.isPlacementMode ? " (Previous)" : "",
            },
        );

        // Show centroid movement if not first iteration
        if (showCentroidMovement && iterationIndex > 0) {
            const prevIteration = data.iterations[iterationIndex - 1];
            if (prevIteration) {
                renderCentroidMovement2D(
                    targetGroup,
                    prevIteration.centroids,
                    iterationData.centroids,
                    renderResult.xScale,
                    renderResult.yScale,
                    {
                        colorScale,
                        clusterNames,
                    },
                );
            }
        }
    } else if (dimensions_to_render === 1) {
        const innerHeight = height - margin.top - margin.bottom;
        renderCentroids1D(
            targetGroup,
            iterationData.centroids,
            renderResult.xScale,
            innerHeight / 2,
            {
                colorScale,
                centroidSize,
                clusterNames,
                opacity: props.isPlacementMode ? 0.3 : 1,
                tooltipSuffix: props.isPlacementMode ? " (Previous)" : "",
            },
        );

        // Show centroid movement if not first iteration
        if (showCentroidMovement && iterationIndex > 0) {
            const prevIteration = data.iterations[iterationIndex - 1];
            if (prevIteration) {
                renderCentroidMovement1D(
                    targetGroup,
                    prevIteration.centroids,
                    iterationData.centroids,
                    renderResult.xScale,
                    innerHeight / 2,
                    {
                        colorScale,
                        clusterNames,
                    },
                );
            }
        }
    }

    return renderResult;
}

/**
 * Renders KMeans visualization for prediction mode
 * Shows training data, query points, and centroid connections
 * Uses the same rendering as training mode for consistency
 */
export function renderKMeansPrediction({
    container,
    data,
    context,
    props,
}: RenderKMeansProps & {
    props: {
        colorScale: d3.ScaleOrdinal<string, string>;
        showCentroidLines?: boolean;
        centroidLineColor?: string;
        centroidLineWidth?: number;
        queryPointSize?: number;
        highlightColor?: string;
    };
}) {
    const {
        colorScale,
        showCentroidLines = true,
        centroidLineColor = "#666",
        centroidLineWidth = 1.5,
        queryPointSize = 8,
        highlightColor = "#666",
    } = props;

    // Clear previous render
    container.selectAll("*").remove();

    // First, render the base visualization (training data + decision boundary)
    // Use the last iteration (final state) for prediction mode
    // If no iterations exist, use -1 which will trigger final state rendering
    const currentIteration =
        data.iterations && data.iterations.length > 0
            ? data.iterations.length - 1
            : -1;

    const baseRenderResult = renderKMeansTraining({
        container,
        data,
        context,
        props: {
            colorScale,
            currentIteration,
            showCentroidMovement: false,
            centroidSize: 10,
        },
    });

    // If no queries, we're done
    if (!data.queries || data.queries.length === 0) {
        return;
    }

    // Guard check for baseRenderResult
    if (!baseRenderResult) {
        console.warn(
            "[KMeansRenderer] No base render result available for prediction mode",
        );
        return;
    }

    const targetGroup = baseRenderResult.contentGroup || container;
    const dimensions_to_render = data.nDimensions;

    // For prediction mode, show all query points
    data.queries.forEach((query: any) => {
        if (dimensions_to_render === 2 && baseRenderResult.yScale) {
            render2DQueryVisualization(
                targetGroup,
                query,
                data,
                baseRenderResult.xScale,
                baseRenderResult.yScale,
                {
                    colorScale,
                    showCentroidLines,
                    centroidLineColor,
                    centroidLineWidth,
                    queryPointSize,
                    highlightColor,
                },
            );
        } else if (dimensions_to_render === 1) {
            const { height, margin } = context.dimensions;
            const innerHeight = height - margin.top - margin.bottom;
            render1DQueryVisualization(
                targetGroup,
                query,
                data,
                baseRenderResult.xScale,
                innerHeight / 2,
                {
                    colorScale,
                    showCentroidLines,
                    centroidLineColor,
                    centroidLineWidth,
                    queryPointSize,
                    highlightColor,
                },
            );
        }
    });
}

// ============================================================================
// Query Visualization - 2D
// ============================================================================

function render2DQueryVisualization(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    query: any,
    data: KMeansVisualizationData,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    options: {
        colorScale: d3.ScaleOrdinal<string, string>;
        showCentroidLines: boolean;
        centroidLineColor: string;
        centroidLineWidth: number;
        queryPointSize: number;
        highlightColor: string;
    },
) {
    const {
        colorScale,
        showCentroidLines,
        centroidLineWidth,
        queryPointSize,
        highlightColor,
    } = options;

    if (!xScale || !yScale) {
        console.error(
            "[KMeansRenderer] Missing scales for 2D query visualization",
        );
        return;
    }

    if (!query?.queryPoint || query.queryPoint.length < 2) {
        console.warn(
            "[KMeansRenderer] Malformed query point for 2D visualization:",
            query,
        );
        return;
    }

    const qX = xScale(query.queryPoint[0]);
    const qY = yScale(query.queryPoint[1]);

    if (isNaN(qX) || isNaN(qY)) {
        console.warn(
            "[KMeansRenderer] Query point resulted in NaN coordinates:",
            {
                point: query.queryPoint,
                qX,
                qY,
                xDomain: xScale.domain(),
                yDomain: yScale.domain(),
            },
        );
        return;
    }

    const queryGroup = container.append("g").attr("class", "kmeans-query");
    const tooltip = setupCentroidTooltip();

    // Draw lines to all centroids if enabled
    if (showCentroidLines && data.finalCentroids) {
        const linesGroup = queryGroup
            .append("g")
            .attr("class", "centroid-lines");
        const pointRadius = 5;

        data.finalCentroids.forEach((centroid: number[], idx: number) => {
            const cx = xScale(centroid[0]);
            const cy = yScale(centroid[1]);

            if (isNaN(cx) || isNaN(cy)) return;

            const isAssigned = query.assignment === idx;
            const distance = query.distances[idx];

            // Calculate angle from query point to centroid
            const dx = cx - qX;
            const dy = cy - qY;
            const angle = Math.atan2(dy, dx);

            // Calculate edge points (offset by circle radius)
            const x1 = qX + pointRadius * Math.cos(angle);
            const y1 = qY + pointRadius * Math.sin(angle);
            const x2 = cx - 10 * Math.cos(angle); // 10 is centroid size
            const y2 = cy - 10 * Math.sin(angle);

            if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return;

            // Create line
            const line = linesGroup
                .append("line")
                .attr(
                    "class",
                    isAssigned ? "kmeans-assigned-line" : "kmeans-other-line",
                )
                .attr("x1", x1)
                .attr("y1", y1)
                .attr("x2", x2)
                .attr("y2", y2)
                .attr("stroke", isAssigned ? highlightColor : "#ccc")
                .attr("stroke-width", isAssigned ? centroidLineWidth : 0.5)
                .attr("opacity", isAssigned ? 0.7 : 0.15);

            // Create hover target on centroid
            const hoverTarget = queryGroup
                .append("circle")
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("r", 15)
                .attr("fill", "transparent")
                .style("cursor", "pointer")
                .style("pointer-events", "all");

            const clusterName = `Cluster ${idx}`;
            const tooltipContent = `
                <div class="font-semibold text-gray-900 mb-1">${clusterName}</div>
                <div class="text-sm text-gray-700">Distance: ${distance.toFixed(4)}</div>
                ${isAssigned ? '<div class="text-xs text-blue-600 font-semibold mt-1">Assigned Cluster</div>' : ""}
            `;

            hoverTarget
                .on("mouseover", function (event: MouseEvent) {
                    line.attr(
                        "stroke-width",
                        isAssigned ? centroidLineWidth + 1 : 1.5,
                    ).attr("opacity", 0.9);
                    tooltip.html(tooltipContent);
                    tooltip
                        .style("opacity", 0.95)
                        .style("left", event.pageX + 15 + "px")
                        .style("top", event.pageY - 10 + "px");
                })
                .on("mousemove", function (event: MouseEvent) {
                    tooltip
                        .style("left", event.pageX + 15 + "px")
                        .style("top", event.pageY - 10 + "px");
                })
                .on("mouseout", function () {
                    line.attr(
                        "stroke-width",
                        isAssigned ? centroidLineWidth : 0.5,
                    ).attr("opacity", isAssigned ? 0.7 : 0.15);
                    tooltip.style("opacity", 0);
                });
        });
    }

    // Draw query point
    const clusterName = `Cluster ${query.assignment}`;
    const queryPointCircle = queryGroup
        .append("circle")
        .attr("class", "kmeans-query-point")
        .attr("cx", qX)
        .attr("cy", qY)
        .attr("r", queryPointSize)
        .attr("fill", colorScale(clusterName))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2.5)
        .attr("opacity", 1);

    // Add query point marker
    queryGroup
        .append("text")
        .attr("class", "kmeans-query-marker")
        .attr("x", qX)
        .attr("y", qY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "#fff")
        .attr("pointer-events", "none")
        .text("?");

    // Create hover target for query point
    const queryHoverTarget = queryGroup
        .append("circle")
        .attr("class", "kmeans-query-hover-target")
        .attr("cx", qX)
        .attr("cy", qY)
        .attr("r", queryPointSize + 5)
        .attr("fill", "transparent")
        .style("cursor", "pointer")
        .style("pointer-events", "all");

    // Ensure the query point and its hover target are on top
    queryPointCircle.raise();
    queryGroup.select(".kmeans-query-marker").raise();
    queryHoverTarget.raise();

    // Add interactive tooltip for query point
    const queryTooltipContent = `
        <div class="font-semibold text-gray-900 mb-1">Prediction: <span class="text-blue-600">${clusterName}</span></div>
        <div class="text-sm text-gray-700">Distance to centroid: ${query.assignedDistance.toFixed(4)}</div>
    `;

    queryHoverTarget
        .on("mouseover", function (event: MouseEvent) {
            tooltip.html(queryTooltipContent);
            tooltip
                .style("opacity", 0.95)
                .style("left", event.pageX + 15 + "px")
                .style("top", event.pageY - 10 + "px");
        })
        .on("mousemove", function (event: MouseEvent) {
            tooltip
                .style("left", event.pageX + 15 + "px")
                .style("top", event.pageY - 10 + "px");
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });
}

// ============================================================================
// Query Visualization - 1D
// ============================================================================

function render1DQueryVisualization(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    query: any,
    data: KMeansVisualizationData,
    xScale: d3.ScaleLinear<number, number>,
    stripCenter: number,
    options: {
        colorScale: d3.ScaleOrdinal<string, string>;
        showCentroidLines: boolean;
        centroidLineColor: string;
        centroidLineWidth: number;
        queryPointSize: number;
        highlightColor: string;
    },
) {
    const {
        colorScale,
        showCentroidLines,
        centroidLineWidth,
        queryPointSize,
        highlightColor,
    } = options;

    if (!xScale) {
        console.error(
            "[KMeansRenderer] Missing xScale for 1D query visualization",
        );
        return;
    }

    if (!query?.queryPoint || query.queryPoint.length < 1) {
        console.warn(
            "[KMeansRenderer] Malformed query point for 1D visualization:",
            query,
        );
        return;
    }

    const qX = xScale(query.queryPoint[0]);
    if (isNaN(qX)) {
        console.warn(
            "[KMeansRenderer] Query point resulted in NaN coordinates (1D):",
            {
                point: query.queryPoint,
                qX,
                domain: xScale.domain(),
            },
        );
        return;
    }

    const queryGroup = container.append("g").attr("class", "kmeans-query");
    const tooltip = setupCentroidTooltip();

    // Draw lines to all centroids if enabled
    if (showCentroidLines && data.finalCentroids) {
        const linesGroup = queryGroup
            .append("g")
            .attr("class", "centroid-lines");
        const pointRadius = 6;

        data.finalCentroids.forEach((centroid: number[], idx: number) => {
            const cx = xScale(centroid[0]);

            if (isNaN(cx)) return;

            const isAssigned = query.assignment === idx;
            const distance = query.distances[idx];

            // Calculate edge points (offset by circle radius in x direction)
            const direction = cx > qX ? 1 : -1;
            const x1 = qX + pointRadius * direction;
            const x2 = cx - 10 * direction; // 10 is centroid size

            // Create line
            const line = linesGroup
                .append("line")
                .attr(
                    "class",
                    isAssigned ? "kmeans-assigned-line" : "kmeans-other-line",
                )
                .attr("x1", x1)
                .attr("y1", stripCenter)
                .attr("x2", x2)
                .attr("y2", stripCenter)
                .attr("stroke", isAssigned ? highlightColor : "#ccc")
                .attr("stroke-width", isAssigned ? centroidLineWidth : 0.5)
                .attr("opacity", isAssigned ? 0.7 : 0.15);

            // Create hover target on centroid
            const hoverTarget = queryGroup
                .append("circle")
                .attr("cx", cx)
                .attr("cy", stripCenter)
                .attr("r", 15)
                .attr("fill", "transparent")
                .style("cursor", "pointer")
                .style("pointer-events", "all");

            const clusterName = `Cluster ${idx}`;
            const tooltipContent = `
                <div class="font-semibold text-gray-900 mb-1">${clusterName}</div>
                <div class="text-sm text-gray-700">Distance: ${distance.toFixed(4)}</div>
                ${isAssigned ? '<div class="text-xs text-blue-600 font-semibold mt-1">Assigned Cluster</div>' : ""}
            `;

            hoverTarget
                .on("mouseover", function (event: MouseEvent) {
                    line.attr(
                        "stroke-width",
                        isAssigned ? centroidLineWidth + 1 : 1.5,
                    ).attr("opacity", 0.9);
                    tooltip.html(tooltipContent);
                    tooltip
                        .style("opacity", 0.95)
                        .style("left", event.pageX + 15 + "px")
                        .style("top", event.pageY - 10 + "px");
                })
                .on("mousemove", function (event: MouseEvent) {
                    tooltip
                        .style("left", event.pageX + 15 + "px")
                        .style("top", event.pageY - 10 + "px");
                })
                .on("mouseout", function () {
                    line.attr(
                        "stroke-width",
                        isAssigned ? centroidLineWidth : 0.5,
                    ).attr("opacity", isAssigned ? 0.7 : 0.15);
                    tooltip.style("opacity", 0);
                });
        });
    }

    // Draw query point
    const clusterName = `Cluster ${query.assignment}`;
    const queryPointCircle = queryGroup
        .append("circle")
        .attr("class", "kmeans-query-point")
        .attr("cx", qX)
        .attr("cy", stripCenter)
        .attr("r", queryPointSize)
        .attr("fill", colorScale(clusterName))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2.5)
        .attr("opacity", 1);

    // Add query point marker
    queryGroup
        .append("text")
        .attr("class", "kmeans-query-marker")
        .attr("x", qX)
        .attr("y", stripCenter)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "#fff")
        .attr("pointer-events", "none")
        .text("?");

    // Create hover target for query point
    const queryHoverTarget = queryGroup
        .append("circle")
        .attr("class", "kmeans-query-hover-target")
        .attr("cx", qX)
        .attr("cy", stripCenter)
        .attr("r", queryPointSize + 5)
        .attr("fill", "transparent")
        .style("cursor", "pointer")
        .style("pointer-events", "all");

    // Ensure the query point and its hover target are on top
    queryPointCircle.raise();
    queryGroup.select(".kmeans-query-marker").raise();
    queryHoverTarget.raise();

    // Add interactive tooltip for query point
    const queryTooltipContent = `
        <div class="font-semibold text-gray-900 mb-1">Prediction: <span class="text-blue-600">${clusterName}</span></div>
        <div class="text-sm text-gray-700">Distance to centroid: ${query.assignedDistance.toFixed(4)}</div>
    `;

    queryHoverTarget
        .on("mouseover", function (event: MouseEvent) {
            tooltip.html(queryTooltipContent);
            tooltip
                .style("opacity", 0.95)
                .style("left", event.pageX + 15 + "px")
                .style("top", event.pageY - 10 + "px");
        })
        .on("mousemove", function (event: MouseEvent) {
            tooltip
                .style("left", event.pageX + 15 + "px")
                .style("top", event.pageY - 10 + "px");
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });
}

// ============================================================================
// Centroid Rendering - 2D
// ============================================================================

function renderCentroids2D(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    centroids: number[][],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    options: {
        colorScale: d3.ScaleOrdinal<string, string>;
        centroidSize: number;
        clusterNames: string[];
        opacity?: number;
        tooltipSuffix?: string;
    },
) {
    const {
        colorScale,
        centroidSize,
        clusterNames,
        opacity = 1,
        tooltipSuffix = "",
    } = options;
    const tooltip = setupCentroidTooltip();

    const centroidGroup = container
        .append("g")
        .attr("class", "kmeans-centroids");

    centroids.forEach((centroid, clusterId) => {
        const cx = xScale(centroid[0]);
        const cy = yScale(centroid[1]);

        if (isNaN(cx) || isNaN(cy)) return;

        const clusterName = clusterNames[clusterId];
        const color = colorScale(clusterName);

        // Outer glow
        centroidGroup
            .append("circle")
            .attr("class", "centroid-glow")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", centroidSize + 4)
            .attr("fill", color)
            .attr("opacity", 0.3 * opacity);

        // Main centroid circle
        const centroidCircle = centroidGroup
            .append("circle")
            .attr("class", "centroid-main")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", centroidSize)
            .attr("fill", color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 3)
            .attr("opacity", opacity);

        // Centroid marker (cross)
        const markerGroup = centroidGroup
            .append("g")
            .attr("class", "centroid-marker");

        const markerSize = centroidSize * 0.6;
        markerGroup
            .append("line")
            .attr("x1", cx - markerSize)
            .attr("y1", cy)
            .attr("x2", cx + markerSize)
            .attr("y2", cy)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("opacity", opacity);

        markerGroup
            .append("line")
            .attr("x1", cx)
            .attr("y1", cy - markerSize)
            .attr("x2", cx)
            .attr("y2", cy + markerSize)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("opacity", opacity);

        // Hover target
        const hoverTarget = centroidGroup
            .append("circle")
            .attr("class", "centroid-hover-target")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", centroidSize + 5)
            .attr("fill", "transparent")
            .style("cursor", "pointer")
            .style("pointer-events", "all");

        // Tooltip
        const tooltipContent = `
            <div class="font-semibold text-gray-900 mb-1">${clusterName}${tooltipSuffix}</div>
            <div class="text-sm text-gray-700">Position: [${centroid.map((v) => v.toFixed(2)).join(", ")}]</div>
        `;

        hoverTarget
            .on("mouseover", function (event: MouseEvent) {
                centroidCircle
                    .attr("stroke-width", 4)
                    .attr("r", centroidSize + 1);
                tooltip.html(tooltipContent);
                tooltip
                    .style("opacity", 0.95)
                    .style("left", event.pageX + 15 + "px")
                    .style("top", event.pageY - 10 + "px");
            })
            .on("mousemove", function (event: MouseEvent) {
                tooltip
                    .style("left", event.pageX + 15 + "px")
                    .style("top", event.pageY - 10 + "px");
            })
            .on("mouseout", function () {
                centroidCircle.attr("stroke-width", 3).attr("r", centroidSize);
                tooltip.style("opacity", 0);
            });
    });
}

// ============================================================================
// Centroid Rendering - 1D
// ============================================================================

function renderCentroids1D(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    centroids: number[][],
    xScale: d3.ScaleLinear<number, number>,
    stripCenter: number,
    options: {
        colorScale: d3.ScaleOrdinal<string, string>;
        centroidSize: number;
        clusterNames: string[];
        opacity?: number;
        tooltipSuffix?: string;
    },
) {
    const {
        colorScale,
        centroidSize,
        clusterNames,
        opacity = 1,
        tooltipSuffix = "",
    } = options;
    const tooltip = setupCentroidTooltip();

    const centroidGroup = container
        .append("g")
        .attr("class", "kmeans-centroids");

    centroids.forEach((centroid, clusterId) => {
        const cx = xScale(centroid[0]);

        if (isNaN(cx)) return;

        const clusterName = clusterNames[clusterId];
        const color = colorScale(clusterName);

        // Outer glow
        centroidGroup
            .append("circle")
            .attr("class", "centroid-glow")
            .attr("cx", cx)
            .attr("cy", stripCenter)
            .attr("r", centroidSize + 4)
            .attr("fill", color)
            .attr("opacity", 0.3 * opacity);

        // Main centroid circle
        const centroidCircle = centroidGroup
            .append("circle")
            .attr("class", "centroid-main")
            .attr("cx", cx)
            .attr("cy", stripCenter)
            .attr("r", centroidSize)
            .attr("fill", color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 3)
            .attr("opacity", opacity);

        // Centroid marker (cross)
        const markerGroup = centroidGroup
            .append("g")
            .attr("class", "centroid-marker");

        const markerSize = centroidSize * 0.6;
        markerGroup
            .append("line")
            .attr("x1", cx - markerSize)
            .attr("y1", stripCenter)
            .attr("x2", cx + markerSize)
            .attr("y2", stripCenter)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("opacity", opacity);

        markerGroup
            .append("line")
            .attr("x1", cx)
            .attr("y1", stripCenter - markerSize)
            .attr("x2", cx)
            .attr("y2", stripCenter + markerSize)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("opacity", opacity);

        // Hover target
        const hoverTarget = centroidGroup
            .append("circle")
            .attr("class", "centroid-hover-target")
            .attr("cx", cx)
            .attr("cy", stripCenter)
            .attr("r", centroidSize + 5)
            .attr("fill", "transparent")
            .style("cursor", "pointer")
            .style("pointer-events", "all");

        // Tooltip
        const tooltipContent = `
            <div class="font-semibold text-gray-900 mb-1">${clusterName}${tooltipSuffix}</div>
            <div class="text-sm text-gray-700">Position: ${centroid[0].toFixed(2)}</div>
        `;

        hoverTarget
            .on("mouseover", function (event: MouseEvent) {
                centroidCircle
                    .attr("stroke-width", 4)
                    .attr("r", centroidSize + 1);
                tooltip.html(tooltipContent);
                tooltip
                    .style("opacity", 0.95)
                    .style("left", event.pageX + 15 + "px")
                    .style("top", event.pageY - 10 + "px");
            })
            .on("mousemove", function (event: MouseEvent) {
                tooltip
                    .style("left", event.pageX + 15 + "px")
                    .style("top", event.pageY - 10 + "px");
            })
            .on("mouseout", function () {
                centroidCircle.attr("stroke-width", 3).attr("r", centroidSize);
                tooltip.style("opacity", 0);
            });
    });
}

// ============================================================================
// Centroid Movement - 2D
// ============================================================================

function renderCentroidMovement2D(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    prevCentroids: number[][],
    currentCentroids: number[][],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    options: {
        colorScale: d3.ScaleOrdinal<string, string>;
        clusterNames: string[];
    },
) {
    const { colorScale, clusterNames } = options;
    const movementGroup = container
        .append("g")
        .attr("class", "centroid-movement");

    prevCentroids.forEach((prevCentroid, clusterId) => {
        const currentCentroid = currentCentroids[clusterId];
        if (!currentCentroid) return;

        const x1 = xScale(prevCentroid[0]);
        const y1 = yScale(prevCentroid[1]);
        const x2 = xScale(currentCentroid[0]);
        const y2 = yScale(currentCentroid[1]);

        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) return;

        const clusterName = clusterNames[clusterId];
        const color = colorScale(clusterName);

        // Draw arrow from prev to current
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 1) return; // Skip if centroids didn't move

        const arrowSize = 8;

        // Arrow line
        movementGroup
            .append("line")
            .attr("class", "movement-line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,3")
            .attr("opacity", 0.6)
            .attr("marker-end", "url(#arrow-" + clusterId + ")");

        // Arrow marker
        const defs = container.select("defs").empty()
            ? container.append("defs")
            : container.select("defs");

        defs.append("marker")
            .attr("id", "arrow-" + clusterId)
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 8)
            .attr("refY", 5)
            .attr("markerWidth", arrowSize)
            .attr("markerHeight", arrowSize)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", color)
            .attr("opacity", 0.8);
    });
}

// ============================================================================
// Centroid Movement - 1D
// ============================================================================

function renderCentroidMovement1D(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    prevCentroids: number[][],
    currentCentroids: number[][],
    xScale: d3.ScaleLinear<number, number>,
    stripCenter: number,
    options: {
        colorScale: d3.ScaleOrdinal<string, string>;
        clusterNames: string[];
    },
) {
    const { colorScale, clusterNames } = options;
    const movementGroup = container
        .append("g")
        .attr("class", "centroid-movement");

    prevCentroids.forEach((prevCentroid, clusterId) => {
        const currentCentroid = currentCentroids[clusterId];
        if (!currentCentroid) return;

        const x1 = xScale(prevCentroid[0]);
        const x2 = xScale(currentCentroid[0]);

        if (isNaN(x1) || isNaN(x2)) return;

        const clusterName = clusterNames[clusterId];
        const color = colorScale(clusterName);

        const distance = Math.abs(x2 - x1);
        if (distance < 1) return; // Skip if centroids didn't move

        const arrowSize = 8;

        // Arrow line
        movementGroup
            .append("line")
            .attr("class", "movement-line")
            .attr("x1", x1)
            .attr("y1", stripCenter)
            .attr("x2", x2)
            .attr("y2", stripCenter)
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,3")
            .attr("opacity", 0.6)
            .attr("marker-end", "url(#arrow-1d-" + clusterId + ")");

        // Arrow marker
        const defs = container.select("defs").empty()
            ? container.append("defs")
            : container.select("defs");

        defs.append("marker")
            .attr("id", "arrow-1d-" + clusterId)
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 8)
            .attr("refY", 5)
            .attr("markerWidth", arrowSize)
            .attr("markerHeight", arrowSize)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", color)
            .attr("opacity", 0.8);
    });
}

// ============================================================================
// Tooltip Setup
// ============================================================================

function setupCentroidTooltip(): d3.Selection<
    HTMLDivElement,
    unknown,
    HTMLElement,
    unknown
> {
    let tooltip = d3
        .select("body")
        .select<HTMLDivElement>(".kmeans-centroid-tooltip");

    if (tooltip.empty()) {
        tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "kmeans-centroid-tooltip")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("border", "1px solid #ddd")
            .style("border-radius", "4px")
            .style("padding", "8px 12px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("z-index", "1000")
            .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");
    }

    return tooltip;
}
