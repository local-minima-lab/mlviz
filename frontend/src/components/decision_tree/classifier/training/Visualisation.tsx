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
                    : node.feature,
            type: node.type,
            samples: node.samples,
            impurity: node.impurity,
            depth,
            children: [] as any[],
            feature: node.type === "split" ? node.feature : undefined,
            threshold: node.type === "split" ? node.threshold : undefined,
            value: node.value || undefined,
            histogram_data: node.histogram_data,
        };

        // Always include children - the framework will handle the filtering
        if (node.type === "split") {
            transformed.children.push(
                transformTreeData(node.left, depth + 1),
                transformTreeData(node.right, depth + 1)
            );
        }

        return transformed;
    };

    useEffect(() => {
        const calculateMaxDepth = (
            node: TreeNode,
            depth: number = 0
        ): number => {
            if (node.type === "leaf") return depth;
            return Math.max(
                calculateMaxDepth(node.left, depth + 1),
                calculateMaxDepth(node.right, depth + 1)
            );
        };

        const calculatedMaxDepth = calculateMaxDepth(treeData.tree);
        setMaxDepth(calculatedMaxDepth);
    }, [treeData]);

    return (
        <BaseDecisionTreeVisualization
            data={treeData}
            transformTreeData={transformTreeData}
            maxDepth={maxDepth}
            showPlayControls={true}
            renderFunction={renderTrainingDecisionTree}
        />
    );
};

export default Visualisation;
