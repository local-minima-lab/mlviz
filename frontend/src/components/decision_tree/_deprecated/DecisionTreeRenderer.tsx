import {
    prepareHistogramData,
    renderHistogramBars,
} from "@/components/charts/histogramUtils";
import type { HistogramData, TreeNode } from "@/types/model";
import * as d3 from "d3";
import type { VisualisationRenderContext } from "../../visualisation/types";

interface TransformedNode {
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
}

// Extended type for nodes with interpolation factor
interface InterpolatedHierarchyNode extends d3.HierarchyNode<TransformedNode> {
    interpolationFactor?: number;
}

interface ClassDistribution {
    class: string;
    count: number;
    value: number;
    percentage: number;
}

export interface DecisionTreeRenderProps {
    transformTreeData: (
        node: TreeNode,
        depth?: number,
        animationDepth?: number
    ) => TransformedNode;
    getTooltipContent?: (d: any) => string;
    pathLineColor?: string;
    pathFillColor?: string;
    onPathColor?: string;
    colorScale?: d3.ScaleOrdinal<string, string>;
}

export const renderDecisionTree = (
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: any,
    context: VisualisationRenderContext,
    props: DecisionTreeRenderProps
) => {
    const {
        transformTreeData,
        getTooltipContent,
        pathLineColor = "#cbcbcbff",
        onPathColor = "#1b1b1bff",
        colorScale: externalColorScale,
    } = props;

    const { state, dimensions } = context;

    const { currentStep = 0 } = state;
    const { width, height, margin } = dimensions;

    // Create color scale using actual class names from data
    const colorScale =
        externalColorScale ||
        d3
            .scaleOrdinal<string>()
            .domain(data.classes || [])
            .range(d3.schemeDark2.slice(0, (data.classes || []).length));

    const root = d3.hierarchy(transformTreeData(data.tree, 0, currentStep));

    const contentWidth = width - margin.left - margin.right;
    const contentHeight = height - margin.top - margin.bottom;

    // Set up tree layout with increased spacing
    const treeLayout = d3
        .tree<TransformedNode>()
        .size([contentWidth * 1.2, contentHeight * 1.5]) // Increase both width and height for more spacing
        .separation((a, b) => (a.parent === b.parent ? 2 : 3)); // Increase separation between sibling and cousin nodes
    treeLayout(root);

    const depthSpacing = 200; // Fixed spacing between depth levels

    root.descendants().forEach((d) => {
        const nodeHeight = d.data.type === "split" ? 50 : 20;
        d.y = d.depth * depthSpacing + nodeHeight / 2;
    });

    // Create or reuse tooltip (prevent multiple tooltips)
    const tooltipId = "decision-tree-tooltip";
    const existingTooltip = d3.select(`#${tooltipId}`);

    const tooltip = existingTooltip.empty()
        ? d3
              .select("body")
              .append("div")
              .attr("id", tooltipId)
              .attr(
                  "class",
                  "absolute bg-gray-800 text-white p-3 rounded-lg shadow-lg pointer-events-none opacity-0 z-50 max-w-xs"
              )
              .style("transition", "opacity 0.3s")
        : (existingTooltip.style("opacity", 0), existingTooltip);

    const isPredictionMode = root
        .descendants()
        .some((d) => d.data.isOnPath !== undefined);

    let visibleNodes, visibleLinks;

    if (isPredictionMode) {
        visibleNodes = root.descendants();
        visibleLinks = root.links();
    } else {
        // Training mode: show nodes with interpolated visibility
        visibleNodes = root
            .descendants()
            .filter((d) => d.depth < Math.ceil(currentStep));
        visibleLinks = root
            .links()
            .filter((d) => d.target.depth < Math.ceil(currentStep));

        // Calculate interpolation factor for each node
        visibleNodes.forEach((node: InterpolatedHierarchyNode) => {
            const nodeDepth = node.depth;
            const stepFloor = Math.floor(currentStep);
            const stepFraction = currentStep - stepFloor;

            if (nodeDepth === stepFloor) {
                // Node is being animated in
                node.interpolationFactor = stepFraction;
            } else if (nodeDepth < stepFloor) {
                // Node is fully visible
                node.interpolationFactor = 1;
            } else {
                // Node is not yet visible
                node.interpolationFactor = 0;
            }
        });
    }

    // Draw nodes with smooth transitions
    const node = container
        .selectAll(".node")
        .data(visibleNodes)
        .join("g")
        .attr("class", "node")
        .attr(
            "transform",
            (d: d3.HierarchyNode<TransformedNode>) => `translate(${d.x},${d.y})`
        )
        .style("opacity", 1) // Always full opacity
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`) // No scale or position changes
        .style("clip-path", (d: InterpolatedHierarchyNode) => {
            // Apply vertical reveal effect
            if (isPredictionMode) {
                return "none";
            }

            const factor = d.interpolationFactor || 1;
            // Reveal from top (0%) to bottom (100%) of the node
            const revealPercent = factor * 100;

            return `inset(0 0 ${100 - revealPercent}% 0)`;
        });

    const leafNodes = node.filter(
        (d: d3.HierarchyNode<TransformedNode>) => d.data.type === "leaf"
    );
    const splitNodes = node.filter(
        (d: d3.HierarchyNode<TransformedNode>) => d.data.type === "split"
    );

    // Render split nodes
    splitNodes.each(function (d: d3.HierarchyNode<TransformedNode>) {
        const nodeGroup = d3.select(this as SVGGElement) as d3.Selection<
            SVGGElement,
            d3.HierarchyNode<TransformedNode>,
            null,
            undefined
        >;
        const distribution = getClassDistribution(d, data.classes);
        const totalWidth = 120;
        renderIntegratedSplitNode(
            nodeGroup,
            d,
            distribution,
            totalWidth,
            colorScale
        );
    });

    // Render leaf nodes
    leafNodes.each(function (d: d3.HierarchyNode<TransformedNode>) {
        const nodeGroup = d3.select(this as SVGGElement) as d3.Selection<
            SVGGElement,
            d3.HierarchyNode<TransformedNode>,
            null,
            undefined
        >;
        const distribution = getClassDistribution(d, data.classes);
        const totalWidth = 80;
        renderLeafNode(nodeGroup, d, distribution, totalWidth, colorScale);
    });

    container
        .selectAll(".link")
        .data(visibleLinks)
        .join("path")
        .attr("class", "link")
        .attr("d", (d: any) => {
            const source = d.source;
            const target = d.target;

            // Calculate connection points with padding
            const linePadding = 8;
            let sourceY = source.y as number;
            let targetY = target.y as number;

            // For source (parent) node - start line after node bottom + padding
            if (source.data.type === "split") {
                sourceY = (source.y as number) + 60 + linePadding;
            }

            // For target (child) node - end line before node top - padding
            if (target.data.type === "split") {
                targetY = (target.y as number) - 60 - linePadding; // Assuming split node height ~120px
            } else if (target.data.type === "leaf") {
                targetY = (target.y as number) - 40 - linePadding; // Assuming leaf height ~40px
            }

            return `M${source.x},${sourceY}L${target.x},${targetY}`;
        })
        .attr("fill", "none")
        .attr("stroke", (d) => {
            return d.source.data.isOnPath && d.target.data.isOnPath
                ? onPathColor
                : pathLineColor;
        })
        .attr("stroke-width", 2)
        .attr("opacity", (d: any) => {
            if (isPredictionMode) {
                return d.target.depth === currentStep ? 0.6 : 1;
            }

            // Links appear at full opacity but reveal vertically with their target nodes
            return 1;
        })
        .style("clip-path", (d: d3.HierarchyLink<TransformedNode>) => {
            if (isPredictionMode) {
                return "none";
            }

            // Find the target node to get its interpolation factor
            const targetNode = visibleNodes.find(
                (node: InterpolatedHierarchyNode) =>
                    node.x === d.target.x && node.y === d.target.y
            ) as InterpolatedHierarchyNode;
            const factor = targetNode?.interpolationFactor || 1;
            const revealPercent = factor * 100;

            return `inset(0 0 ${100 - revealPercent}% 0)`;
        });
    container
        .selectAll(".link-label")
        .data(visibleLinks)
        .join("text")
        .attr("class", "link-label")
        .attr("x", (d) => {
            const linkData = d as d3.HierarchyLink<TransformedNode>;
            const isLeftChild =
                linkData.source.children &&
                linkData.source.children[0] === linkData.target;
            return (
                ((linkData.source.x || 0) + (linkData.target.x || 0)) / 2 +
                (isLeftChild ? -30 : 30)
            );
        })
        .attr("y", (d) => {
            const linkData = d as d3.HierarchyLink<TransformedNode>;
            const linePadding = 8;

            let sourceYForLabel = linkData.source.y as number;
            let targetYForLabel = linkData.target.y as number;

            if (linkData.source.data.type === "split") {
                sourceYForLabel =
                    (linkData.source.y as number) + 60 + linePadding;
            }

            if (linkData.target.data.type === "split") {
                targetYForLabel =
                    (linkData.target.y as number) - 60 - linePadding;
            } else if (linkData.target.data.type === "leaf") {
                targetYForLabel =
                    (linkData.target.y as number) - 20 - linePadding;
            }

            return (sourceYForLabel + targetYForLabel) / 2 - 5;
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .attr("fill", (d) => {
            return d.source.data.isOnPath && d.target.data.isOnPath
                ? onPathColor
                : pathLineColor;
        })
        .text((d) => {
            const linkData = d as d3.HierarchyLink<TransformedNode>;
            const isLeftChild =
                linkData.source.children &&
                linkData.source.children[0] === linkData.target;

            const sourceNode = linkData.source.data;
            const threshold = sourceNode.threshold;

            if (sourceNode.type === "split" && threshold !== undefined) {
                return isLeftChild
                    ? `≤ ${threshold.toFixed(2)}`
                    : `> ${threshold.toFixed(2)}`;
            }
            return isLeftChild ? "T" : "F";
        });

    // Add hover interactions
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
            // Additional safety net for tooltip hiding
            tooltip.style("opacity", 0);
        });

    // Since BaseVisualization doesn't call cleanup functions,
    // we'll manage tooltip lifecycle more conservatively
    // Just ensure tooltip is hidden when not in use
};

const getClassDistribution = (
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

const renderIntegratedSplitNode = (
    nodeGroup: d3.Selection<
        SVGGElement,
        d3.HierarchyNode<TransformedNode>,
        null,
        undefined
    >,
    d: d3.HierarchyNode<TransformedNode>,
    distribution: ClassDistribution[],
    totalWidth: number,
    colorScale?: d3.ScaleOrdinal<string, string>
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
        .attr("fill-opacity", d.data.isOnPath ? 1 : 0)
        .attr("stroke-width", d.data.isOnPath ? 2 : 0);

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
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
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

const renderLeafNode = (
    nodeGroup: d3.Selection<
        SVGGElement,
        d3.HierarchyNode<TransformedNode>,
        null,
        undefined
    >,
    _d: d3.HierarchyNode<TransformedNode>,
    distribution: ClassDistribution[],
    totalWidth: number,
    colorScale?: d3.ScaleOrdinal<string, string>
) => {
    const leafHeight = 40;

    if (distribution.length === 0) return;

    if (distribution.length === 1) {
        const classInfo = distribution[0];
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
            .attr("class", "fill-slate-50 font-bold text-[10px]")
            .text(classInfo.class.substring(0, 3));

        nodeGroup
            .append("text")
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .attr("fill", "white")
            .text(`n=${classInfo.count}`);
    } else {
        let currentX = -totalWidth / 2;

        distribution.forEach((classInfo: ClassDistribution, index: number) => {
            const proportionalWidth = Math.max(
                10,
                classInfo.value * totalWidth
            );

            nodeGroup
                .append("path")
                .attr("d", function () {
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
                    .attr("class", "fill-slate-50 font-bold text-[10px]")
                    .text(classInfo.class.substring(0, 3));
                nodeGroup
                    .append("text")
                    .attr("x", currentX + proportionalWidth / 2)
                    .attr("y", 10)
                    .attr("text-anchor", "middle")
                    .attr("class", "fill-slate-50 font-bold text-[8px]")
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
                .attr("d", function () {
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

const getDefaultTooltipContent = (
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
