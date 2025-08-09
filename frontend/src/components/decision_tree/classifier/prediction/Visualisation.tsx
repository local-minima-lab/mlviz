import type { TrainModelResponse, TreeNode } from "@/types/model";
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

interface DecisionTreePredictVisualizationProps {
    treeData: TrainModelResponse;
    points: Record<string, number>; // The point to predict
}

const DecisionTreePredictVisualization: React.FC<
    DecisionTreePredictVisualizationProps
> = ({ treeData, points }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [maxDepth, setMaxDepth] = useState<number>(0);
    const [currentDepth, setCurrentDepth] = useState<number>(0);
    const [predictionPath, setPredictionPath] = useState<TreeNode[]>([]);

    // Dynamic color palette based on available classes
    const colorScale = d3
        .scaleOrdinal<string>()
        .domain(treeData.classes)
        .range(d3.schemeDark2.slice(0, treeData.classes.length));

    // Calculate the prediction path for the given point
    const calculatePredictionPath = (
        node: TreeNode,
        path: TreeNode[] = []
    ): TreeNode[] => {
        const newPath = [...path, node];

        if (node.type === "leaf") {
            return newPath;
        }

        const featureValue = points[node.feature];
        if (featureValue === undefined) {
            return newPath; // Stop if feature not found
        }

        const goLeft = featureValue <= node.threshold;
        const nextNode = goLeft ? node.left : node.right;

        return calculatePredictionPath(nextNode, newPath);
    };

    // Transform tree data for D3 hierarchy with path highlighting
    const transformTreeData = (
        node: TreeNode,
        depth: number = 0,
        pathNodes: Set<TreeNode> = new Set(),
        currentPathDepth: number = 0
    ): TransformedNode => {
        const isOnPath = pathNodes.has(node);
        const isCurrentNode = isOnPath && depth === currentPathDepth;

        const transformed: TransformedNode = {
            name:
                node.type === "leaf"
                    ? `Leaf (${node.samples} samples)`
                    : `${node.feature} <= ${node.threshold.toFixed(2)}`,
            type: node.type,
            samples: node.samples,
            impurity: node.impurity,
            depth: depth,
            children: [],
            isOnPath,
            isCurrentNode,
        };

        if (node.type === "split") {
            transformed.feature = node.feature;
            transformed.threshold = node.threshold;
            transformed.children.push(
                transformTreeData(
                    node.left,
                    depth + 1,
                    pathNodes,
                    currentPathDepth
                )
            );
            transformed.children.push(
                transformTreeData(
                    node.right,
                    depth + 1,
                    pathNodes,
                    currentPathDepth
                )
            );
        } else {
            transformed.value = node.value;
        }

        return transformed;
    };

    // Calculate dynamic dimensions based on tree structure
    const calculateTreeDimensions = (
        root: d3.HierarchyNode<TransformedNode>
    ): { width: number; height: number } => {
        const leaves = root.leaves();
        const width = Math.max(600, leaves.length * 140 + 200);
        const height = Math.max(300, (maxDepth + 1) * 120 + 100);
        return { width, height };
    };

    // Get class distribution for a leaf node
    const getClassDistribution = (
        node: d3.HierarchyNode<TransformedNode>
    ): ClassDistribution[] => {
        if (!node.data.value || !node.data.value[0]) return [];

        return node.data.value[0]
            .map((value: number, index: number) => ({
                class: treeData.classes[index],
                value: value,
                percentage: value * 100,
            }))
            .filter((item: ClassDistribution) => item.value > 0)
            .sort(
                (a: ClassDistribution, b: ClassDistribution) =>
                    b.value - a.value
            );
    };

    // Calculate path and max depth when tree data or points change
    useEffect(() => {
        const calculateMaxDepth = (
            node: TreeNode,
            depth: number = 0
        ): number => {
            if (node.type === "leaf") return depth;

            let maxChildDepth: number = depth;
            maxChildDepth = Math.max(
                maxChildDepth,
                calculateMaxDepth(node.left, depth + 1)
            );
            maxChildDepth = Math.max(
                maxChildDepth,
                calculateMaxDepth(node.right, depth + 1)
            );
            return maxChildDepth;
        };

        const calculatedMaxDepth: number = calculateMaxDepth(treeData.tree);
        const path = calculatePredictionPath(treeData.tree);

        setMaxDepth(calculatedMaxDepth);
        setPredictionPath(path);
        setCurrentDepth(0);
    }, [treeData, points]);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const containerWidth: number = containerRef.current?.clientWidth || 400;

        const pathUpToCurrentDepth = new Set(
            predictionPath.slice(0, currentDepth + 1)
        );

        const root = d3.hierarchy(
            transformTreeData(
                treeData.tree,
                0,
                pathUpToCurrentDepth,
                currentDepth
            )
        );
        const { width: treeWidth, height: treeHeight } =
            calculateTreeDimensions(root);
        const margin = { top: 30, right: 30, bottom: 30, left: 30 };

        const contentWidth: number = treeWidth - margin.left - margin.right;
        const contentHeight: number = treeHeight - margin.top - margin.bottom;

        const svgWidth: number = treeWidth;
        const svgHeight: number = treeHeight;

        svg.attr("width", svgWidth).attr("height", svgHeight);

        const centerX: number = Math.max(containerWidth / 2, treeWidth / 2);
        const rootOffsetX: number = centerX - contentWidth / 2;

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

        // Draw links with path highlighting
        const link = g
            .selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link fill-none")
            .attr("stroke", (d: d3.HierarchyLink<TransformedNode>) => {
                const isPathLink =
                    d.source.data.isOnPath && d.target.data.isOnPath;
                return isPathLink ? "#ef4444" : "#d1d5db";
            })
            .attr("stroke-width", (d: d3.HierarchyLink<TransformedNode>) => {
                const isPathLink =
                    d.source.data.isOnPath && d.target.data.isOnPath;
                return isPathLink ? 4 : 2;
            })
            .attr("d", (d: d3.HierarchyLink<TransformedNode>) => {
                const source = d.source;
                const target = d.target;
                const midY: number =
                    (source.y as number) +
                    ((target.y as number) - (source.y as number)) / 2;
                return `M${source.x},${source.y}
                L${source.x},${midY}
                L${target.x},${midY}
                L${target.x},${target.y}`;
            });

        // Draw nodes
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

        // Add containers for leaf nodes with multiple classes
        const leafNodes = node.filter(
            (d: d3.HierarchyNode<TransformedNode>) => d.data.type === "leaf"
        );
        const splitNodes = node.filter(
            (d: d3.HierarchyNode<TransformedNode>) => d.data.type === "split"
        );

        // Handle split nodes (decision nodes)
        splitNodes
            .append("rect")
            .attr("width", 110)
            .attr("height", 35)
            .attr("x", -55)
            .attr("y", -17.5)
            .attr("rx", 6)
            .attr("fill", (d: d3.HierarchyNode<TransformedNode>) => {
                if (d.data.isCurrentNode) return "#fca5a5";
                if (d.data.isOnPath) return "#fed7d7";
                return "#f8fafc";
            })
            .attr("stroke", (d: d3.HierarchyNode<TransformedNode>) => {
                if (d.data.isCurrentNode) return "#ef4444";
                if (d.data.isOnPath) return "#f87171";
                return "#cbd5e1";
            })
            .attr("stroke-width", (d: d3.HierarchyNode<TransformedNode>) => {
                return d.data.isCurrentNode ? 3 : 2;
            })
            .style("cursor", "pointer");

        // Handle leaf nodes with multiple class segments
        leafNodes.each(function (d: d3.HierarchyNode<TransformedNode>) {
            const nodeGroup = d3.select(this);
            const distribution: ClassDistribution[] = getClassDistribution(d);
            const totalWidth: number = 90;
            const leafHeight: number = 40;

            if (distribution.length === 0) return;

            let currentX: number = -totalWidth / 2;

            // Add background for path highlighting
            if (d.data.isOnPath) {
                nodeGroup
                    .append("rect")
                    .attr("width", totalWidth + 6)
                    .attr("height", leafHeight + 6)
                    .attr("x", -totalWidth / 2 - 3)
                    .attr("y", -leafHeight / 2 - 3)
                    .attr("rx", 8)
                    .attr("fill", d.data.isCurrentNode ? "#ef4444" : "#f87171")
                    .attr("opacity", 0.3);
            }

            // Create segments for each class
            distribution.forEach(
                (classInfo: ClassDistribution, index: number) => {
                    const segmentWidth: number = Math.max(
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
                        .attr("ry", index === 0 ? 6 : 0)
                        .attr("fill", colorScale(classInfo.class))
                        .attr("stroke", "#ffffff")
                        .attr("stroke-width", 1);

                    // Add class label if segment is wide enough
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
                nodeGroup
                    .select("rect:last-of-type")
                    .attr("rx", 6)
                    .attr("ry", 6);
            }

            // Add sample count
            nodeGroup
                .append("text")
                .attr("y", 10)
                .attr("text-anchor", "middle")
                .attr("font-size", "8px")
                .attr("fill", "white")
                .text(`n=${d.data.samples}`);
        });

        node.style("cursor", "pointer")
            .on(
                "mouseover",
                function (
                    event: MouseEvent,
                    d: d3.HierarchyNode<TransformedNode>
                ) {
                    d3.select(this).selectAll("rect").attr("stroke-width", 3);

                    let tooltipContent: string = `<div class="font-semibold text-base mb-2">${
                        d.data.type === "leaf" ? "Leaf Node" : "Decision Node"
                    }</div>`;
                    tooltipContent += `<div class="text-sm">Samples: ${d.data.samples}</div>`;
                    tooltipContent += `<div class="text-sm">Impurity: ${d.data.impurity.toFixed(
                        4
                    )}</div>`;

                    if (d.data.type === "split") {
                        tooltipContent += `<div class="text-sm">Feature: ${d.data.feature}</div>`;
                        tooltipContent += `<div class="text-sm">Threshold: ${d.data.threshold?.toFixed(
                            3
                        )}</div>`;

                        const pointValue = points[d.data.feature || ""];

                        const threshold = d.data.threshold || 0;
                        if (pointValue !== undefined) {
                            tooltipContent += `<div class="pt-2 text-sm font-semibold">Point's ${
                                d.data.feature
                            }: ${pointValue.toFixed(3)} ${
                                pointValue <= threshold ? "<=" : ">"
                            } ${threshold.toFixed(3)}</div>`;
                            tooltipContent += `<div class="text-sm">${
                                pointValue <= threshold ? "True" : "False"
                            }</div>`;
                        }
                    } else if (d.data.value) {
                        tooltipContent += `<div class="mt-2 text-sm font-semibold">Class Distribution:</div>`;
                        const distribution: ClassDistribution[] =
                            getClassDistribution(d);
                        distribution.forEach((classInfo: ClassDistribution) => {
                            tooltipContent += `<div class="flex items-center mt-1">
              <div class="w-3 h-3 rounded mr-2 text-sm" style="background-color: ${colorScale(
                  classInfo.class
              )}"></div>
              <span class="text-sm">${
                  classInfo.class
              }: ${classInfo.percentage.toFixed(1)}%</span>
            </div>`;
                        });
                    }

                    tooltip
                        .html(tooltipContent)
                        .style("background-color", "white")
                        .style("color", "black")
                        .style("opacity", 0.8)
                        .style("left", event.pageX + 15 + "px")
                        .style("top", event.pageY - 10 + "px");
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

        splitNodes
            .append("text")
            .attr("text-anchor", "middle")
            .attr("font-size", "9px")
            .attr("font-weight", "bold")
            .attr("fill", "#374151")
            .each(function (d: d3.HierarchyNode<TransformedNode>) {
                const text = d3.select(this);
                const feature: string = d.data.feature || "Split";
                const threshold: string = d.data.threshold?.toFixed(2) || "N/A";

                text.append("tspan")
                    .attr("x", 0)
                    .attr("dy", "-0.3em")
                    .text(
                        feature.length > 12
                            ? feature.substring(0, 10) + "..."
                            : feature
                    );

                text.append("tspan")
                    .attr("x", 0)
                    .attr("dy", "1.2em")
                    .attr("font-size", "8px")
                    .attr("fill", "#6b7280")
                    .text(`<= ${threshold}`);
            });

        link.each(function (d: d3.HierarchyLink<TransformedNode>) {
            const linkGroup = d3.select(this.parentNode as unknown as string);
            const isLeftChild: boolean = (d.target.parent &&
                d.target.parent.children &&
                d.target.parent.children[0] === d.target) as boolean;

            // Capture the link data for use in the text styling
            const linkData = d;

            linkGroup
                .append("text")
                .attr("x", (d.target.x as number) + (isLeftChild ? -12 : 12))
                .attr(
                    "y",
                    (d.source.y as number) +
                        ((d.target.y as number) - (d.source.y as number)) / 2
                )
                .attr("text-anchor", "middle")
                .attr("font-size", "8px")
                .attr("font-weight", "bold")
                .attr("fill", () => {
                    const isPathLink =
                        linkData.source.data.isOnPath &&
                        linkData.target.data.isOnPath;
                    return isPathLink ? "#ef4444" : "#6b7280";
                })
                .text(isLeftChild ? "T" : "F");
        });

        if (treeWidth > containerWidth) {
            const scrollLeft: number = Math.max(
                0,
                (treeWidth - containerWidth) / 2
            );
            if (containerRef.current) {
                containerRef.current.scrollLeft = scrollLeft;
            }
        }

        // Cleanup tooltip on component unmount
        return () => {
            tooltip.remove();
        };
    }, [treeData, currentDepth, colorScale, predictionPath, points]);

    const handleDepthChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ): void => {
        setCurrentDepth(parseInt(e.target.value));
    };

    const getCurrentPrediction = (): string => {
        if (predictionPath.length === 0) return "No prediction";

        const currentNode =
            predictionPath[Math.min(currentDepth, predictionPath.length - 1)];

        if (
            currentNode.type === "leaf" &&
            currentNode.value &&
            currentNode.value[0]
        ) {
            const maxIndex = currentNode.value[0].indexOf(
                Math.max(...currentNode.value[0])
            );
            return treeData.classes[maxIndex];
        }

        return "Traversing...";
    };

    const isCurrentPredictionComplete = (): boolean => {
        if (predictionPath.length === 0) return false;

        const currentNode =
            predictionPath[Math.min(currentDepth, predictionPath.length - 1)];

        if (
            currentNode.type === "leaf" &&
            currentNode.value &&
            currentNode.value[0]
        ) {
            return true;
        }

        return false;
    };

    return (
        <div className="w-full h-full min-h-0 rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 flex-shrink-0">
                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Prediction Step: {currentDepth} /{" "}
                        {predictionPath.length - 1}
                    </label>
                    <input
                        type="range"
                        min="0"
                        max={Math.max(0, predictionPath.length - 1)}
                        value={currentDepth}
                        onChange={handleDepthChange}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="mb-3 p-2 bg-gray-100 rounded">
                    <div className="text-sm font-medium text-gray-700">
                        Current Prediction:{" "}
                        {isCurrentPredictionComplete() ? (
                            <span className="font-bold text-gray-800">
                                {getCurrentPrediction()}
                            </span>
                        ) : (
                            <span className="font-light text-gray-500">
                                {getCurrentPrediction()}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                        {treeData.classes.map(
                            (className: string, _index: number) => (
                                <div
                                    key={className}
                                    className="flex items-center space-x-1"
                                >
                                    <div
                                        className="w-2.5 h-2.5 rounded"
                                        style={{
                                            backgroundColor:
                                                colorScale(className),
                                        }}
                                    ></div>
                                    <span className="text-xs text-gray-600 font-medium">
                                        {className}
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            <div
                ref={containerRef}
                className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-white min-h-0"
            >
                <svg
                    ref={svgRef}
                    className="block"
                ></svg>
            </div>

            <div className="p-2 border-t bg-gray-50 text-xs text-gray-600 flex-shrink-0">
                <p>
                    <strong>Red path:</strong> Prediction journey •{" "}
                    <strong>Current node:</strong> Highlighted in red • Use
                    slider to step through prediction
                </p>
            </div>
        </div>
    );
};

export default DecisionTreePredictVisualization;
