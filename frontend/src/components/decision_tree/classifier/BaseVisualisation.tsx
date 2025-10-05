import BaseVisualisation from "@/components/visualisation/BaseVisualisation";
import type { TreeNode } from "@/types/model";
import * as d3 from "d3";
import { useCallback } from "react";

import type { VisualisationRenderContext } from "@/components/visualisation/types";
import type { RenderVisualisationProps } from "./types";

interface BaseDecisionTreeVisualizationProps {
    data: Record<string, any>;
    points?: Record<string, number>;
    transformTreeData: (node: TreeNode, depth?: number) => any;
    getTooltipContent?: (d: any) => string;
    topControls?: React.ReactNode;
    bottomInfo?: React.ReactNode;
    nodeStyleConfig?: {
        pathLineColor?: string;
        pathFillColor?: string;
    };
    currentDepth?: number;
    maxDepth?: number;
    maxDisplayDepth?: number;
    onDepthChange?: (depth: number) => void;
    showPlayControls?: boolean;
    onNodeHover?: (d: any, event: any) => void;
    renderFunction: ({
        container,
        data,
        context,
        props,
    }: RenderVisualisationProps) => void;
}

const BaseDecisionTreeVisualization: React.FC<
    BaseDecisionTreeVisualizationProps
> = ({
    data,
    transformTreeData,
    getTooltipContent,
    topControls,
    bottomInfo,
    nodeStyleConfig = {},
    maxDepth = 5,
    maxDisplayDepth,
    onDepthChange,
    showPlayControls = false,
    renderFunction,
}) => {
    const { pathLineColor, pathFillColor } = nodeStyleConfig;

    const colorScale = d3
        .scaleOrdinal<string>()
        .domain(data?.classes || [])
        .range(d3.schemeDark2.slice(0, (data?.classes || []).length));

    const renderCallback = useCallback(
        (
            container: d3.Selection<SVGGElement, unknown, null, undefined>,
            treeData: any,
            context: VisualisationRenderContext
        ) => {
            const renderProps = {
                transformTreeData,
                getTooltipContent,
                pathLineColor,
                pathFillColor,
                colorScale,
            };

            return renderFunction({
                container,
                data: treeData,
                context,
                props: renderProps,
            });
        },
        [
            transformTreeData,
            getTooltipContent,
            pathLineColor,
            pathFillColor,
            colorScale,
        ]
    );

    const calculateMaxDepth = (node: TreeNode, depth = 0): number => {
        if (node.type === "leaf") return depth;
        const leftDepth = node.left
            ? calculateMaxDepth(node.left, depth + 1)
            : depth;
        const rightDepth = node.right
            ? calculateMaxDepth(node.right, depth + 1)
            : depth;
        return Math.max(leftDepth, rightDepth);
    };

    const actualMaxDepth = data?.tree ? calculateMaxDepth(data.tree) : maxDepth;
    const playableMaxSteps =
        (maxDisplayDepth !== undefined ? maxDisplayDepth : actualMaxDepth) + 1;
    const capabilities = {
        ...(showPlayControls && {
            playable: {
                maxSteps: playableMaxSteps,
                stepDuration: 1500, // Slower animations for better visibility
                showSlider: true,
                interpolationSteps: 60, // Smoother animations (higher = smoother)
                autoPlay: false, // Start paused so user can control
            },
        }),
        zoomable: {
            scaleExtent: [0.1, 3] as [number, number],
            enableReset: true,
            enablePan: true,
            panMargin: 50,
        },
    };

    if (!data) return null;

    return (
        <BaseVisualisation
            dataConfig={{
                data,
                renderContent: renderCallback,
            }}
            capabilities={capabilities}
            controlsConfig={{
                controlsPosition: "top-left",
                controlsStyle: "overlay",
            }}
            layoutConfig={{
                topControls,
                bottomInfo,
            }}
            eventHandlers={{
                onStepChange: onDepthChange,
            }}
        />
    );
};

export default BaseDecisionTreeVisualization;
