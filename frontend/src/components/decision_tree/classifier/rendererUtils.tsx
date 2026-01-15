import {
    prepareHistogramData,
    renderHistogramBars,
} from "@/components/charts/histogramUtils";
import type { ClassDistribution } from "@/components/decision_tree/classifier/types";
import { applyFont } from "@/components/visualisation/config/fonts";
import type { HistogramData } from "@/types/model";
import * as d3 from "d3";

export interface TransformedNode {
    name: string;
    type: "leaf" | "split";
    samples: number;
    impurity: number;
    feature?: string;
    threshold?: number;
    value?: number[][];
    histogram_data?: HistogramData | null;
    depth: number;
    children: TransformedNode[];
    isOnPath?: boolean;
    isCurrentNode?: boolean;
    terminal?: boolean; // Flag to mark a leaf as terminal (not splittable)
}

export const getClassDistribution = (
    d: d3.HierarchyNode<TransformedNode>,
    classNames?: string[]
): ClassDistribution[] => {
    if (!d.data.value || !d.data.value[0]) {
        return [];
    }

    const values = d.data.value[0];
    const total = values.reduce((sum: number, val: number) => sum + val, 0);

    const result = values
        .map((count: number, index: number) => ({
            class: classNames?.[index] || `Class ${index}`,
            count: count * d.data.samples, // Raw sample count
            value: total > 0 ? count / total : 0, // Proportion (0-1) for width calculations
            percentage: total > 0 ? (count / total) * 100 : 0, // Actual percentage for display
        }))
        .filter((item: ClassDistribution) => item.count > 0) // Only show classes that exist
        .sort(
            (a: ClassDistribution, b: ClassDistribution) => b.count - a.count
        ); // Sort by count descending

    return result;
};

export const renderIntegratedSplitNode = (
    nodeGroup: d3.Selection<
        SVGGElement,
        d3.HierarchyNode<TransformedNode>,
        null,
        undefined
    >,
    d: d3.HierarchyNode<TransformedNode>,
    distribution: ClassDistribution[],
    totalWidth: number,
    colorScale?: d3.ScaleOrdinal<string, string>,
    interpolationFactor?: number
) => {
    const histogramHeight = 40;
    const textHeight = 30;
    const barHeight = 8;
    const totalHeight = histogramHeight + textHeight + barHeight;

    nodeGroup
        .append("rect")
        .attr("width", totalWidth + 15)
        .attr("height", totalHeight + 10)
        .attr("x", -totalWidth / 2 - 6)
        .attr("y", -totalHeight / 2)
        .attr("rx", 6)
        .attr("fill", "#ecececff")
        .attr("fill-opacity", d.data.isOnPath ? interpolationFactor || 0 : 0)
        .attr("stroke", d.data.isOnPath ? "#333" : "none")
        .attr(
            "stroke-width",
            d.data.isOnPath ? (interpolationFactor || 0) * 2 : 0
        );

    if (d.data.histogram_data) {
        renderHistogramComponent(
            nodeGroup,
            d.data.histogram_data,
            totalWidth - 10,
            histogramHeight - 5,
            -totalWidth / 2 + 5,
            -totalHeight / 2 + 5,
            colorScale
        );
    }

    nodeGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", -totalHeight / 2 + histogramHeight + 20)
        .call(applyFont.family)
        .call(applyFont.size.medium)
        .call(applyFont.weight.bold)
        .attr("fill", "#374151")
        .text(d.data.feature || d.data.name);

    renderDistributionBar(
        nodeGroup,
        distribution,
        totalWidth - 10,
        barHeight,
        -totalHeight / 2 + histogramHeight + textHeight,
        colorScale
    );
};

export const renderLeafNode = (
    nodeGroup: d3.Selection<
        SVGGElement,
        d3.HierarchyNode<TransformedNode>,
        null,
        undefined
    >,
    d: d3.HierarchyNode<TransformedNode>,
    distribution: ClassDistribution[],
    totalWidth: number,
    colorScale?: d3.ScaleOrdinal<string, string>,
    interpolationFactor?: number
) => {
    const leafHeight = 40;

    console.log('[renderLeafNode] Called with distribution:', distribution, 'totalWidth:', totalWidth);
    console.log('[renderLeafNode] Node data:', d.data);

    if (distribution.length === 0) return;

    if (distribution.length === 1) {
        const classInfo = distribution[0];

        // Add animated background highlight for path nodes
        if (d.data.isOnPath && interpolationFactor && interpolationFactor > 0) {
            nodeGroup
                .append("rect")
                .attr("width", totalWidth + 8)
                .attr("height", leafHeight + 8)
                .attr("x", -totalWidth / 2 - 4)
                .attr("y", -leafHeight / 2 - 4)
                .attr("rx", 8)
                .attr("fill", "#333")
                .attr("fill-opacity", interpolationFactor * 0.3)
                .attr("stroke", "#333")
                .attr("stroke-width", interpolationFactor * 2);
        }

        nodeGroup
            .append("rect")
            .attr("width", totalWidth)
            .attr("height", leafHeight)
            .attr("x", -totalWidth / 2)
            .attr("y", -leafHeight / 2)
            .attr("rx", 6)
            .attr("fill", colorScale ? colorScale(classInfo.class) : "#3b82f6");

        nodeGroup
            .append("text")
            .attr("y", -3)
            .attr("text-anchor", "middle")
            .call(applyFont.family)
            .call(applyFont.size.medium)
            .call(applyFont.weight.bold)
            .attr("fill", "#eeeeee")
            .text(classInfo.class.substring(0, 3));

        nodeGroup
            .append("text")
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .call(applyFont.family)
            .call(applyFont.size.small)
            .attr("fill", "white")
            .text(`n=${classInfo.count}`);
    } else {
        // Add animated background highlight for multi-class path leaf nodes
        if (d.data.isOnPath && interpolationFactor && interpolationFactor > 0) {
            nodeGroup
                .append("rect")
                .attr("width", totalWidth + 8)
                .attr("height", leafHeight + 8)
                .attr("x", -totalWidth / 2 - 4)
                .attr("y", -leafHeight / 2 - 4)
                .attr("rx", 8)
                .attr("fill", "#333")
                .attr("fill-opacity", interpolationFactor * 0.3)
                .attr("stroke", "#333")
                .attr("stroke-width", interpolationFactor * 2);
        }

        let currentX = -totalWidth / 2;

        distribution.forEach((classInfo: ClassDistribution, index: number) => {
            const proportionalWidth = Math.max(
                10,
                classInfo.value * totalWidth
            );

            nodeGroup
                .append("path")
                .attr("d", function (_d) {
                    const width = proportionalWidth;
                    const height = leafHeight;
                    const x = currentX;
                    const y = -leafHeight / 2;
                    const cornerRadius = 5;

                    if (index === 0) {
                        return `M${x + cornerRadius},${y} 
                                L${x + width},${y} 
                                L${x + width},${y + height} 
                                L${x + cornerRadius},${y + height} 
                                A${cornerRadius},${cornerRadius} 0 0,1 ${x},${
                            y + height - cornerRadius
                        } 
                                L${x},${y + cornerRadius} 
                                A${cornerRadius},${cornerRadius} 0 0,1 ${
                            x + cornerRadius
                        },${y} Z`;
                    } else if (index === distribution.length - 1) {
                        return `M${x},${y} 
                                L${x + width - cornerRadius},${y} 
                                A${cornerRadius},${cornerRadius} 0 0,1 ${
                            x + width
                        },${y + cornerRadius} 
                                L${x + width},${y + height - cornerRadius} 
                                A${cornerRadius},${cornerRadius} 0 0,1 ${
                            x + width - cornerRadius
                        },${y + height} 
                                L${x},${y + height} Z`;
                    } else {
                        return `M${x},${y} 
                        L${x + width},${y} 
                        L${x + width},${y + height} 
                        L${x},${y + height} Z`;
                    }
                })
                .attr(
                    "fill",
                    colorScale
                        ? colorScale(classInfo.class)
                        : `hsl(${(index * 137.5) % 360}, 50%, 50%)`
                );

            if (proportionalWidth > 20) {
                nodeGroup
                    .append("text")
                    .attr("x", currentX + proportionalWidth / 2)
                    .attr("y", -3)
                    .attr("text-anchor", "middle")
                    .call(applyFont.family)
                    .call(applyFont.size.medium)
                    .call(applyFont.weight.bold)
                    .attr("fill", "white")
                    .text(classInfo.class.substring(0, 3));
                nodeGroup
                    .append("text")
                    .attr("x", currentX + proportionalWidth / 2)
                    .attr("y", 10)
                    .attr("text-anchor", "middle")
                    .call(applyFont.family)
                    .call(applyFont.size.small)
                    .attr("fill", "white")
                    .text(`n=${classInfo.count}`);
            }

            currentX += proportionalWidth;
        });
    }
};

const renderHistogramComponent = (
    nodeGroup: d3.Selection<SVGGElement, any, null, undefined>,
    histogramData: HistogramData,
    width: number,
    height: number,
    xOffset: number,
    yOffset: number,
    colorScale?: d3.ScaleOrdinal<string, string>
) => {
    if (!histogramData.bins || histogramData.bins.length < 2) return;

    const histogramGroup = nodeGroup
        .append("g")
        .attr("class", "histogram-group")
        .attr("transform", `translate(${xOffset}, ${yOffset})`);

    const stackedData = prepareHistogramData(histogramData);

    const colorScheme = colorScale
        ? Object.keys(histogramData.counts_by_class).map((cls) =>
              colorScale(cls)
          )
        : undefined;

    renderHistogramBars(histogramGroup, histogramData, stackedData, {
        width,
        height,
        colorScheme,
        showThreshold: true,
        showAxes: false, // No axes in the compact node version
        showLegend: false, // No legend in the compact node version
    });
};

const renderDistributionBar = (
    nodeGroup: d3.Selection<SVGGElement, any, null, undefined>,
    distribution: ClassDistribution[],
    width: number,
    height: number,
    yOffset: number,
    colorScale?: d3.ScaleOrdinal<string, string>
) => {
    let currentX = -width / 2;

    distribution.forEach((classInfo, index) => {
        const segmentWidth = Math.max(1, classInfo.value * width);

        if (segmentWidth > 0) {
            nodeGroup
                .append("path")
                .attr("x", currentX)
                .attr("y", yOffset)
                .attr("width", segmentWidth)
                .attr("height", height)
                .attr("d", function (_d) {
                    const cornerRadius = 4;
                    const x = currentX;
                    const y = yOffset;

                    if (index === 0) {
                        return `M${x + cornerRadius},${y} 
                        L${x + segmentWidth},${y} 
                        L${x + segmentWidth},${y + height} 
                        L${x + cornerRadius},${y + height} 
                        A${cornerRadius},${cornerRadius} 0 0,1 ${x},${
                            y + height - cornerRadius
                        } 
                        L${x},${y + cornerRadius} 
                        A${cornerRadius},${cornerRadius} 0 0,1 ${
                            x + cornerRadius
                        },${y} Z`;
                    } else if (index === distribution.length - 1) {
                        return `M${x},${y} 
                        L${x + segmentWidth - cornerRadius},${y} 
                        A${cornerRadius},${cornerRadius} 0 0,1 ${
                            x + segmentWidth
                        },${y + cornerRadius} 
                        L${x + segmentWidth},${y + height - cornerRadius} 
                        A${cornerRadius},${cornerRadius} 0 0,1 ${
                            x + segmentWidth - cornerRadius
                        },${y + height} 
                        L${x},${y + height} Z`;
                    } else {
                        return `M${x},${y} 
                        L${x + segmentWidth},${y} 
                        L${x + segmentWidth},${y + height} 
                        L${x},${y + height} Z`;
                    }
                })
                .attr(
                    "fill",
                    colorScale
                        ? colorScale(classInfo.class)
                        : `hsl(${(index * 137.5) % 360}, 50%, 50%)`
                )
                .attr("opacity", 0.7);

            currentX += segmentWidth;
        }
    });
};

export const getDefaultTooltipContent = (
    d: d3.HierarchyNode<TransformedNode>
): string => {
    let content = `<div class="font-semibold text-base mb-2">${
        d.data.type === "leaf" ? "Leaf Node" : "Decision Node"
    }</div>`;
    content += `<div class="text-sm">Samples: ${d.data.samples}</div>`;
    content += `<div class="text-sm">Impurity: ${d.data.impurity.toFixed(
        4
    )}</div>`;

    if (d.data.type === "split") {
        content += `<div class="text-sm">Feature: ${d.data.feature}</div>`;
        content += `<div class="text-sm">Threshold: ${d.data.threshold?.toFixed(
            3
        )}</div>`;
    }

    return content;
};

export const setupTooltip = (): d3.Selection<
    HTMLDivElement,
    unknown,
    HTMLElement,
    any
> => {
    const tooltipId = "decision-tree-tooltip";
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
};

export const addNodeInteractions = (
    node: d3.Selection<
        d3.BaseType,
        d3.HierarchyNode<TransformedNode>,
        SVGGElement,
        unknown
    >,
    tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
    getTooltipContent?: (d: any) => string
) => {
    node.style("cursor", "pointer")
        .on(
            "mouseover",
            function (event, d: d3.HierarchyNode<TransformedNode>) {
                const tooltipContent = getTooltipContent
                    ? getTooltipContent(d)
                    : getDefaultTooltipContent(d);

                tooltip.html(tooltipContent);

                tooltip
                    .style("background-color", "white")
                    .style("color", "black")
                    .style("opacity", 0.8)
                    .style("left", event.pageX + 15 + "px")
                    .style("top", event.pageY - 10 + "px");
            }
        )
        .on("mousemove", function (event) {
            tooltip
                .style("left", event.pageX + 15 + "px")
                .style("top", event.pageY - 10 + "px");
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        })
        .on("mouseleave", function () {
            tooltip.style("opacity", 0);
        });
};

// Manual tree building rendering functions

export const renderExpandableLeafNode = (
    nodeGroup: d3.Selection<SVGGElement, any, null, undefined>,
    d: any,
    distribution: ClassDistribution[],
    nodeWidth: number,
    colorScale: d3.ScaleOrdinal<string, string, never>,
    isSelected: boolean
): void => {
    const nodeHeight = 40;
    
    // Check if this is a terminal leaf (marked as not splittable)
    const isTerminal = d.data?.terminal === true;
    console.log('[renderExpandableLeafNode] Node:', d.data, 'isTerminal:', isTerminal);
    
    // If terminal, render as a regular leaf node without + icon
    if (isTerminal) {
        console.log('[renderExpandableLeafNode] Rendering as terminal leaf');
        console.log(distribution, nodeWidth)
        renderLeafNode(nodeGroup, 
            d, 
            distribution, 
            nodeWidth, 
            colorScale);
        return;
    }
    
    // Background with selection highlight
    nodeGroup
        .append("rect")
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr("x", -nodeWidth / 2)
        .attr("y", -nodeHeight / 2)
        .attr("rx", 6)
        .attr("fill", isSelected ? "#e0e7ff" : "#f3f4f6")
        .attr("stroke", isSelected ? "#4f46e5" : "#d1d5db")
        .attr("stroke-width", isSelected ? 2 : 1);
    
    // Display class distribution
    const barGroup = nodeGroup.append("g");
    const barWidth = nodeWidth - 20;
    const barHeight = 8;
    const barX = -barWidth / 2;
    const barY = -nodeHeight / 4;
    
    let xOffset = 0;
    const totalSamples = d.data.samples;
    distribution.forEach((classDistribution, i) => {
        const segmentWidth = (classDistribution.count / totalSamples) * barWidth;
        barGroup
            .append("rect")
            .attr("x", barX + xOffset)
            .attr("y", barY)
            .attr("width", segmentWidth)
            .attr("height", barHeight)
            .attr("fill", colorScale(i.toString()))
            .attr("rx", 2);
        xOffset += segmentWidth;
    });
    
    // Show "+" icon or "Selected" text
    if (isSelected) {
        nodeGroup
            .append("text")
            .attr("y", nodeHeight / 4 + 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#4f46e5")
            .attr("font-weight", "bold")
            .text("Selected");
    } else {
        nodeGroup
            .append("text")
            .attr("y", nodeHeight / 2 - 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#6b7280")
            .text(`n=${d.data.samples}`);
    }
    
};

/**
 * Render information gain line graph that progressively reveals as threshold changes
 */
const renderInformationGainGraph = (
    svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    thresholds: Array<{ threshold: number; information_gain: number }>,
    currentThreshold: number,
    featureRange: [number, number],
    width: number,
    height: number
): {
    updateGraph: (newThreshold: number) => void;
} => {
    const margin = { top: 10, right: 10, bottom: 25, left: 45 };
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;
    
    // Create main group with margins
    const g = svgGroup
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Set up scales
    const xScale = d3.scaleLinear()
        .domain(featureRange)
        .range([0, graphWidth]);
    
    const maxGain = d3.max(thresholds, d => d.information_gain) || 1;
    const yScale = d3.scaleLinear()
        .domain([0, maxGain * 1.1]) // Add 10% padding
        .range([graphHeight, 0]);
    
    // Add background
    g.append('rect')
        .attr('width', graphWidth)
        .attr('height', graphHeight)
        .attr('fill', '#f9fafb')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1);
    
    // Add grid lines
    const yTicks = yScale.ticks(4);
    g.selectAll('.grid-line')
        .data(yTicks)
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', 0)
        .attr('x2', graphWidth)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', '#e5e7eb')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');
    
    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(4);
    
    g.append('g')
        .attr('transform', `translate(0, ${graphHeight})`)
        .call(xAxis)
        .style('font-size', '10px')
        .style('color', '#6b7280');
    
    g.append('g')
        .call(yAxis)
        .style('font-size', '10px')
        .style('color', '#6b7280');
    
    // Add axis labels
    g.append('text')
        .attr('x', graphWidth / 2)
        .attr('y', graphHeight + 22)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#6b7280')
        .text('Threshold');
    
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -graphHeight / 2)
        .attr('y', -35)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#6b7280')
        .text('Information Gain');
    
    // Create line generator
    const lineGenerator = d3.line<{ threshold: number; information_gain: number }>()
        .x(d => xScale(d.threshold))
        .y(d => yScale(d.information_gain))
        .curve(d3.curveMonotoneX); // Smooth curve
    
    // Track explored thresholds (indices into the thresholds array)
    const exploredIndices = new Set<number>();
    
    // Find the index of the threshold closest to a given value
    const findClosestThresholdIndex = (targetThreshold: number): number => {
        return thresholds.reduce((closestIdx, curr, idx) => {
            const currentDist = Math.abs(curr.threshold - targetThreshold);
            const closestDist = Math.abs(thresholds[closestIdx].threshold - targetThreshold);
            return currentDist < closestDist ? idx : closestIdx;
        }, 0);
    };
    
    // Get all explored points (sorted by threshold value for line drawing)
    const getExploredPoints = () => {
        const indices = Array.from(exploredIndices).sort((a, b) => 
            thresholds[a].threshold - thresholds[b].threshold
        );
        return indices.map(idx => thresholds[idx]);
    };
    
    // Find best threshold among explored points
    const getBestExploredThreshold = () => {
        if (exploredIndices.size === 0) return null;
        let bestIdx = Array.from(exploredIndices)[0];
        for (const idx of exploredIndices) {
            if (thresholds[idx].information_gain > thresholds[bestIdx].information_gain) {
                bestIdx = idx;
            }
        }
        return thresholds[bestIdx];
    };
    
    // Add best threshold marker (vertical dashed line) - will be updated dynamically
    const bestThresholdLine = g.append('line')
        .attr('y1', 0)
        .attr('y2', graphHeight)
        .attr('stroke', '#10b981')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0);
    
    // Add best threshold label
    const bestThresholdLabel = g.append('text')
        .attr('y', -3)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('fill', '#10b981')
        .attr('font-weight', 'bold')
        .text('Best')
        .attr('opacity', 0);
    
    // Add the line path (will be updated)
    const linePath = g.append('path')
        .attr('class', 'info-gain-line')
        .attr('fill', 'none')
        .attr('stroke', '#4f46e5')
        .attr('stroke-width', 2.5);
    
    // Add explored points as dots
    const exploredDotsGroup = g.append('g').attr('class', 'explored-dots');
    
    // Add current threshold indicator (vertical line)
    const currentLine = g.append('line')
        .attr('class', 'current-threshold-line')
        .attr('y1', 0)
        .attr('y2', graphHeight)
        .attr('stroke', '#4f46e5')
        .attr('stroke-width', 2)
        .attr('opacity', 0.5);
    
    // Add current point indicator (circle)
    const currentPoint = g.append('circle')
        .attr('class', 'current-point')
        .attr('r', 5)
        .attr('fill', '#4f46e5')
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    
    // Add current IG value label
    const currentLabel = g.append('text')
        .attr('class', 'current-label')
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#4f46e5');
    
    // Update function
    const updateGraph = (newThreshold: number) => {
        // Mark current threshold as explored
        const currentIdx = findClosestThresholdIndex(newThreshold);
        exploredIndices.add(currentIdx);
        
        const exploredPoints = getExploredPoints();
        const currentData = thresholds[currentIdx];
        
        // Update line path with all explored points
        if (exploredPoints.length > 0) {
            linePath
                .datum(exploredPoints)
                .attr('d', lineGenerator);
        }
        
        // Update explored dots
        exploredDotsGroup
            .selectAll('circle')
            .data(exploredPoints)
            .join('circle')
            .attr('cx', d => xScale(d.threshold))
            .attr('cy', d => yScale(d.information_gain))
            .attr('r', 2.5)
            .attr('fill', '#4f46e5')
            .attr('opacity', 0.6);
        
        // Update current threshold line
        currentLine
            .attr('x1', xScale(newThreshold))
            .attr('x2', xScale(newThreshold));
        
        // Update current point
        currentPoint
            .attr('cx', xScale(currentData.threshold))
            .attr('cy', yScale(currentData.information_gain));
        
        // Update current label
        const labelY = yScale(currentData.information_gain) - 10;
        currentLabel
            .attr('x', xScale(currentData.threshold))
            .attr('y', labelY < 10 ? yScale(currentData.information_gain) + 20 : labelY)
            .text(currentData.information_gain.toFixed(4));
        
        // Update best threshold marker based on explored points
        const bestExplored = getBestExploredThreshold();
        if (bestExplored) {
            const bestX = xScale(bestExplored.threshold);
            bestThresholdLine
                .attr('x1', bestX)
                .attr('x2', bestX)
                .attr('opacity', 0.6);
            bestThresholdLabel
                .attr('x', bestX)
                .attr('opacity', 1);
        }
    };
    
    // Initial render
    updateGraph(currentThreshold);
    
    return { updateGraph };
};

export const renderInlineEditor = (
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    selectedNode: any,
    featureNames: string[],
    featureStats: any | null,
    selectedFeature: string | null,
    selectedThreshold: number | null,
    colorScale: d3.ScaleOrdinal<string, string>,
    callbacks: {
        onFeatureSelect?: (feature: string) => void;
        onThresholdChange?: (threshold: number) => void;
        onSplit?: () => void;
        onCancel?: () => void;
        onMarkAsLeaf?: () => void;
    }
): void => {
    const editorWidth = 400;
    const editorX = selectedNode.x;
    const editorY = selectedNode.y + 60;
    
    // Create foreignObject for HTML content
    const foreign = container
        .append('foreignObject')
        .attr('x', editorX - editorWidth / 2)
        .attr('y', editorY)
        .attr('width', editorWidth)
        .attr('height', 600)
        .attr('class', 'inline-editor');
    
    const div = foreign
        .append('xhtml:div')
        .style('background', 'white')
        .style('border', '2px solid #4f46e5')
        .style('border-radius', '8px')
        .style('padding', '16px')
        .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)');
    
    // Title
    div
        .append('div')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('margin-bottom', '12px')
        .style('color', '#1f2937')
        .text('Split Node');
    
    // Feature dropdown
    const select = div
        .append('select')
        .style('width', '100%')
        .style('padding', '8px 12px')
        .style('border', '1px solid #d1d5db')
        .style('border-radius', '4px')
        .style('margin-bottom', '12px')
        .style('font-size', '14px')
        .on('change', function() {
            const value = (this as HTMLSelectElement).value;
            callbacks.onFeatureSelect?.(value);
        });
    
    select.append('option').attr('value', '').text('Select feature...');
    select.selectAll('option.feature')
        .data(featureNames)
        .enter()
        .append('option')
        .attr('class', 'feature')
        .attr('value', d => d)
        .property('selected', d => d === selectedFeature)
        .text(d => d);
    
    // If feature selected, show histogram and slider
    if (featureStats && selectedFeature) {
        // Histogram container
        const histContainer = div
            .append('div')
            .style('margin-bottom', '12px');
        
        const histSvg = histContainer
            .append('svg')
            .attr('width', '100%')
            .attr('height', 100)
            .style('display', 'block');
        
        // Render histogram
        const histGroup = histSvg.append('g');
        const stackedData = prepareHistogramData(featureStats.histogram_data);
        const histWidth = editorWidth - 32;
        
        // Create color scheme from colorScale to match tree nodes
        const colorScheme = Object.keys(featureStats.histogram_data.counts_by_class).map((cls) =>
            colorScale(cls)
        );
        
        renderHistogramBars(histGroup, featureStats.histogram_data, stackedData, {
            width: histWidth,
            height: 100,
            showThreshold: false,
            colorScheme,
        });
        
        // Add threshold line - start at median threshold to encourage exploration
        const medianThreshold = selectedThreshold || featureStats.thresholds[Math.floor(featureStats.thresholds.length / 2)].threshold;
        const currentThreshold = medianThreshold;
        const featureRange = featureStats.feature_range;
        const thresholdX = ((currentThreshold - featureRange[0]) / (featureRange[1] - featureRange[0])) * histWidth;
        
        const thresholdLine = histSvg
            .append('line')
            .attr('x1', thresholdX)
            .attr('x2', thresholdX)
            .attr('y1', 0)
            .attr('y2', 100)
            .attr('stroke', '#4f46e5')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('class', 'threshold-line');
        
        // Add threshold label
        const thresholdLabel = histSvg
            .append('text')
            .attr('x', thresholdX)
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#4f46e5')
            .attr('font-weight', 'bold')
            .text(currentThreshold.toFixed(2));
        
        // Information Gain Graph
        const graphHeight = 100;
        const graphContainer = div
            .append('div')
            .style('margin-bottom', '12px')
            .style('margin-top', '16px');
        
        // Add graph title
        graphContainer
            .append('div')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('color', '#374151')
            .style('margin-bottom', '8px')
            .text('Information Gain by Threshold');
        
        const graphSvg = graphContainer
            .append('svg')
            .attr('width', '100%')
            .attr('height', graphHeight)
            .style('display', 'block');
        
        const graphGroup = graphSvg.append('g');
        
        // Render the information gain line graph
        const { updateGraph } = renderInformationGainGraph(
            graphGroup,
            featureStats.thresholds,
            currentThreshold,
            featureStats.feature_range as [number, number],
            histWidth,
            graphHeight
        );
        
        // Threshold slider
        const sliderContainer = div
            .append('div')
            .style('margin-bottom', '12px');
        
        // Threshold label
        sliderContainer
            .append('label')
            .style('display', 'block')
            .style('font-size', '12px')
            .style('color', '#6b7280')
            .style('margin-bottom', '4px')
            .text('Threshold');
        
        // Create a flex container for slider and value
        const sliderRow = sliderContainer
            .append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '12px');
        
        // Slider input
        sliderRow
            .append('input')
            .attr('type', 'range')
            .attr('min', featureStats.feature_range[0])
            .attr('max', featureStats.feature_range[1])
            .attr('step', (featureStats.feature_range[1] - featureStats.feature_range[0]) / 100)
            .attr('value', medianThreshold)
            .style('flex', '1')
            .style('min-width', '0');
        
        // Threshold value display
        const thresholdValueDisplay = sliderRow
            .append('span')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .style('color', '#1f2937')
            .style('min-width', '60px')
            .style('text-align', 'right')
            .text(medianThreshold.toFixed(3));

        
        // Metrics - find information gain for current threshold
        const initialThreshold = medianThreshold;
        
        // Find the threshold stats for the current threshold value
        let currentInformationGain = 0;
        if (featureStats.thresholds && Array.isArray(featureStats.thresholds)) {
            const closestStats = featureStats.thresholds.reduce((prev: any, curr: any) => {
                return Math.abs(curr.threshold - initialThreshold) < Math.abs(prev.threshold - initialThreshold)
                    ? curr
                    : prev;
            });
            currentInformationGain = closestStats.information_gain;
        }
        
        const metricsDiv = div
            .append('div')
            .style('font-size', '12px')
            .style('color', '#6b7280')
            .style('margin-bottom', '12px')
            .attr('class', 'metrics-display')
            .html(`Information Gain: ${currentInformationGain.toFixed(4)}`);
        
        // Update metrics when threshold changes
        const updateMetrics = (threshold: number) => {
            // Update information gain
            if (featureStats.thresholds && Array.isArray(featureStats.thresholds)) {
                const closestStats = featureStats.thresholds.reduce((prev: any, curr: any) => {
                    return Math.abs(curr.threshold - threshold) < Math.abs(prev.threshold - threshold)
                        ? curr
                        : prev;
                });
                metricsDiv.html(`Information Gain: ${closestStats.information_gain.toFixed(4)}`);
            }
            
            // Update threshold line position
            const newThresholdX = ((threshold - featureRange[0]) / (featureRange[1] - featureRange[0])) * histWidth;
            thresholdLine
                .attr('x1', newThresholdX)
                .attr('x2', newThresholdX);
            thresholdLabel
                .attr('x', newThresholdX)
                .text(threshold.toFixed(2));
            
            // Update threshold value display
            thresholdValueDisplay.text(threshold.toFixed(3));
            
            // Update information gain graph
            updateGraph(threshold);
        };
        
        // Helper function to find nearest valid threshold
        const snapToNearestThreshold = (value: number): number => {
            if (!featureStats.thresholds || !Array.isArray(featureStats.thresholds)) {
                return value;
            }
            
            const closestStats = featureStats.thresholds.reduce((prev: any, curr: any) => {
                return Math.abs(curr.threshold - value) < Math.abs(prev.threshold - value)
                    ? curr
                    : prev;
            });
            
            return closestStats.threshold;
        };
        
        // Update slider to call updateMetrics with snapping
        const sliderInput = sliderContainer.select('input');
        
        sliderInput.on('input', function() {
            // During dragging, show the raw value for smooth visual feedback
            const rawValue = parseFloat((this as HTMLInputElement).value);
            updateMetrics(rawValue);
        });
        
        sliderInput.on('change', function() {
            // On release, snap to nearest valid threshold
            const rawValue = parseFloat((this as HTMLInputElement).value);
            const snappedValue = snapToNearestThreshold(rawValue);
            
            // Update the slider to the snapped value
            (this as HTMLInputElement).value = snappedValue.toString();
            
            // Update visuals and notify parent
            updateMetrics(snappedValue);
            callbacks.onThresholdChange?.(snappedValue);
        });
    }
    
    // Buttons
    const buttonGroup = div
        .append('div')
        .style('display', 'flex')
        .style('gap', '8px');
    
    buttonGroup
        .append('button')
        .style('flex', '1')
        .style('background', '#4f46e5')
        .style('color', 'white')
        .style('padding', '8px 16px')
        .style('border', 'none')
        .style('border-radius', '4px')
        .style('cursor', 'pointer')
        .style('font-size', '14px')
        .style('font-weight', '500')
        .text('Split')
        .on('click', () => callbacks.onSplit?.());
    
    buttonGroup
        .append('button')
        .style('flex', '1')
        .style('background', '#10b981')
        .style('color', 'white')
        .style('padding', '8px 16px')
        .style('border', 'none')
        .style('border-radius', '4px')
        .style('cursor', 'pointer')
        .style('font-size', '14px')
        .style('font-weight', '500')
        .text('Mark as Leaf')
        .on('click', () => callbacks.onMarkAsLeaf?.());
    
    buttonGroup
        .append('button')
        .style('flex', '1')
        .style('background', '#e5e7eb')
        .style('color', '#374151')
        .style('padding', '8px 16px')
        .style('border', 'none')
        .style('border-radius', '4px')
        .style('cursor', 'pointer')
        .style('font-size', '14px')
        .style('font-weight', '500')
        .text('Cancel')
        .on('click', () => callbacks.onCancel?.());
};
