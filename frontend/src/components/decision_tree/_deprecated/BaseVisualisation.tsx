// BaseDecisionTreeVisualization.tsx
import type { HistogramData, TreeNode } from "@/types/model";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

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

interface ClassDistribution {
    class: string;
    value: number;
    percentage: number;
}

interface NodeStyleConfig {
    pathLineColor?: string;
    pathFillColor?: string;
    defaultFillColor?: string;
    defaultStrokeColor?: string;
}

interface BaseTreeProps {
    data: any;
    nodeStyleConfig?: NodeStyleConfig;
    transformTreeData: (
        node: TreeNode,
        depth: number,
        ...args: any[]
    ) => TransformedNode;
    getTooltipContent?: (
        d: d3.HierarchyNode<TransformedNode>,
        points?: Record<string, number>
    ) => string;
    topControls?: React.ReactNode;
    bottomInfo?: React.ReactNode;
    points?: Record<string, number>;
    onNodeHover?: (
        node: d3.HierarchyNode<TransformedNode>,
        event: MouseEvent
    ) => void;
    maxDisplayDepth?: number;
    // Play system props for depth control
    currentDepth?: number;
    maxDepth?: number;
    onDepthChange?: (depth: number) => void;
    showPlayControls?: boolean;
}

const BaseDecisionTreeVisualization: React.FC<BaseTreeProps> = ({
    data,
    nodeStyleConfig = {},
    transformTreeData,
    getTooltipContent,
    topControls,
    bottomInfo,
    points,
    onNodeHover,
    maxDisplayDepth,
    currentDepth = 0,
    maxDepth = 0,
    onDepthChange,
    showPlayControls = false,
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const visualizationRef = useRef<HTMLDivElement>(null);

    // Play control state
    const [isPlaying, setIsPlaying] = useState(false);
    const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const { pathLineColor = "#2e2e2eff", pathFillColor = "#e1e1e1ff" } =
        nodeStyleConfig;

    const colorScale = d3
        .scaleOrdinal<string>()
        .domain(data.classes)
        .range(d3.schemeDark2.slice(0, data.classes.length));

    const calculateTreeDimensions = (
        root: d3.HierarchyNode<TransformedNode>
    ): { width: number; height: number } => {
        const leaves = root.leaves();
        const maxDepthToShow = maxDisplayDepth ?? root.height;
        const width = Math.max(600, leaves.length * 140 + 200);
        // Add extra height for histograms (80px additional per level)
        const height = Math.max(300, (maxDepthToShow + 1) * 160 + 100);
        return { width, height };
    };

    const getClassDistribution = (
        node: d3.HierarchyNode<TransformedNode>
    ): ClassDistribution[] => {
        if (!node.data.value || !node.data.value[0]) return [];

        return node.data.value[0]
            .map((value: number, index: number) => ({
                class: data.classes[index],
                value: value,
                percentage: value * 100,
            }))
            .filter((item: ClassDistribution) => item.value > 0)
            .sort(
                (a: ClassDistribution, b: ClassDistribution) =>
                    b.value - a.value
            );
    };

    const getHistogramOffset = (
        node: d3.HierarchyNode<TransformedNode>
    ): number => {
        const miniHeight = 40;
        const nodeY = node.y as number;
        const marginTop = 60; // Updated to match new margin
        const availableSpaceAbove = nodeY + marginTop;

        const offsetY = availableSpaceAbove >= miniHeight + 30 ? -70 : 50;

        return offsetY;
    };

    const renderMiniHistogram = (
        nodeGroup: d3.Selection<SVGGElement, any, any, any>,
        node: d3.HierarchyNode<TransformedNode>,
        offsetY?: number
    ) => {
        // Use dynamic positioning if no specific offset provided
        const dynamicOffsetY =
            offsetY !== undefined ? offsetY : getHistogramOffset(node);
        const histogramData = node.data.histogram_data;

        if (
            !histogramData ||
            !histogramData.bins ||
            histogramData.bins.length < 2 ||
            !histogramData.counts_by_class ||
            Object.keys(histogramData.counts_by_class).length === 0
        ) {
            return;
        }

        const miniWidth = 100;
        const miniHeight = 40;
        const miniMargin = { top: 5, right: 5, bottom: 5, left: 5 };
        const innerWidth = miniWidth - miniMargin.left - miniMargin.right;
        const innerHeight = miniHeight - miniMargin.top - miniMargin.bottom;

        const histogramGroup = nodeGroup
            .append("g")
            .attr("class", "mini-histogram")
            .attr(
                "transform",
                `translate(${-miniWidth / 2}, ${dynamicOffsetY})`
            );

        histogramGroup
            .append("rect")
            .attr("width", miniWidth)
            .attr("height", miniHeight)
            .attr("rx", 3)
            .attr("fill", "white")
            .attr("opacity", 0.9);

        const g = histogramGroup
            .append("g")
            .attr(
                "transform",
                `translate(${miniMargin.left}, ${miniMargin.top})`
            );

        const bins = histogramData.bins;
        const binWidth = bins.length > 1 ? bins[1] - bins[0] : 1;
        const classes = Object.keys(histogramData.counts_by_class).sort();

        const stackedData: Array<{
            bin: number;
            class: string;
            count: number;
            y0: number;
            y1: number;
        }> = [];

        for (let i = 0; i < bins.length - 1; i++) {
            let y0 = 0;
            for (const cls of classes) {
                const count = histogramData.counts_by_class[cls][i] || 0;
                stackedData.push({
                    bin: bins[i],
                    class: cls,
                    count,
                    y0,
                    y1: y0 + count,
                });
                y0 += count;
            }
        }

        // Scales
        const xScale = d3
            .scaleLinear()
            .domain(d3.extent(bins) as [number, number])
            .range([0, innerWidth]);

        const maxY = d3.max(stackedData, (d) => d.y1) || 1;
        const yScale = d3
            .scaleLinear()
            .domain([0, maxY])
            .range([innerHeight, 0]);

        g.selectAll(".mini-bar")
            .data(stackedData)
            .enter()
            .append("rect")
            .attr("class", "mini-bar")
            .attr("x", (d) => xScale(d.bin))
            .attr("y", (d) => yScale(d.y1))
            .attr(
                "width",
                Math.max(1, xScale(bins[0] + binWidth) - xScale(bins[0]) - 0.5)
            )
            .attr("height", (d) => yScale(d.y0) - yScale(d.y1))
            .attr("fill", (d) => colorScale(d.class))
            .attr("opacity", 0.8);

        if (histogramData.threshold !== undefined && histogramData.threshold !== null) {
            g.append("line")
                .attr("x1", xScale(histogramData.threshold))
                .attr("x2", xScale(histogramData.threshold))
                .attr("y1", 0)
                .attr("y2", innerHeight)
                .attr("stroke", "red")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2,2")
                .attr("opacity", 0.8);
        }
    };

    const renderIntegratedSplitNode = (
        nodeGroup: d3.Selection<SVGGElement, any, any, any>,
        node: d3.HierarchyNode<TransformedNode>,
        distribution: ClassDistribution[],
        totalWidth: number
    ) => {
        const histogramData = node.data.histogram_data;

        // Layout configuration
        const histogramHeight = 40;
        const textHeight = 20;
        const distributionBarHeight = 6;
        const padding = 4;
        const totalHeight =
            histogramHeight + textHeight + distributionBarHeight + padding * 2;

        // Calculate positions from top to bottom
        const histogramY = -totalHeight / 2;
        const textY = histogramY + histogramHeight + padding;
        const distributionBarY = textY + textHeight / 2 + padding;

        // Store node dimensions for line connection calculations
        (node as any).nodeHeight = totalHeight;
        (node as any).distributionBarBottom =
            distributionBarY + distributionBarHeight;

        // 1. Render histogram (top section)
        if (
            histogramData &&
            histogramData.bins &&
            histogramData.bins.length >= 2 &&
            histogramData.counts_by_class
        ) {
            renderInlineHistogram(nodeGroup, histogramData, {
                width: totalWidth - 10,
                height: histogramHeight - 5,
                x: -(totalWidth - 10) / 2,
                y: histogramY + 2,
            });
        }

        // 2. Render text (middle section)
        const feature = node.data.feature || "Split";
        const displayFeature =
            feature.length > 16 ? feature.substring(0, 14) + "..." : feature;

        nodeGroup
            .append("text")
            .attr("x", 0)
            .attr("y", textY + 5) // Center text vertically
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .attr("fill", node.data.isOnPath ? pathLineColor : "#374151")
            .text(displayFeature);

        // 3. Render distribution bar (bottom section)
        if (distribution.length > 0) {
            let currentX = -totalWidth / 2 + 5;
            const barWidth = totalWidth - 10;

            distribution.forEach((classInfo: ClassDistribution) => {
                const segmentWidth = Math.max(1, classInfo.value * barWidth);

                nodeGroup
                    .append("rect")
                    .attr("width", segmentWidth)
                    .attr("height", distributionBarHeight)
                    .attr("x", currentX)
                    .attr("y", distributionBarY)
                    .attr("rx", 2)
                    .attr("fill", colorScale(classInfo.class))
                    .attr("opacity", node.data.isOnPath ? 0.9 : 0.7);

                currentX += segmentWidth;
            });
        }
    };

    const renderInlineHistogram = (
        nodeGroup: d3.Selection<SVGGElement, any, any, any>,
        histogramData: HistogramData,
        layout: { width: number; height: number; x: number; y: number }
    ) => {
        const { width, height, x, y } = layout;
        const margin = { top: 2, right: 2, bottom: 2, left: 2 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const histogramGroup = nodeGroup
            .append("g")
            .attr("class", "inline-histogram")
            .attr("transform", `translate(${x}, ${y})`);

        // No background - histogram blends seamlessly with node

        const g = histogramGroup
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const bins = histogramData.bins;
        const binWidth = bins.length > 1 ? bins[1] - bins[0] : 1;
        const classes = Object.keys(histogramData.counts_by_class).sort();

        const stackedData: Array<{
            bin: number;
            class: string;
            count: number;
            y0: number;
            y1: number;
        }> = [];

        for (let i = 0; i < bins.length - 1; i++) {
            let y0 = 0;
            for (const cls of classes) {
                const count = histogramData.counts_by_class[cls][i] || 0;
                stackedData.push({
                    bin: bins[i],
                    class: cls,
                    count,
                    y0,
                    y1: y0 + count,
                });
                y0 += count;
            }
        }

        // Scales
        const xScale = d3
            .scaleLinear()
            .domain(d3.extent(bins) as [number, number])
            .range([0, innerWidth]);

        const maxY = d3.max(stackedData, (d) => d.y1) || 1;
        const yScale = d3
            .scaleLinear()
            .domain([0, maxY])
            .range([innerHeight, 0]);

        g.selectAll(".inline-bar")
            .data(stackedData)
            .enter()
            .append("rect")
            .attr("class", "inline-bar")
            .attr("x", (d) => xScale(d.bin))
            .attr("y", (d) => yScale(d.y1))
            .attr(
                "width",
                Math.max(1, xScale(bins[0] + binWidth) - xScale(bins[0]) - 0.5)
            )
            .attr("height", (d) => yScale(d.y0) - yScale(d.y1))
            .attr("fill", (d) => colorScale(d.class))
            .attr("opacity", 0.8);

        if (histogramData.threshold !== undefined && histogramData.threshold !== null) {
            g.append("line")
                .attr("x1", xScale(histogramData.threshold))
                .attr("x2", xScale(histogramData.threshold))
                .attr("y1", 0)
                .attr("y2", innerHeight)
                .attr("stroke", "red")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "3,2")
                .attr("opacity", 0.9);
        }
    };

    const defaultTooltipContent = (
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

            // Add class distribution for split nodes
            if (d.data.value) {
                content += `<div class="mt-2 text-sm font-semibold">Class Distribution:</div>`;
                const distribution = getClassDistribution(d);
                distribution.forEach((classInfo: ClassDistribution) => {
                    content += `<div class="flex items-center mt-1">
                        <div class="w-3 h-3 rounded mr-2 text-sm" style="background-color: ${colorScale(
                            classInfo.class
                        )}"></div>
                        <span class="text-sm">${
                            classInfo.class
                        }: ${classInfo.percentage.toFixed(1)}%</span>
                    </div>`;
                });
            }
        } else if (d.data.value) {
            content += `<div class="mt-2 text-sm font-semibold">Class Distribution:</div>`;
            const distribution = getClassDistribution(d);
            distribution.forEach((classInfo: ClassDistribution) => {
                content += `<div class="flex items-center mt-1">
                    <div class="w-3 h-3 rounded mr-2 text-sm" style="background-color: ${colorScale(
                        classInfo.class
                    )}"></div>
                    <span class="text-sm">${
                        classInfo.class
                    }: ${classInfo.percentage.toFixed(1)}%</span>
                </div>`;
            });
        }

        return content;
    };

    // Track current depth with a ref to avoid stale closures
    const currentDepthRef = useRef(currentDepth);
    useEffect(() => {
        currentDepthRef.current = currentDepth;
    }, [currentDepth]);

    // Play control functions
    const startPlaying = () => {
        if (!onDepthChange || currentDepthRef.current >= maxDepth) return;
        setIsPlaying(true);

        playIntervalRef.current = setInterval(() => {
            const currentValue = currentDepthRef.current;
            const nextDepth = currentValue + 1;

            if (nextDepth >= maxDepth) {
                setIsPlaying(false);
                onDepthChange(maxDepth);
                clearInterval(playIntervalRef.current!);
            } else {
                onDepthChange(nextDepth);
            }
        }, 500);
    };

    const stopPlaying = () => {
        setIsPlaying(false);
        if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
        }
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            stopPlaying();
        } else if (currentDepthRef.current >= maxDepth) {
            onDepthChange && onDepthChange(0);

            setTimeout(() => {
                startPlaying();
            }, 50);
        } else {
            startPlaying();
        }
    };

    const handleSliderChange = (newDepth: number) => {
        stopPlaying();
        onDepthChange?.(newDepth);
    };

    // Clean up interval on unmount
    useEffect(() => {
        return () => {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
            }
        };
    }, []);

    // Stop playing when reaching max depth
    useEffect(() => {
        if (currentDepth >= maxDepth && isPlaying) {
            stopPlaying();
        }
    }, [currentDepth, maxDepth, isPlaying]);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const containerWidth = containerRef.current?.clientWidth || 400;
        const root = d3.hierarchy(transformTreeData(data.tree, 0));
        const { width: treeWidth, height: treeHeight } =
            calculateTreeDimensions(root);
        const margin = { top: 60, right: 30, bottom: 30, left: 30 }; // Increased top margin for histogram visibility

        const contentWidth = treeWidth - margin.left - margin.right;
        const contentHeight = treeHeight - margin.top - margin.bottom;
        const centerX = Math.max(containerWidth / 2, treeWidth / 2);
        const rootOffsetX = centerX - contentWidth / 2;

        svg.attr("width", treeWidth).attr("height", treeHeight);

        const g = svg
            .append("g")
            .attr("transform", `translate(${rootOffsetX},${margin.top})`);

        const treeLayout = d3
            .tree<TransformedNode>()
            .size([contentWidth, contentHeight]);
        treeLayout(root);

        // Create tooltip
        const tooltip = d3
            .select("body")
            .append("div")
            .attr(
                "class",
                "absolute bg-gray-800 text-white p-3 rounded-lg shadow-lg pointer-events-none opacity-0 z-50 max-w-xs"
            )
            .style("transition", "opacity 0.3s");

        // Draw nodes FIRST (so dimensions are available for line connections)
        const node = g
            .selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr(
                "transform",
                (d: d3.HierarchyNode<TransformedNode>) =>
                    `translate(${d.x},${d.y})`
            );

        const leafNodes = node.filter(
            (d: d3.HierarchyNode<TransformedNode>) => d.data.type === "leaf"
        );
        const splitNodes = node.filter(
            (d: d3.HierarchyNode<TransformedNode>) => d.data.type === "split"
        );

        splitNodes.each(function (d: d3.HierarchyNode<TransformedNode>) {
            const nodeGroup = d3.select(this);
            const distribution = getClassDistribution(d);
            const totalWidth = 120;

            // Render integrated histogram-text-bar node structure
            renderIntegratedSplitNode(nodeGroup, d, distribution, totalWidth);
        });

        // Render leaf nodes
        leafNodes.each(function (d: d3.HierarchyNode<TransformedNode>) {
            const nodeGroup = d3.select(this);
            const distribution = getClassDistribution(d);
            const totalWidth = 90;
            const leafHeight = 40;

            if (distribution.length === 0) return;

            // Render mini histogram above leaf node
            renderMiniHistogram(nodeGroup, d); // Use dynamic positioning

            // Path highlighting background
            if (d.data.isOnPath) {
                nodeGroup
                    .append("rect")
                    .attr("width", totalWidth + 6)
                    .attr("height", leafHeight + 6)
                    .attr("x", -totalWidth / 2 - 3)
                    .attr("y", -leafHeight / 2 - 3)
                    .attr("rx", 8)
                    .attr(
                        "fill",
                        d.data.isCurrentNode ? pathLineColor : pathFillColor
                    )
                    .attr("opacity", d.data.isCurrentNode ? 0.3 : 0.2);
            }

            let currentX = -totalWidth / 2;

            // Create class segments
            distribution.forEach(
                (classInfo: ClassDistribution, index: number) => {
                    const segmentWidth = Math.max(
                        5,
                        classInfo.value * totalWidth
                    );

                    nodeGroup
                        .append("rect")
                        .attr("width", segmentWidth)
                        .attr("height", leafHeight)
                        .attr("x", currentX)
                        .attr("y", -leafHeight / 2)
                        .attr("rx", index === 0 ? 6 : 0)
                        .attr("fill", colorScale(classInfo.class))
                        .attr("stroke", "#ffffff")
                        .attr("stroke-width", 1);

                    if (segmentWidth > 15) {
                        nodeGroup
                            .append("text")
                            .attr("x", currentX + segmentWidth / 2)
                            .attr("y", -3)
                            .attr("text-anchor", "middle")
                            .attr("font-size", "9px")
                            .attr("font-weight", "bold")
                            .attr("fill", "white")
                            .text(classInfo.class.substring(0, 3));
                    }

                    currentX += segmentWidth;
                }
            );

            if (distribution.length > 1) {
                nodeGroup.select("rect:last-of-type").attr("rx", 6);
            }

            nodeGroup
                .append("text")
                .attr("y", 10)
                .attr("text-anchor", "middle")
                .attr("font-size", "8px")
                .attr("fill", "white")
                .text(`n=${d.data.samples}`);
        });

        // Add hover interactions
        node.style("cursor", "pointer")
            .on(
                "mouseover",
                function (
                    event: MouseEvent,
                    d: d3.HierarchyNode<TransformedNode>
                ) {
                    d3.select(this).selectAll("rect").attr("stroke-width", 3);

                    const tooltipContent = getTooltipContent
                        ? getTooltipContent(d, points)
                        : defaultTooltipContent(d);

                    tooltip
                        .html(tooltipContent)
                        .style("background-color", "white")
                        .style("color", "black")
                        .style("opacity", 0.8)
                        .style("left", event.pageX + 15 + "px")
                        .style("top", event.pageY - 10 + "px");

                    if (onNodeHover) {
                        onNodeHover(d, event);
                    }
                }
            )
            .on("mouseout", function () {
                d3.select(this)
                    .selectAll<
                        SVGRectElement,
                        d3.HierarchyNode<TransformedNode>
                    >("rect")
                    .attr("stroke-width", (d) => {
                        if (d.data.isCurrentNode) return 3;
                        return d.data.type === "leaf" ? 1 : 2;
                    });
                tooltip.style("opacity", 0);
            });

        // Split node labels are now handled within renderIntegratedSplitNode

        // NOW draw links after nodes are rendered and dimensions are stored
        g.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link fill-none")
            .attr("stroke", (d: d3.HierarchyLink<TransformedNode>) => {
                const isPathLink =
                    d.source.data.isOnPath && d.target.data.isOnPath;
                return isPathLink ? pathLineColor : "#d1d5db";
            })
            .attr("stroke-width", (d: d3.HierarchyLink<TransformedNode>) => {
                const isPathLink =
                    d.source.data.isOnPath && d.target.data.isOnPath;
                return isPathLink ? 4 : 2;
            })
            .attr("d", (d: d3.HierarchyLink<TransformedNode>) => {
                const source = d.source;
                const target = d.target;

                // Calculate connection points with padding for split nodes
                const linePadding = 8; // Padding between node and line
                let sourceY = source.y as number;
                let targetY = target.y as number;

                // For source (parent) node - start line after distribution bar bottom + padding
                if (
                    source.data.type === "split" &&
                    (source as any).distributionBarBottom !== undefined
                ) {
                    const originalY = source.y as number;
                    sourceY =
                        originalY +
                        (source as any).distributionBarBottom +
                        linePadding;
                }

                // For target (child) node - end line before node top - padding
                if (
                    target.data.type === "split" &&
                    (target as any).nodeHeight !== undefined
                ) {
                    targetY =
                        (target.y as number) -
                        (target as any).nodeHeight / 2 -
                        linePadding;
                } else if (target.data.type === "leaf") {
                    // For leaf nodes, use standard padding
                    targetY = (target.y as number) - 20 - linePadding; // Assuming leaf height ~40px
                }

                return `M${source.x},${sourceY}L${target.x},${targetY}`;
            });

        root.links().forEach((linkData) => {
            const isLeftChild =
                linkData.target.parent &&
                linkData.target.parent.children &&
                linkData.target.parent.children[0] === linkData.target;

            const sourceNode = linkData.source.data;
            const threshold = sourceNode.threshold;

            let conditionText = "";
            if (sourceNode.type === "split" && threshold !== undefined) {
                if (isLeftChild) {
                    conditionText = `≤ ${threshold.toFixed(2)}`;
                } else {
                    conditionText = `> ${threshold.toFixed(2)}`;
                }
            } else {
                conditionText = isLeftChild ? "T" : "F";
            }

            // Calculate label position based on actual line connection points
            const linePadding = 8;
            let sourceYForLabel = linkData.source.y as number;
            let targetYForLabel = linkData.target.y as number;

            // Use same logic as line drawing for consistency
            if (
                linkData.source.data.type === "split" &&
                (linkData.source as any).distributionBarBottom !== undefined
            ) {
                sourceYForLabel =
                    (linkData.source.y as number) +
                    (linkData.source as any).distributionBarBottom +
                    linePadding;
            }

            if (
                linkData.target.data.type === "split" &&
                (linkData.target as any).nodeHeight !== undefined
            ) {
                targetYForLabel =
                    (linkData.target.y as number) -
                    (linkData.target as any).nodeHeight / 2 -
                    linePadding;
            } else if (linkData.target.data.type === "leaf") {
                targetYForLabel =
                    (linkData.target.y as number) - 20 - linePadding;
            }

            g.append("text")
                .attr(
                    "x",
                    ((linkData.source.x as number) +
                        (linkData.target.x as number)) /
                        2 +
                        (isLeftChild ? -15 : 15)
                )
                .attr("y", (sourceYForLabel + targetYForLabel) / 2 - 5)
                .attr("text-anchor", "middle")
                .attr("font-size", "9px")
                .attr("font-weight", "bold")
                .attr("fill", () => {
                    const isPathLink =
                        linkData.source.data.isOnPath &&
                        linkData.target.data.isOnPath;
                    return isPathLink ? pathLineColor : "#6b7280";
                })
                .text(conditionText);
        });

        // Auto-scroll to center
        if (treeWidth > containerWidth) {
            const scrollLeft = Math.max(0, (treeWidth - containerWidth) / 2);
            if (containerRef.current) {
                containerRef.current.scrollLeft = scrollLeft;
            }
        }

        return () => {
            tooltip.remove();
        };
    }, [
        data,
        transformTreeData,
        getTooltipContent,
        colorScale,
        pathLineColor,
        pathFillColor,
        currentDepth,
    ]);

    const MinimalPlayControls = () => (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-sm border border-gray-200/50 rounded-lg px-2 py-1 shadow-sm">
            <button
                onClick={handlePlayPause}
                title={
                    isPlaying
                        ? "Pause"
                        : currentDepth >= maxDepth
                        ? "Restart animation"
                        : "Play"
                }
                style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: isPlaying
                        ? "#ef4444" // Red when playing
                        : currentDepth >= maxDepth
                        ? "#22c55e" // Green for restart
                        : "#3b82f6", // Blue for play
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 1,
                    transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                    const target = e.target as HTMLButtonElement;
                    if (isPlaying) {
                        target.style.backgroundColor = "#dc2626"; // Darker red when playing
                    } else if (currentDepth >= maxDepth) {
                        target.style.backgroundColor = "#16a34a"; // Darker green for restart
                    } else {
                        target.style.backgroundColor = "#2563eb"; // Darker blue for play
                    }
                }}
                onMouseOut={(e) => {
                    const target = e.target as HTMLButtonElement;
                    if (isPlaying) {
                        target.style.backgroundColor = "#ef4444"; // Red when playing
                    } else if (currentDepth >= maxDepth) {
                        target.style.backgroundColor = "#22c55e"; // Green for restart
                    } else {
                        target.style.backgroundColor = "#3b82f6"; // Blue for play
                    }
                }}
            >
                {isPlaying ? (
                    // Pause icon
                    <svg
                        className="w-2.5 h-2.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M6 4h2v12H6V4zm6 0h2v12h-2V4z" />
                    </svg>
                ) : currentDepth >= maxDepth ? (
                    // Restart icon (circular arrow)
                    <svg
                        className="w-2.5 h-2.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
                    </svg>
                ) : (
                    // Play icon
                    <svg
                        className="w-2.5 h-2.5 ml-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                )}
            </button>

            {/* Compact Slider */}
            <input
                type="range"
                min="0"
                max={maxDepth}
                value={currentDepth}
                onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                    background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                        (currentDepth / maxDepth) * 100
                    }%, #E5E7EB ${
                        (currentDepth / maxDepth) * 100
                    }%, #E5E7EB 100%)`,
                }}
                title={`Depth: ${currentDepth}/${maxDepth}`}
            />

            {/* Minimal Depth Display */}
            <span className="text-xs font-medium text-gray-600 min-w-0">
                {currentDepth}/{maxDepth}
            </span>
        </div>
    );

    return (
        <div className="w-full h-full min-h-0 shadow-lg overflow-hidden flex flex-col">
            {topControls && (
                <div className="p-4 flex-shrink-0">{topControls}</div>
            )}

            <div
                ref={visualizationRef}
                className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-white min-h-0 relative"
            >
                {/* Minimal Play Controls Overlay */}
                {showPlayControls && onDepthChange && maxDepth > 0 && (
                    <MinimalPlayControls />
                )}

                <div
                    ref={containerRef}
                    className="w-full h-full overflow-auto"
                >
                    <svg
                        ref={svgRef}
                        className="block"
                    ></svg>
                </div>
            </div>

            {bottomInfo && (
                <div className="p-2 border-t bg-gray-50 text-xs text-gray-600 flex-shrink-0">
                    {bottomInfo}
                </div>
            )}
        </div>
    );
};

export default BaseDecisionTreeVisualization;
