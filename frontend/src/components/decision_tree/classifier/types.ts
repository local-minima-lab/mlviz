import type { TransformedNode } from "@/components/decision_tree/classifier/rendererUtils";
import type { VisualisationRenderContext } from "@/components/visualisation/types";
import type { TreeNode } from "@/types/model";
import * as d3 from "d3";

export interface ClassDistribution {
    class: string;
    count: number;
    value: number;
    percentage: number;
}

export interface BaseDecisionTreeRenderProps {
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

export interface RenderVisualisationProps {
    container: d3.Selection<SVGGElement, unknown, null, undefined>;
    data: any;
    context: VisualisationRenderContext;
    props: BaseDecisionTreeRenderProps;
}
