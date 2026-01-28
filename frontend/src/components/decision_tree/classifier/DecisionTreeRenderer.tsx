import { type RenderVisualisationProps } from "@/components/decision_tree/classifier/types";
import { applyFont } from "@/components/visualisation/config/fonts";
import {
    calculateInterpolationFactor,
    getRevealClipPath,
    isElementVisible,
} from "@/components/visualisation/utils/interpolationUtils";
import * as d3 from "d3";
import {
    addNodeInteractions,
    getClassDistribution,
    renderExpandableLeafNode,
    renderInlineEditor,
    renderIntegratedSplitNode,
    renderLeafNode,
    setupTooltip,
    type TransformedNode,
} from "./rendererUtils";

interface RenderMode {
    name: "training" | "prediction" | "manual";
    // Responsible for checking what nodes are visible
    getVisibleNodes: (
        root: d3.HierarchyNode<TransformedNode>,
        currentStep: number,
        context: any
    ) => d3.HierarchyNode<TransformedNode>[];
    // Responsible for checking what links are visible
    getVisibleLinks: (
        root: d3.HierarchyNode<TransformedNode>,
        currentStep: number,
        context: any
    ) => d3.HierarchyLink<TransformedNode>[];
    // Responsible for applying node styles. Used to add interpolation
    applyNodeStyles: (
        node: d3.Selection<
            d3.BaseType,
            d3.HierarchyNode<TransformedNode>,
            SVGGElement,
            unknown
        >,
        currentStep: number,
        context: any
    ) => void;
    // Responsible for applying link styles. Used to add interpolation
    applyLinkStyles: (
        links: d3.Selection<
            d3.BaseType,
            d3.HierarchyLink<TransformedNode>,
            SVGGElement,
            unknown
        >,
        visibleNodes: d3.HierarchyNode<TransformedNode>[],
        currentStep: number,
        pathLineColor: string,
        onPathColor: string | undefined,
        context: any
    ) => void;
    // Responsible for applying link label styles. Used to add interpolation
    applyLinkLabelStyles: (
        labels: d3.Selection<
            d3.BaseType,
            d3.HierarchyLink<TransformedNode>,
            SVGGElement,
            unknown
        >,
        pathLineColor: string,
        onPathColor?: string
    ) => void;
}

const TRAINING_MODE: RenderMode = {
    name: "training",
    getVisibleNodes: (root, _currentStep, context) =>
        root.descendants().filter((d) => isElementVisible(d.depth, context)),
    getVisibleLinks: (root, _currentStep, context) =>
        root.links().filter((d) => isElementVisible(d.target.depth, context)),
    applyNodeStyles: (node, _currentStep, context) => {
        node.style("clip-path", (d) => {
            const factor = calculateInterpolationFactor(d.depth, context);
            return getRevealClipPath(factor);
        });
    },
    applyLinkStyles: (
        links,
        _visibleNodes,
        _currentStep,
        pathLineColor,
        _onPathColor,
        context
    ) => {
        links
            .attr("stroke", pathLineColor)
            .attr("opacity", 1)
            .style("clip-path", (d) => {
                const factor = calculateInterpolationFactor(
                    d.target.depth,
                    context
                );
                return getRevealClipPath(factor);
            });
    },
    applyLinkLabelStyles: (labels, pathLineColor) => {
        labels
            .call(applyFont.family)
            .call(applyFont.weight.bold)
            .call(applyFont.size.small)
            .attr("fill", pathLineColor);
    },
};

const PREDICTION_MODE: RenderMode = {
    name: "prediction",
    getVisibleNodes: (root) => {
        return root.descendants();
    },
    getVisibleLinks: (root) => {
        return root.links();
    },
    applyNodeStyles: (node) => {
        node.style("opacity", 1).style("clip-path", "none");
    },
    applyLinkStyles: (
        links,
        _visibleNodes,
        _currentStep,
        pathLineColor,
        onPathColor,
        context
    ) => {
        links
            .attr("stroke", onPathColor || pathLineColor)
            .attr("stroke-width", 3)
            .attr("opacity", 1)
            .style("clip-path", (d) => {
                const factor = calculateInterpolationFactor(
                    d.target.depth,
                    context
                );
                const revealPercent = factor * 100;
                return `inset(0 0 ${100 - revealPercent}% 0)`;
            });
    },
    applyLinkLabelStyles: (labels, pathLineColor, onPathColor) => {
        labels
            .attr("fill", (d) => {
                return d.source.data.isOnPath && d.target.data.isOnPath
                    ? onPathColor || pathLineColor
                    : pathLineColor;
            })
            .attr("font-weight", (d) => {
                return d.source.data.isOnPath && d.target.data.isOnPath
                    ? "bold"
                    : "normal";
            })
            .attr("opacity", (d) => {
                return d.source.data.isOnPath && d.target.data.isOnPath
                    ? 1
                    : 0.7;
            });
    },
};

const calculateLinkPath = (d: d3.HierarchyLink<TransformedNode>): string => {
    const source = d.source;
    const target = d.target;
    const linePadding = 8;

    let sourceY = source.y as number;
    let targetY = target.y as number;

    if (source.data.type === "split") {
        sourceY = (source.y as number) + 60 + linePadding;
    }

    if (target.data.type === "split") {
        targetY = (target.y as number) - 60 - linePadding;
    } else if (target.data.type === "leaf") {
        targetY = (target.y as number) - 40 - linePadding;
    }

    return `M${source.x},${sourceY}L${target.x},${targetY}`;
};

const calculateLinkLabelPosition = (d: d3.HierarchyLink<TransformedNode>) => {
    const isLeftChild = d.source.children && d.source.children[0] === d.target;
    const linePadding = 8;

    let sourceYForLabel = d.source.y as number;
    let targetYForLabel = d.target.y as number;

    if (d.source.data.type === "split") {
        sourceYForLabel = (d.source.y as number) + 60 + linePadding;
    }

    if (d.target.data.type === "split") {
        targetYForLabel = (d.target.y as number) - 60 - linePadding;
    } else if (d.target.data.type === "leaf") {
        targetYForLabel = (d.target.y as number) - 20 - linePadding;
    }

    return {
        x:
            ((d.source.x || 0) + (d.target.x || 0)) / 2 +
            (isLeftChild ? -30 : 30),
        y: (sourceYForLabel + targetYForLabel) / 2 - 5,
        isLeftChild,
    };
};

const generateLinkLabelText = (
    d: d3.HierarchyLink<TransformedNode>,
    isLeftChild: boolean | undefined
): string => {
    const sourceNode = d.source.data;
    const threshold = sourceNode.threshold;

    if (sourceNode.type === "split" && threshold !== undefined) {
        return isLeftChild
            ? `≤ ${threshold.toFixed(2)}`
            : `> ${threshold.toFixed(2)}`;
    }
    return isLeftChild ? "T" : "F";
};

const MANUAL_MODE: RenderMode = {
    name: "manual",
    getVisibleNodes: (root) => root.descendants(),
    getVisibleLinks: (root) => root.links(),
    applyNodeStyles: (node) => {
        node.style("opacity", 1).style("clip-path", "none");
    },
    applyLinkStyles: (links, _visibleNodes, _currentStep, pathLineColor) => {
        links.attr("stroke", pathLineColor).attr("opacity", 1);
    },
    applyLinkLabelStyles: (labels, pathLineColor) => {
        labels.attr("fill", pathLineColor);
    },
};

export const renderDecisionTree = ({
    container,
    data,
    context,
    props,
    mode,
}: RenderVisualisationProps & { mode: "training" | "prediction" | "manual" }) => {
    console.log('[DecisionTreeRenderer] renderDecisionTree called with mode:', mode);
    console.log('[DecisionTreeRenderer] Props:', props);
    console.log('[DecisionTreeRenderer] Data:', data);
    
    const {
        transformTreeData,
        getTooltipContent,
        pathLineColor = "#cbcbcbff",
        onPathColor = "#1b1b1bff",
        colorScale: externalColorScale,
    } = props;

    const { dimensions, state } = context;
    const { width, height, margin } = dimensions;
    const { currentStep = 0 } = state;

    console.log('[DecisionTreeRenderer] data.classes:', data.classes);
    // Use external color scale if provided (which should always be the case from BaseVisualisation)
    const colorScale = externalColorScale || ((_className: string) => '#cccccc');
    
    console.log('[DecisionTreeRenderer] Color scale initialized');


    const root = d3.hierarchy(transformTreeData(data.tree, 0, currentStep));
    const contentWidth = width - margin.left - margin.right;
    const contentHeight = height - margin.top - margin.bottom;

    const treeLayout = d3
        .tree<TransformedNode>()
        .size([contentWidth * 1.2, contentHeight * 1.5])
        .separation((a, b) => (a.parent === b.parent ? 2 : 3));
    treeLayout(root);

    const depthSpacing = 200;
    root.descendants().forEach((d) => {
        const nodeHeight = d.data.type === "split" ? 50 : 20;
        d.y = d.depth * depthSpacing + nodeHeight / 2;
    });

    const renderMode =
        mode === "training"
            ? TRAINING_MODE
            : mode === "prediction"
              ? PREDICTION_MODE
              : MANUAL_MODE;

    const visibleNodes = renderMode.getVisibleNodes(root, currentStep, context);
    const visibleLinks = renderMode.getVisibleLinks(root, currentStep, context);

    const tooltip = setupTooltip();

    const node = container
        .selectAll(".node")
        .data(visibleNodes)
        .join("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

    renderMode.applyNodeStyles(node, currentStep, context);

    const leafNodes = node.filter((d) => d.data.type === "leaf");
    const splitNodes = node.filter((d) => d.data.type === "split");

    splitNodes.each(function (d) {
        const nodeGroup = d3.select(this as SVGGElement) as d3.Selection<
            SVGGElement,
            d3.HierarchyNode<TransformedNode>,
            null,
            undefined
        >;
        const distribution = getClassDistribution(d, data.classes || []);

        // Add interpolation factor for path highlighting
        const interpolationFactor = d.data.isOnPath
            ? calculateInterpolationFactor(d.depth, context)
            : 0;

        console.log("colorScale", externalColorScale)
        renderIntegratedSplitNode(
            nodeGroup,
            d,
            distribution,
            120,
            externalColorScale,
            interpolationFactor
        );
        
        // In manual mode, add click handler for split nodes
        if (mode === "manual" && props.manualCallbacks?.onNodeClick) {
            // Calculate node path
            const nodePath: number[] = [];
            let current = d;
            while (current.parent) {
                const siblings = current.parent.children || [];
                const index = siblings.indexOf(current);
                nodePath.unshift(index);
                current = current.parent;
            }
            
            // Check if this node is selected
            const isSelected = props.selectedNodePath && 
                              props.selectedNodePath.length === nodePath.length &&
                              props.selectedNodePath.every((val, idx) => val === nodePath[idx]);
            
            // Add click handler if not selected
            if (!isSelected) {
                nodeGroup
                    .style('cursor', 'pointer')
                    .on('click', (event) => {
                        event.stopPropagation();
                        console.log('[ManualTree] Split node clicked at depth', d.depth);
                        // Build path to this node
                        const path: number[] = [];
                        let current = d;
                        while (current.parent) {
                            const siblings = current.parent.children || [];
                            const index = siblings.indexOf(current);
                            path.unshift(index);
                            current = current.parent;
                        }
                        console.log('[ManualTree] Calculated path:', path);
                        props.manualCallbacks!.onNodeClick!(path);
                    });
            }
        }
    });

    leafNodes.each(function (d) {
        const nodeGroup = d3.select(this as SVGGElement) as d3.Selection<
            SVGGElement,
            d3.HierarchyNode<TransformedNode>,
            null,
            undefined
        >;
        const distribution = getClassDistribution(d, data.classes || []);

        // In manual mode, render expandable leaf nodes
        if (mode === "manual") {
            // Check if this node is selected
            // Root node has empty path [], child nodes have path like [0] or [1]
            const nodePath: number[] = [];
            let current = d;
            while (current.parent) {
                const siblings = current.parent.children || [];
                const index = siblings.indexOf(current);
                nodePath.unshift(index);
                current = current.parent;
            }
            
            const isSelected = props.selectedNodePath && 
                              props.selectedNodePath.length === nodePath.length &&
                              props.selectedNodePath.every((val, idx) => val === nodePath[idx]);
            
            console.log('[ManualTree] Rendering leaf node - depth:', d.depth, 'path:', nodePath, 'isSelected:', isSelected);
            
            renderExpandableLeafNode(
                nodeGroup,
                d,
                distribution,
                80,
                colorScale,
                isSelected || false
            );
            
            // Add click handler for node selection in manual mode
            if (!isSelected && props.manualCallbacks?.onNodeClick) {
                console.log('[ManualTree] Adding click handler to node at depth', d.depth);
                nodeGroup
                    .style('cursor', 'pointer')
                    .on('click', (event) => {
                        event.stopPropagation();
                        console.log('[ManualTree] Node clicked at depth', d.depth);
                        // Build path to this node
                        const path: number[] = [];
                        let current = d;
                        while (current.parent) {
                            const siblings = current.parent.children || [];
                            const index = siblings.indexOf(current);
                            path.unshift(index);
                            current = current.parent;
                        }
                        console.log('[ManualTree] Calculated path:', path);
                        props.manualCallbacks!.onNodeClick!(path);
                    });
            }
        } else {
            // Add interpolation factor for path highlighting
            const interpolationFactor = d.data.isOnPath
                ? calculateInterpolationFactor(d.depth, context)
                : 0;
            renderLeafNode(
                nodeGroup,
                d,
                distribution,
                80,
                colorScale,
                interpolationFactor
            );
        }
    });

    container
        .selectAll(".link-base")
        .data(visibleLinks)
        .join("path")
        .attr("class", "link-base")
        .attr("d", calculateLinkPath)
        .attr("fill", "none")
        .attr("stroke", pathLineColor)
        .attr("stroke-width", 2)
        .attr("opacity", 0.4);

    const pathLinks = visibleLinks.filter(
        (d) => d.source.data.isOnPath && d.target.data.isOnPath
    );
    const highlightLinks = container
        .selectAll(".link-highlight")
        .data(pathLinks)
        .join("path")
        .attr("class", "link-highlight")
        .attr("d", calculateLinkPath)
        .attr("fill", "none")
        .attr("stroke", onPathColor || pathLineColor)
        .attr("stroke-width", 3)
        .attr("opacity", 1);

    // Apply mode-specific styling to highlight links
    if (mode === "prediction") {
        highlightLinks.style("clip-path", (d) => {
            const factor = calculateInterpolationFactor(
                d.target.depth,
                context
            );
            const revealPercent = factor * 100;
            return `inset(0 0 ${100 - revealPercent}% 0)`;
        });
    } else {
        // For training mode, apply the mode-specific styling
        renderMode.applyLinkStyles(
            highlightLinks,
            visibleNodes,
            currentStep,
            pathLineColor,
            onPathColor,
            context
        );
    }

    const linkLabels = container
        .selectAll(".link-label")
        .data(visibleLinks)
        .join("text")
        .attr("class", "link-label")
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .each(function (d) {
            const position = calculateLinkLabelPosition(d);
            const isLeftChild = position.isLeftChild;
            d3.select(this)
                .attr("x", position.x)
                .attr("y", position.y)
                .text(generateLinkLabelText(d, isLeftChild));
        });

    renderMode.applyLinkLabelStyles(linkLabels, pathLineColor, onPathColor);

    addNodeInteractions(node, tooltip, getTooltipContent);

    // Render inline editor in manual mode when a node is selected
    console.log('[DecisionTreeRenderer] Checking inline editor - mode:', mode, 'selectedNodePath:', props.selectedNodePath);
    // Show editor only if path is not null (null means no selection)
    if (mode === "manual" && props.selectedNodePath !== undefined && props.selectedNodePath !== null) {
        console.log('[DecisionTreeRenderer] Attempting to render inline editor');
        console.log('[DecisionTreeRenderer] Visible nodes:', visibleNodes.length);
        
        const selectedNode = visibleNodes.find(n => {
            // For root node, path is empty array and depth is 0
            // For child nodes, match by depth
            if (props.selectedNodePath!.length === 0) {
                return n.depth === 0;
            }
            return n.depth === props.selectedNodePath!.length;
        });
        
        console.log('[DecisionTreeRenderer] Found selected node:', selectedNode);
        console.log('[DecisionTreeRenderer] Node type:', selectedNode?.data.type);
        console.log('[DecisionTreeRenderer] Feature names:', props.featureNames);
        console.log('[DecisionTreeRenderer] Manual callbacks:', props.manualCallbacks);
        
        // Show editor for both leaf and split nodes (splitting a split node replaces its children)
        if (selectedNode && props.featureNames && props.manualCallbacks) {
            console.log('[DecisionTreeRenderer] Rendering inline editor!');
            renderInlineEditor(
                container,
                selectedNode,
                props.featureNames,
                props.featureStats || null,
                props.selectedFeature || null,
                props.selectedThreshold || null,
                colorScale,
                data.classes || [],
                props.manualCallbacks
            );
        } else {
            console.log('[DecisionTreeRenderer] Not rendering editor - reason:', {
                hasSelectedNode: !!selectedNode,
                nodeType: selectedNode?.data.type,
                hasFeatureNames: !!props.featureNames,
                hasCallbacks: !!props.manualCallbacks
            });
        }
    }
};
