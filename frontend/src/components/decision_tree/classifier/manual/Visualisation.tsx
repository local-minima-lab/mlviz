import BaseDecisionTreeVisualization from "@/components/decision_tree/classifier/BaseVisualisation";
import { renderDecisionTree } from "@/components/decision_tree/classifier/DecisionTreeRenderer";
import type { RenderVisualisationProps } from "@/components/decision_tree/classifier/types";
import { useDecisionTree } from "@/contexts/models/DecisionTreeContext";
import type { TreeNode } from "@/types/model";
import { useCallback, useEffect } from "react";

const Visualisation: React.FC = () => {
    const {
        manualTree,
        getFeatureNames,
        getClassNames,
    } = useDecisionTree();


    useEffect(() => {
        manualTree.initialize();
    }, []);

    // All hooks must be called before any early returns
    useEffect(() => {
        console.log('[ManualTree] useEffect - manualTree:', manualTree.tree);
        if (!manualTree.tree) {
            console.log('[ManualTree] Initializing manual tree');
            manualTree.initialize();
        }
    }, [manualTree]);
    
    const handleNodeClick = useCallback((path: number[]) => {
        console.log('[ManualTree] handleNodeClick called with path:', path);
        manualTree.selectNode(path);
    }, [manualTree]);
    
    const renderManualDecisionTree = useCallback((props: RenderVisualisationProps) => {
        console.log('[ManualTree] renderManualDecisionTree called');
        console.log('[ManualTree] Props:', props);
        console.log('[ManualTree] Selected path:', manualTree.selectedNodePath);
        console.log('[ManualTree] Feature stats:', manualTree.featureStats);
        
        // Add manual-specific props to the render props
        const enhancedProps = {
            ...props.props,
            selectedNodePath: manualTree.selectedNodePath,
            featureNames: getFeatureNames() || [],
            featureStats: manualTree.featureStats,
            selectedFeature: manualTree.selectedFeature,
            selectedThreshold: manualTree.selectedThreshold,
            manualCallbacks: {
                onNodeClick: handleNodeClick,
                onFeatureSelect: manualTree.loadFeatureStats,
                onThresholdChange: manualTree.updateThreshold,
                onSplit: manualTree.splitNode,
                onCancel: () => manualTree.selectNode(null),
                onMarkAsLeaf: manualTree.markAsLeaf,
            },
        };
        
        console.log('[ManualTree] Enhanced props:', enhancedProps);
        
        return renderDecisionTree({ 
            ...props, 
            props: enhancedProps,
            mode: "manual" 
        });
    }, [manualTree, getFeatureNames, handleNodeClick]);
    
    // Define transformTreeData before early return (hooks must be called in same order)
    const transformTreeData = useCallback((node: TreeNode, depth = 0): any => {
        const base = {
            name: node.type === 'leaf' ? 'Leaf' : node.feature,
            type: node.type,
            samples: node.samples,
            impurity: node.impurity,
            depth,
            feature: node.feature,
            threshold: node.threshold,
            value: node.value,
            histogram_data: node.histogram_data || null, // Include histogram data for split nodes
            terminal: node.terminal || false, // Include terminal flag
        };
        
        if (node.type === 'split' && node.left && node.right) {
            return {
                ...base,
                children: [
                    transformTreeData(node.left, depth + 1),
                    transformTreeData(node.right, depth + 1),
                ],
            };
        }
        
        return base;
    }, []);
    
    // Early return after all hooks
    console.log('[ManualTree] Render - manualTree:', manualTree.tree);
    if (!manualTree.tree) {
        console.log('[ManualTree] No tree yet, returning empty');
        return <></>;
    }
    
    return (
        <BaseDecisionTreeVisualization
            data={{ tree: manualTree.tree, classes: getClassNames() || [] }}
            transformTreeData={transformTreeData}
            renderFunction={renderManualDecisionTree}
            clickableSelector=".node"
        />
    );
};

export default Visualisation;
