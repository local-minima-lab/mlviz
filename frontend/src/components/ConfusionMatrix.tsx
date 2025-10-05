import { useResizeObserver } from "@/hooks/useResizeObserver";
import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";
import { applyFont } from "./visualisation/config/fonts";

interface TooltipData {
    actual: string;
    predicted: string;
    count: number;
    x: number;
    y: number;
    visible: boolean;
}

interface ConfusionMatrixProps {
    classes?: string[];
    matrix?: number[][];
    minSize?: number;
    minCellSize?: number;
    aspectRatio?: number;
}

const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({
    classes,
    matrix,
    minSize = 180,
    minCellSize = 20,
    aspectRatio = 1,
}) => {
    if (!classes || !matrix) {
        return <></>;
    }

    const svgRef = useRef<SVGSVGElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { ref: containerRef, dimensions } = useResizeObserver();
    const [tooltip, setTooltip] = useState<TooltipData>({
        actual: "",
        predicted: "",
        count: 0,
        x: 0,
        y: 0,
        visible: false,
    });

    // Calculate responsive dimensions
    const getResponsiveDimensions = () => {
        if (dimensions.width === 0) return { width: minSize, height: minSize };

        const containerWidth = dimensions.width;
        const containerHeight = dimensions.height;
        const numClasses = classes.length;

        const margin = { top: 10, right: 10, bottom: 10, left: 10 };
        const minRequiredWidth =
            numClasses * minCellSize + margin.left + margin.right;
        const minRequiredHeight =
            numClasses * minCellSize + margin.top + margin.bottom;

        // Start with container size but respect minimums
        let width = Math.max(containerWidth, minSize, minRequiredWidth);
        let height = Math.max(width / aspectRatio, minSize, minRequiredHeight);

        // If height exceeds container, adjust both dimensions but maintain minimum cell size
        if (height > containerHeight && containerHeight > 0) {
            height = Math.max(containerHeight, minRequiredHeight);
            width = Math.max(height * aspectRatio, minRequiredWidth);
        }

        return { width, height };
    };

    const { width, height } = getResponsiveDimensions();

    // Center the scroll position
    const centerScroll = () => {
        if (!scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate center position
        const centerX = (width - containerWidth) / 2;
        const centerY = (height - containerHeight) / 2;

        // Only center if content is larger than container
        if (width > containerWidth) {
            container.scrollLeft = Math.max(0, centerX);
        }
        if (height > containerHeight) {
            container.scrollTop = Math.max(0, centerY);
        }
    };

    useEffect(() => {
        if (!svgRef.current || !classes || !matrix || dimensions.width === 0)
            return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 20, right: 40, bottom: 20, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const numClasses = classes.length;

        // Create scales
        const cellSize = Math.max(
            minCellSize,
            Math.min(innerWidth, innerHeight) / numClasses
        );
        const xScale = d3
            .scaleBand()
            .domain(classes)
            .range([0, numClasses * cellSize])
            .padding(0.05);

        const yScale = d3
            .scaleBand()
            .domain(classes)
            .range([0, numClasses * cellSize])
            .padding(0.05);

        // Color scale
        const maxValue = d3.max(matrix.flat()) || 1;
        const colorScale = d3
            .scaleSequential(d3.interpolateBlues)
            .domain([0, maxValue]);

        // Create main group
        const g = svg
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create cells
        const cells = g
            .selectAll(".cell")
            .data(
                matrix.flatMap((row, i) =>
                    row.map((value, j) => ({
                        actual: classes[i],
                        predicted: classes[j],
                        value,
                        row: i,
                        col: j,
                    }))
                )
            )
            .enter()
            .append("g")
            .attr("class", "cell");

        // Add rectangles
        cells
            .append("rect")
            .attr("x", (d) => xScale(d.predicted) || 0)
            .attr("y", (d) => yScale(d.actual) || 0)
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("fill", (d) => colorScale(d.value))
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .attr("cursor", "pointer")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("stroke", "#333").attr("stroke-width", 3);

                const [mouseX, mouseY] = d3.pointer(event, document.body);
                setTooltip({
                    actual: d.actual,
                    predicted: d.predicted,
                    count: d.value,
                    x: mouseX,
                    y: mouseY,
                    visible: true,
                });
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
                setTooltip((prev) => ({ ...prev, visible: false }));
            });

        // Responsive font sizes based on cell size
        const cellFontSize = Math.max(10, Math.min(16, cellSize / 4));
        const labelFontSize = Math.max(10, Math.min(14, cellSize / 6));
        const titleFontSize = Math.max(12, Math.min(16, cellSize / 5));

        // Add text labels in cells
        cells
            .append("text")
            .attr(
                "x",
                (d) => (xScale(d.predicted) || 0) + xScale.bandwidth() / 2
            )
            .attr("y", (d) => (yScale(d.actual) || 0) + yScale.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", (d) => (d.value > maxValue / 2 ? "white" : "black"))
            .attr("font-size", `${cellFontSize}px`)
            .call(applyFont.family)
            .call(applyFont.weight.bold)
            .attr("pointer-events", "none")
            .text((d) => d.value);

        // Add X axis labels (Predicted)
        g.append("g")
            .attr("class", "x-axis")
            .selectAll(".x-label")
            .data(classes)
            .enter()
            .append("text")
            .attr("class", "x-label")
            .attr("x", (d) => (xScale(d) || 0) + xScale.bandwidth() / 2)
            .attr("y", numClasses * cellSize + 20)
            .attr("text-anchor", "middle")
            .attr("font-size", `${labelFontSize}px`)
            .call(applyFont.family)
            .call(applyFont.weight.medium)
            .text((d) => d.substring(0, 3));

        // Add Y axis labels (Actual)
        g.append("g")
            .attr("class", "y-axis")
            .selectAll(".y-label")
            .data(classes)
            .enter()
            .append("text")
            .attr("class", "y-label")
            .attr("x", -20)
            .attr("y", (d) => (yScale(d) || 0) + yScale.bandwidth() / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", `${labelFontSize}px`)
            .call(applyFont.family)
            .call(applyFont.weight.medium)
            .text((d) => d.substring(0, 3));

        // Add axis titles
        g.append("text")
            .attr("x", (numClasses * cellSize) / 2)
            .attr("y", numClasses * cellSize + 45)
            .attr("text-anchor", "middle")
            .attr("font-size", `${titleFontSize}px`)
            .call(applyFont.family)
            .call(applyFont.weight.bold)
            .text("Predicted");

        g.append("text")
            .attr("x", -45)
            .attr("y", (numClasses * cellSize) / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", `${titleFontSize}px`)
            .call(applyFont.family)
            .call(applyFont.weight.bold)
            .attr(
                "transform",
                `rotate(-90, -45, ${(numClasses * cellSize) / 2})`
            )
            .text("Actual");

        // Center scroll after rendering - use setTimeout to ensure DOM is updated
        setTimeout(() => {
            centerScroll();
        }, 0);
    }, [classes, matrix, width, height, dimensions, minCellSize]);

    // Also center scroll when container dimensions change
    useEffect(() => {
        if (dimensions.width > 0 && dimensions.height > 0) {
            setTimeout(() => {
                centerScroll();
            }, 100); // Small delay to ensure container is ready
        }
    }, [dimensions.width, dimensions.height, width, height]);

    // Check if scrolling is needed
    const needsScrolling = width > dimensions.width && dimensions.width > 0;

    return (
        <div className="w-full h-full flex flex-col align-start overflow-hidden">
            <div
                ref={containerRef}
                className="relative min-h-0"
            >
                <div
                    ref={scrollContainerRef}
                    className="w-full h-full overflow-auto"
                >
                    <div
                        className="relative"
                        style={{
                            width: Math.max(width, dimensions.width || 0),
                            height: Math.max(height, dimensions.height || 0),
                            minWidth: width,
                            minHeight: height,
                        }}
                    >
                        <svg
                            ref={svgRef}
                            width={width}
                            height={height}
                            className="overflow-visible"
                        />
                    </div>
                </div>
            </div>

            {needsScrolling && (
                <div className="border-t flex justify-center text-xs text-gray-600 flex-shrink-0">
                    <p>Scroll to view more</p>
                </div>
            )}

            {tooltip.visible && (
                <div
                    className="fixed z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg pointer-events-none"
                    style={{
                        left: tooltip.x + 10,
                        top: tooltip.y - 10,
                        transform: "translateY(-100%)",
                    }}
                >
                    <div>Actual: {tooltip.actual}</div>
                    <div>Predicted: {tooltip.predicted}</div>
                    <div>Count: {tooltip.count}</div>
                </div>
            )}
        </div>
    );
};

export default ConfusionMatrix;
