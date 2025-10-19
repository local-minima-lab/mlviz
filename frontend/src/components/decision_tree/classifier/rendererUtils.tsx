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
