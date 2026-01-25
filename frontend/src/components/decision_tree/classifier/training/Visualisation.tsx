import BaseDecisionTreeVisualization from "@/components/decision_tree/classifier/BaseVisualisation";
import type { TreeNode } from "@/types/model";
import { useEffect, useState } from "react";
import { renderDecisionTree } from "../DecisionTreeRenderer";
import { type RenderVisualisationProps } from "../types";

export const renderTrainingDecisionTree = (props: RenderVisualisationProps) => {
    return renderDecisionTree({ ...props, mode: "training" });
};

interface VisualisationProps {
    data?: Record<string, any>;
}

const Visualisation: React.FC<VisualisationProps> = ({ data: treeData }) => {
    if (!treeData) return <></>;

    const [maxDepth, setMaxDepth] = useState(0);

    const transformTreeData = (
        node: TreeNode,
        depth: number = 0,
        _animationDepth?: number
    ) => {
        const transformed = {
            name:
                node.type === "leaf"
                    ? `Leaf (${node.samples} samples)`
                    : (node as any).feature,
            type: node.type,
            samples: node.samples,
            impurity: node.impurity,
            depth,
            children: [] as any[],
            feature: node.type === "split" ? (node as any).feature : undefined,
            threshold: node.type === "split" ? (node as any).threshold : undefined,
            value: node.value || undefined,
            histogram_data: (node as any).histogram_data,
        };

        // Always include children - the framework will handle the filtering
        if (node.type === "split") {
            const splitNode = node as any;
            if (splitNode.left) {
                transformed.children.push(transformTreeData(splitNode.left, depth + 1));
            }
            if (splitNode.right) {
                transformed.children.push(transformTreeData(splitNode.right, depth + 1));
            }
        }

        return transformed;
    };

    useEffect(() => {
        const calculateMaxDepth = (
            node: TreeNode,
            depth: number = 0
        ): number => {
            if (node.type === "leaf") return depth;
            const splitNode = node as any;
            const leftDepth = splitNode.left ? calculateMaxDepth(splitNode.left, depth + 1) : depth;
            const rightDepth = splitNode.right ? calculateMaxDepth(splitNode.right, depth + 1) : depth;
            return Math.max(leftDepth, rightDepth);
        };

        const calculatedMaxDepth = calculateMaxDepth(treeData.tree);
        setMaxDepth(calculatedMaxDepth);
    }, [treeData]);

    console.log('[Training Visualisation] treeData:', treeData);
    console.log('[Training Visualisation] treeData.metadata:', treeData.metadata);
    console.log('[Training Visualisation] treeData.metadata?.class_names:', treeData.metadata?.class_names);
    
    return (
        <BaseDecisionTreeVisualization
            data={{ ...treeData, classes: treeData.metadata?.class_names || [] }}
            transformTreeData={transformTreeData}
            maxDepth={maxDepth}
            showPlayControls={true}
            renderFunction={renderTrainingDecisionTree}
        />
    );
};

export default Visualisation;
