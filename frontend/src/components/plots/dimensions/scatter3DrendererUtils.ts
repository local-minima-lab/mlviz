/**
 * 3D Scatter Plot Renderer
 * Renders 3D scatter plots with orthographic projection and rotation
 */

import type {
    Config,
    DecisionBoundary,
    PlotPoint,
} from "@/components/plots/types";
import {
    createScatterColorScale,
    DEFAULT_MARGIN,
    DEFAULT_POINT_RADIUS,
    makeGetColor,
    type Scatter3DRotation,
    type ScatterRenderOptions,
} from "@/components/plots/utils/scatterRenderHelpers";
import { createColorScale } from "@/utils/colorUtils";
import * as d3 from "d3";

// ============================================================================
// Types
// ============================================================================

interface Point3D {
    x: number;
    y: number;
    z: number;
}

type ProjectedPoint = PlotPoint & {
    projected: Point3D;
    depth: number;
};

// ============================================================================
// Main 3D Render Function
// ============================================================================

export function renderScatter3D(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    plotPoints: PlotPoint[],
    bounds: { min: number[]; max: number[] },
    featureNames: string[],
    config: Config,
    decisionBoundary: DecisionBoundary | undefined,
    rotation: Scatter3DRotation,
    options: ScatterRenderOptions
) {
    const {
        width,
        height,
        margin = DEFAULT_MARGIN,
        pointRadius = DEFAULT_POINT_RADIUS,
        pointOpacity = 0.7,
        showGrid = true,
        showLegend = true,
        showAxes = true,
        onPointClick,
        onPointHover,
    } = options;

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create 3D projection
    const projection = create3DProjection(
        bounds,
        innerWidth,
        innerHeight,
        rotation.alpha,
        rotation.beta
    );

    // Create color scale
    const colorScale = createScatterColorScale(config);

    // Render decision boundary if provided (3D mesh)
    if (decisionBoundary && decisionBoundary.dimensions === 3) {
        renderDecisionBoundary3D(
            container,
            decisionBoundary,
            projection,
            config
        );
    }

    // Render 3D axes
    if (showAxes) {
        renderAxes3D(container, projection, featureNames, bounds);
    }

    // Render grid (3D plane)
    if (showGrid) {
        renderGrid3D(container, projection, bounds);
    }

    // Project and sort points by depth (painter's algorithm)
    const projectedPoints: ProjectedPoint[] = plotPoints.map((point) => {
        const proj = projection(
            point.coordinates[0],
            point.coordinates[1],
            point.coordinates[2]
        );
        return {
            ...point,
            projected: proj,
            depth: proj.z,
        };
    });

    // Sort by depth (back to front)
    projectedPoints.sort((a, b) => a.depth - b.depth);

    // Render data points
    renderDataPoints3D(
        container,
        projectedPoints,
        colorScale,
        pointRadius,
        pointOpacity,
        onPointClick,
        onPointHover
    );

    // Render legend
    if (showLegend) {
        renderLegend3D(container, config, innerWidth);
    }

    return { projection, colorScale };
}

// ============================================================================
// Helper Functions
// ============================================================================

function create3DProjection(
    bounds: { min: number[]; max: number[] },
    width: number,
    height: number,
    alpha: number,
    beta: number
) {
    // Normalize coordinates to [-1, 1]
    const xRange = bounds.max[0] - bounds.min[0];
    const yRange = bounds.max[1] - bounds.min[1];
    const zRange = bounds.max[2] - bounds.min[2];

    return (x: number, y: number, z: number) => {
        // Normalize to [-1, 1]
        const nx = ((x - bounds.min[0]) / xRange) * 2 - 1;
        const ny = ((y - bounds.min[1]) / yRange) * 2 - 1;
        const nz = ((z - bounds.min[2]) / zRange) * 2 - 1;

        // Rotation matrices
        const cosAlpha = Math.cos(alpha * Math.PI);
        const sinAlpha = Math.sin(alpha * Math.PI);
        const cosBeta = Math.cos(beta * Math.PI);
        const sinBeta = Math.sin(beta * Math.PI);

        // Rotate around Y axis (alpha)
        const x1 = nx * cosAlpha + nz * sinAlpha;
        const z1 = -nx * sinAlpha + nz * cosAlpha;

        // Rotate around X axis (beta)
        const y2 = ny * cosBeta - z1 * sinBeta;
        const z2 = ny * sinBeta + z1 * cosBeta;

        // Orthographic projection
        const scale = Math.min(width, height) * 0.35;
        return {
            x: width / 2 + x1 * scale,
            y: height / 2 - y2 * scale,
            z: z2, // Depth for sorting
        };
    };
}

function renderDecisionBoundary3D(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    boundary: DecisionBoundary,
    projection: (x: number, y: number, z: number) => Point3D,
    config: Config
) {
    // For 3D decision boundaries, we'd render a mesh surface
    // This is a simplified version - full implementation would use
    // triangulation and proper depth sorting
    const boundaryGroup = g
        .append("g")
        .attr("class", "decision-boundary-3d")
        .attr("opacity", 0.2);

    function renderPoints<Prediction extends string | number>(
        predictions: Prediction[],
        getColor: (p: Prediction) => string
    ) {
        boundary.meshPoints.forEach((point: number[], i: number) => {
            const proj = projection(point[0], point[1], point[2]);
            boundaryGroup
                .append("circle")
                .attr("cx", proj.x)
                .attr("cy", proj.y)
                .attr("r", 2)
                .attr("fill", getColor(predictions[i]));
        });
    }

    if (config.type === "classification") {
        renderPoints(boundary.predictions as string[], makeGetColor(config));
    } else {
        renderPoints(boundary.predictions as number[], makeGetColor(config));
    }
}

function renderAxes3D(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    projection: (x: number, y: number, z: number) => Point3D,
    featureNames: string[],
    bounds: { min: number[]; max: number[] }
) {
    const axesGroup = g.append("g").attr("class", "axes-3d");

    const origin = projection(bounds.min[0], bounds.min[1], bounds.min[2]);

    // X-axis
    const xEnd = projection(bounds.max[0], bounds.min[1], bounds.min[2]);
    axesGroup
        .append("line")
        .attr("x1", origin.x)
        .attr("y1", origin.y)
        .attr("x2", xEnd.x)
        .attr("y2", xEnd.y)
        .attr("stroke", "#e74c3c")
        .attr("stroke-width", 2);

    axesGroup
        .append("text")
        .attr("x", xEnd.x + 10)
        .attr("y", xEnd.y)
        .attr("fill", "#e74c3c")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(featureNames[0] || "X");

    // Y-axis
    const yEnd = projection(bounds.min[0], bounds.max[1], bounds.min[2]);
    axesGroup
        .append("line")
        .attr("x1", origin.x)
        .attr("y1", origin.y)
        .attr("x2", yEnd.x)
        .attr("y2", yEnd.y)
        .attr("stroke", "#2ecc71")
        .attr("stroke-width", 2);

    axesGroup
        .append("text")
        .attr("x", yEnd.x)
        .attr("y", yEnd.y - 10)
        .attr("fill", "#2ecc71")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(featureNames[1] || "Y");

    // Z-axis
    const zEnd = projection(bounds.min[0], bounds.min[1], bounds.max[2]);
    axesGroup
        .append("line")
        .attr("x1", origin.x)
        .attr("y1", origin.y)
        .attr("x2", zEnd.x)
        .attr("y2", zEnd.y)
        .attr("stroke", "#3498db")
        .attr("stroke-width", 2);

    axesGroup
        .append("text")
        .attr("x", zEnd.x + 10)
        .attr("y", zEnd.y)
        .attr("fill", "#3498db")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(featureNames[2] || "Z");
}

function renderGrid3D(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    projection: (x: number, y: number, z: number) => Point3D,
    bounds: { min: number[]; max: number[] }
) {
    const gridGroup = g.append("g").attr("class", "grid-3d");

    const steps = 5;
    const xRange = bounds.max[0] - bounds.min[0];
    const yRange = bounds.max[1] - bounds.min[1];

    // Draw grid on XY plane at Z=min
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;

        // Lines parallel to X
        const y = bounds.min[1] + t * yRange;
        const start = projection(bounds.min[0], y, bounds.min[2]);
        const end = projection(bounds.max[0], y, bounds.min[2]);

        gridGroup
            .append("line")
            .attr("x1", start.x)
            .attr("y1", start.y)
            .attr("x2", end.x)
            .attr("y2", end.y)
            .attr("stroke", "#e5e7eb")
            .attr("stroke-width", 1)
            .attr("opacity", 0.5);

        // Lines parallel to Y
        const x = bounds.min[0] + t * xRange;
        const start2 = projection(x, bounds.min[1], bounds.min[2]);
        const end2 = projection(x, bounds.max[1], bounds.min[2]);

        gridGroup
            .append("line")
            .attr("x1", start2.x)
            .attr("y1", start2.y)
            .attr("x2", end2.x)
            .attr("y2", end2.y)
            .attr("stroke", "#e5e7eb")
            .attr("stroke-width", 1)
            .attr("opacity", 0.5);
    }
}

function renderDataPoints3D(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    projectedPoints: ProjectedPoint[],
    colorScale: (point: PlotPoint) => string,
    radius: number,
    opacity: number,
    onPointClick?: (index: number, point: number[]) => void,
    onPointHover?: (index: number | null) => void
) {
    const pointsGroup = g.append("g").attr("class", "data-points-3d");

    const circles = pointsGroup
        .selectAll("circle")
        .data(projectedPoints)
        .enter()
        .append("circle")
        .attr("cx", (d) => d.projected.x)
        .attr("cy", (d) => d.projected.y)
        .attr("r", radius)
        .attr("fill", (d) => colorScale(d))
        .attr("opacity", opacity)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("cursor", onPointClick ? "pointer" : "default");

    // Add interactions
    if (onPointClick) {
        circles.on("click", (event, d) => {
            event.stopPropagation();
            onPointClick(d.originalIndex, d.coordinates);
        });
    }

    if (onPointHover) {
        circles
            .on("mouseenter", (event, d) => {
                onPointHover(d.originalIndex);
                d3.select(event.currentTarget)
                    .transition()
                    .duration(150)
                    .attr("r", radius * 1.5)
                    .attr("stroke-width", 2.5);
            })
            .on("mouseleave", (event) => {
                onPointHover(null);
                d3.select(event.currentTarget)
                    .transition()
                    .duration(150)
                    .attr("r", radius)
                    .attr("stroke-width", 1.5);
            });
    }

    // Add tooltips
    circles.append("title").text((d) => {
        if (d.type === "classification") {
            return `${d.label}\n(${d.coordinates[0].toFixed(
                2
            )}, ${d.coordinates[1].toFixed(2)}, ${d.coordinates[2].toFixed(
                2
            )})`;
        } else {
            return `Value: ${d.value.toFixed(3)}\n(${d.coordinates[0].toFixed(
                2
            )}, ${d.coordinates[1].toFixed(2)}, ${d.coordinates[2].toFixed(
                2
            )})`;
        }
    });
}

function renderLegend3D(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    config: Config,
    width: number
) {
    const legendGroup = g
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 120}, 10)`);

    if (config.type === "classification") {
        const categoricalScale = createColorScale(
            config.classNames,
            config.colorScheme || "default"
        );

        config.classNames.forEach((className: string, i: number) => {
            const legendRow = legendGroup
                .append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow
                .append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", 5)
                .attr("fill", categoricalScale(className));

            legendRow
                .append("text")
                .attr("x", 10)
                .attr("y", 4)
                .attr("font-size", "11px")
                .attr("fill", "#374151")
                .text(className);
        });
    }
}
