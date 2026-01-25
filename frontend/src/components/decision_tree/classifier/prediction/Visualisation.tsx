import BaseDecisionTreeVisualization from "@/components/decision_tree/classifier/BaseVisualisation";
import { renderDecisionTree } from "@/components/decision_tree/classifier/DecisionTreeRenderer";
import type { RenderVisualisationProps } from "@/components/decision_tree/classifier/types";

import type { PredictionProps, TreeNode } from "@/types/model";
import { useEffect, useState } from "react";

interface VisualisationProps extends PredictionProps {
    pathLineColor?: string;
    pathFillColor?: string;
}

export const renderPredictionDecisionTree = (
    props: RenderVisualisationProps
) => {
    return renderDecisionTree({ ...props, mode: "prediction" });
};

const Visualisation: React.FC<VisualisationProps> = ({
    data,
    points,
    pathLineColor,
    pathFillColor,
}) => {
    
    if (!data) {
        return (
            <div className="text-center p-8">
                <p className="text-muted-foreground">
                    No model data available. Please train a model or build a manual tree first.
                </p>
            </div>
        );
    }

    if (!points) {
        points = Object.fromEntries(
            data.model_metadata.feature_names.map((x: string) => [x, 0])
        );
    }

    const [currentDepth, setCurrentDepth] = useState(0);
    const [predictionPath, setPredictionPath] = useState<TreeNode[]>([]);

    const calculatePredictionPath = (
        node: TreeNode,
        path: TreeNode[] = []
    ): TreeNode[] => {
        const newPath = [...path, node];
        if (node.type === "leaf") return newPath;

        // Type narrowing: node is now SplitNode
        if (node.threshold === null || node.threshold === undefined) return newPath;
        const featureValue = points[node.feature];
        if (featureValue === undefined) return newPath;

        const goLeft = featureValue <= node.threshold;
        const nextNode = goLeft ? node.left : node.right;
        if (!nextNode) return newPath;
        return calculatePredictionPath(nextNode, newPath);
    };

    const transformTreeData = (
        node: TreeNode,
        depth: number = 0,
        animationDepth?: number
    ) => {
        // Use animationDepth from framework, fallback to currentDepth for backward compatibility
        const activeDepth =
            animationDepth !== undefined ? animationDepth : currentDepth;
        const pathUpToCurrentDepth = new Set(
            predictionPath.slice(0, activeDepth + 1)
        );
        return transformTreeDataWithPath(
            node,
            depth,
            pathUpToCurrentDepth,
            activeDepth
        );
    };

    const transformTreeDataWithPath = (
        node: TreeNode,
        depth: number,
        pathNodes: Set<TreeNode>,
        currentPathDepth: number
    ) => {
        const isOnPath = pathNodes.has(node);
        const isCurrentNode = isOnPath && depth === currentPathDepth;

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
            isOnPath,
            isCurrentNode,
            feature: node.type === "split" ? node.feature : undefined,
            threshold: node.type === "split" ? node.threshold : undefined,
            value: node.value || undefined,
            histogram_data: (node as any).histogram_data,
        };

        if (node.type === "split") {
            if (node.left) {
                transformed.children.push(
                    transformTreeDataWithPath(
                        node.left,
                        depth + 1,
                        pathNodes,
                        currentPathDepth
                    )
                );
            }
            if (node.right) {
                transformed.children.push(
                    transformTreeDataWithPath(
                        node.right,
                        depth + 1,
                        pathNodes,
                        currentPathDepth
                    )
                );
            }
        }

        return transformed;
    };

    const getTooltipContent = (d: any) => {
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

            const pointValue = points[d.data.feature || ""];
            const threshold = d.data.threshold || 0;
            if (pointValue !== undefined) {
                content += `<div class="pt-2 text-sm font-semibold">Point's ${
                    d.data.feature
                }: ${pointValue.toFixed(3)} ${
                    pointValue <= threshold ? "<=" : ">"
                } ${threshold.toFixed(3)}</div>`;
                content += `<div class="text-sm">${
                    pointValue <= threshold ? "True" : "False"
                }</div>`;
            }
        }

        return content;
    };

    useEffect(() => {
        const path = calculatePredictionPath(data.tree);
        setPredictionPath(path);
        setCurrentDepth(0);
    }, [data, points]);

    const handleDepthChange = (newDepth: number) => {
        setCurrentDepth(newDepth);
    };

    return (
        <BaseDecisionTreeVisualization
            data={{ ...data, classes: data.metadata?.class_names || [] }}
            points={points}
            nodeStyleConfig={{
                pathLineColor,
                pathFillColor,
            }}
            transformTreeData={transformTreeData}
            getTooltipContent={getTooltipContent}
            currentDepth={currentDepth}
            maxDepth={Math.max(0, predictionPath.length - 1)}
            maxDisplayDepth={Math.max(0, predictionPath.length - 1)} // Limit to prediction path length
            onDepthChange={handleDepthChange}
            showPlayControls={true}
            renderFunction={renderPredictionDecisionTree}
        />
    );
};

export default Visualisation;
