/**
 * Decision Tree Model Context
 * Manages state and API interactions for Decision Tree visualizations
 */

import { loadDataset } from "@/api/dataset";
import {
    calculateFeatureStats,
    calculateNodeStats,
    trainModel as initiateTrainModel,
    type DecisionTreeResponse,
} from "@/api/dt";
import type { components } from "@/types/api";
import type { TreeNode } from "@/types/model";
import type { Parameters } from "@/types/story";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

const LOCAL_STORAGE_PARAMS_KEY = "dt_params";

interface DecisionTreeContextType {
    isModelLoading: boolean;
    modelError: string | null;
    currentModelData: DecisionTreeResponse | null;
    lastTrainedParams: Parameters;
    trainNewModel: (params: Parameters) => Promise<void>;
    retrieveStoredModel: () => Promise<void>;
    clearStoredModelParams: () => void;
    // Helper methods for prediction components
    getFeatureNames: () => string[] | null;
    getClassNames: () => string[] | null;
    getModelKey: () => string | null;
    isModelReady: () => boolean;
    // Manual tree building
    manualTree: TreeNode | null;
    selectedNodePath: number[] | null;
    manualFeatureStats: components["schemas"]["ManualFeatureStatsResponse"] | null;
    selectedFeature: string | null;
    selectedThreshold: number | null;
    initializeManualTree: () => void;
    selectManualNode: (path: number[] | null) => void;
    loadManualFeatureStats: (feature: string) => Promise<void>;
    updateManualThreshold: (threshold: number) => void;
    splitManualNode: () => Promise<void>;
    markNodeAsLeaf: () => void;
    canSplitManualNode: () => boolean;
}

const DecisionTreeContext = createContext<DecisionTreeContextType | undefined>(
    undefined
);

/**
 * Props for the DecisionTreeProvider component.
 */
interface DecisionTreeProviderProps {
    children: ReactNode;
}

/**
 * Provides the DecisionTreeContext to its children components.
 * It manages the state and interactions with the Decision Tree API.
 */
export const DecisionTreeProvider: React.FC<DecisionTreeProviderProps> = ({
    children,
}) => {
    const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
    const [modelError, setModelError] = useState<string | null>(null);
    const [currentModelData, setCurrentModelData] =
        useState<DecisionTreeResponse | null>(null);

    const [lastTrainedParams, setLastTrainedParams] = useState<Parameters>(
        () => {
            const storedParams = localStorage.getItem(LOCAL_STORAGE_PARAMS_KEY);
            if (storedParams == null) return {};
            else return JSON.parse(storedParams as string);
        }
    );

    // Manual tree building state
    const [manualTree, setManualTree] = useState<TreeNode | null>(null);
    const [selectedNodePath, setSelectedNodePath] = useState<number[] | null>(null);
    const [manualFeatureStats, setManualFeatureStats] = useState<components["schemas"]["ManualFeatureStatsResponse"] | null>(null);
    const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
    const [selectedThreshold, setSelectedThreshold] = useState<number | null>(null);

    // Helper functions for manual tree manipulation
    const getNodeByPath = useCallback((tree: TreeNode | null, path: number[]): TreeNode | null => {
        if (!tree) return null;
        let current = tree;
        for (const index of path) {
            if (current.type !== 'split') return null;
            current = index === 0 ? current.left! : current.right!;
            if (!current) return null;
        }
        return current;
    }, []);

    const updateNodeAtPath = useCallback((tree: TreeNode, path: number[], updates: Partial<TreeNode>): TreeNode => {
        console.log('[updateNodeAtPath] Called with path:', path, 'updates:', updates);
        console.log('[updateNodeAtPath] Current tree:', tree);
        
        if (path.length === 0) {
            const result = { ...tree, ...updates };
            console.log('[updateNodeAtPath] Updating root node, result:', result);
            return result;
        }
        
        const [index, ...restPath] = path;
        if (tree.type !== 'split') {
            console.log('[updateNodeAtPath] Tree is not split type, returning as-is');
            return tree;
        }
        
        if (index === 0) {
            const updatedLeft = tree.left ? updateNodeAtPath(tree.left, restPath, updates) : tree.left;
            const result = {
                ...tree,
                left: updatedLeft,
            };
            console.log('[updateNodeAtPath] Updated left child, result:', result);
            return result;
        } else {
            const updatedRight = tree.right ? updateNodeAtPath(tree.right, restPath, updates) : tree.right;
            const result = {
                ...tree,
                right: updatedRight,
            };
            console.log('[updateNodeAtPath] Updated right child, result:', result);
            return result;
        }
    }, []);

    const trainNewModel = useCallback(async (params: Parameters = {}) => {
        setIsModelLoading(true);
        setModelError(null);
        try {
            const data: DecisionTreeResponse = await initiateTrainModel(params);

            if (data.success) {
                setCurrentModelData(data);
                setLastTrainedParams(params);
                localStorage.setItem(
                    LOCAL_STORAGE_PARAMS_KEY,
                    JSON.stringify(params)
                );
            } else {
                throw new Error(
                    "Training failed - API returned success: false"
                );
            }
        } catch (error) {
            console.error("Failed to train model:", error);
            setModelError(
                error instanceof Error
                    ? error.message
                    : "Unknown error training model"
            );
            setCurrentModelData(null);
        } finally {
            setIsModelLoading(false);
        }
    }, []);

    const retrieveStoredModel = useCallback(async () => {
        await trainNewModel(lastTrainedParams);
    }, [trainNewModel, lastTrainedParams]);

    const clearStoredModelParams = useCallback(() => {
        localStorage.removeItem(LOCAL_STORAGE_PARAMS_KEY);
        setLastTrainedParams({});
        setCurrentModelData(null);
        setModelError(null);
        setIsModelLoading(false);
    }, []);

    useEffect(() => {
        if (
            !currentModelData &&
            !isModelLoading &&
            Object.keys(lastTrainedParams).length > 0
        ) {
            trainNewModel(lastTrainedParams);
        }
    }, []);

    // Helper functions for prediction components
    const getFeatureNames = useCallback((): string[] | null => {
        if (!currentModelData?.metadata?.feature_names) {
            return null;
        }
        return currentModelData.metadata.feature_names as string[];
    }, [currentModelData]);

    const getClassNames = useCallback((): string[] | null => {
        if (!currentModelData?.classes) {
            return null;
        }
        return currentModelData.classes;
    }, [currentModelData]);

    const getModelKey = useCallback((): string | null => {
        return currentModelData?.model_key || null;
    }, [currentModelData]);

    const isModelReady = useCallback((): boolean => {
        const ready = !!(
            currentModelData?.success &&
            currentModelData?.metadata?.feature_names &&
            currentModelData?.classes
        );

        return ready;
    }, [currentModelData]);

    // Manual tree building functions
    const initializeManualTree = useCallback(async () => {
        console.log('[ManualTree] initializeManualTree called');
        console.log('[ManualTree] currentModelData:', currentModelData);
        
        // If no model data exists, load dataset directly instead of training
        if (!currentModelData) {
            console.log('[ManualTree] No currentModelData, loading dataset...');
            try {
                const datasetResponse = await loadDataset('iris'); // Default to iris
                console.log('[ManualTree] Dataset loaded:', datasetResponse);
                
                // Transform dataset response to match DecisionTreeResponse format
                // Combine X and y into matrix format
                const matrix = datasetResponse.X.map((row, idx) => [
                    ...row,
                    datasetResponse.y[idx]
                ]);
                
                // Create a minimal DecisionTreeResponse-like object for manual tree
                const mockModelData: DecisionTreeResponse = {
                    success: true,
                    model_key: 'manual-tree-dataset',
                    cached: false,
                    metadata: {
                        feature_names: datasetResponse.feature_names,
                    },
                    tree: {
                        type: 'leaf',
                        samples: matrix.length,
                        impurity: 0,
                        value: [[]],
                    },
                    classes: datasetResponse.target_names,
                    matrix: matrix,
                    scores: {
                        accuracy: 0,
                        precision: 0,
                        recall: 0,
                        f1: 0,
                    },
                };
                
                setCurrentModelData(mockModelData);
                // The useEffect will call initializeManualTree again
                return;
            } catch (error) {
                console.error('[ManualTree] Failed to load dataset:', error);
                return;
            }
        }
        
        // Calculate class distribution from dataset
        // The matrix contains features + target, where target is the last column
        const matrix = currentModelData.matrix || [];
        const classes = currentModelData.classes || [];
        const numClasses = classes.length;
        
        console.log('[ManualTree] Dataset info - samples:', matrix.length, 'classes:', classes);
        
        // Count samples per class
        const classCounts = new Array(numClasses).fill(0);
        matrix.forEach(row => {
            const targetValue = row[row.length - 1]; // Last column is the target
            const classIndex = targetValue; // Assuming target is already class index
            if (classIndex >= 0 && classIndex < numClasses) {
                classCounts[classIndex]++;
            }
        });
        
        console.log('[ManualTree] Class counts:', classCounts);
        
        // Convert counts to proportions for the value array
        const totalSamples = matrix.length;
        const classProportions = classCounts.map(count => count / totalSamples);
        
        const rootNode: TreeNode = {
            type: 'leaf',
            samples: totalSamples,
            impurity: 0, // Will be calculated by backend if needed
            value: [classProportions], // Array of proportions for each class
        };
        
        console.log('[ManualTree] Created root node:', rootNode);
        
        setManualTree(rootNode);
        setSelectedNodePath(null);
        setSelectedFeature(null);
        setManualFeatureStats(null);
        setSelectedThreshold(null);
    }, [currentModelData]);

    const selectManualNode = useCallback((path: number[] | null) => {
        setSelectedNodePath(path);
        setSelectedFeature(null);
        setManualFeatureStats(null);
        setSelectedThreshold(null);
    }, []);

    const loadManualFeatureStats = useCallback(async (feature: string) => {
        setSelectedFeature(feature);
        if (!selectedNodePath) return;
        const node = getNodeByPath(manualTree, selectedNodePath);
        if (!node) return;
        
        try {
            const stats = await calculateFeatureStats({
                feature,
                parent_samples_mask: null, // TODO: Get from node when available
                criterion: 'gini',
                max_thresholds: 100,
            });
            setManualFeatureStats(stats);
            setSelectedThreshold(stats.best_threshold);
        } catch (error) {
            console.error('Failed to load feature stats:', error);
        }
    }, [manualTree, selectedNodePath, getNodeByPath]);

    const updateManualThreshold = useCallback((threshold: number) => {
        setSelectedThreshold(threshold);
    }, []);

    const splitManualNode = useCallback(async () => {
        if (!manualTree || !selectedFeature || selectedThreshold === null || !selectedNodePath) return;
        
        const node = getNodeByPath(manualTree, selectedNodePath);
        if (!node) return;
        
        // Allow splitting both leaf and split nodes
        // If it's already a split node, we'll replace its children with new ones
        console.log('[ManualTree] Splitting node of type:', node.type);
        
        try {
            const nodeStats = await calculateNodeStats({
                feature: selectedFeature,
                threshold: selectedThreshold,
                parent_samples_mask: null, // TODO: Get from node when available
                criterion: 'gini',
            });
            
            console.log('[ManualTree] Node stats received:', nodeStats);
            console.log('[ManualTree] Left stats:', nodeStats.split_stats.left_stats);
            console.log('[ManualTree] Right stats:', nodeStats.split_stats.right_stats);
            
            // Convert class_probabilities dictionary to value array
            // The value array should be [[prob_class_0, prob_class_1, ...]]
            const classNames = nodeStats.class_names;
            const leftProbs = classNames.map(className => 
                nodeStats.split_stats.left_stats.class_probabilities[className] || 0
            );
            const rightProbs = classNames.map(className => 
                nodeStats.split_stats.right_stats.class_probabilities[className] || 0
            );
            
            console.log('[ManualTree] Left probabilities:', leftProbs);
            console.log('[ManualTree] Right probabilities:', rightProbs);
            
            // Create split node with left and right children
            const splitNode: TreeNode = {
                type: 'split',
                feature: selectedFeature,
                threshold: selectedThreshold,
                samples: node.samples,
                impurity: nodeStats.split_stats.parent_stats.impurity,
                value: node.value,
                histogram_data: nodeStats.histogram_data,
                left: {
                    type: 'leaf',
                    samples: nodeStats.split_stats.left_stats.samples,
                    impurity: nodeStats.split_stats.left_stats.impurity,
                    value: [leftProbs],
                },
                right: {
                    type: 'leaf',
                    samples: nodeStats.split_stats.right_stats.samples,
                    impurity: nodeStats.split_stats.right_stats.impurity,
                    value: [rightProbs],
                },
            };
            
            console.log('[ManualTree] Created split node:', splitNode);
            
            const newTree = updateNodeAtPath(manualTree, selectedNodePath, splitNode);
            setManualTree(newTree);
            setSelectedNodePath(null);
            setSelectedFeature(null);
            setManualFeatureStats(null);
            setSelectedThreshold(null);
        } catch (error) {
            console.error('Failed to split node:', error);
        }
    }, [manualTree, selectedNodePath, selectedFeature, selectedThreshold, getNodeByPath, updateNodeAtPath]);

    const markNodeAsLeaf = useCallback(() => {
        if (!manualTree || !selectedNodePath) return;
        
        const node = getNodeByPath(manualTree, selectedNodePath);
        if (!node) return;
        
        console.log('[ManualTree] Marking node as terminal leaf at path:', selectedNodePath);
        console.log('[ManualTree] Node before:', node);
        
        // If it's a split node, convert it to a leaf node
        // If it's already a leaf, just mark it as terminal
        let updatedNode: TreeNode;
        
        if (node.type === 'split') {
            // Convert split node to terminal leaf node
            updatedNode = {
                type: 'leaf',
                samples: node.samples,
                impurity: node.impurity,
                value: node.value,
                terminal: true,
            };
            console.log('[ManualTree] Converting split node to terminal leaf');
        } else {
            // Just mark the leaf as terminal
            updatedNode = {
                ...node,
                terminal: true,
            };
            console.log('[ManualTree] Marking leaf as terminal');
        }
        
        console.log('[ManualTree] Node after:', updatedNode);
        
        const updatedTree = updateNodeAtPath(manualTree, selectedNodePath, updatedNode);
        console.log('[ManualTree] Updated tree:', updatedTree);
        setManualTree(updatedTree);
        
        // Deselect the node
        setSelectedNodePath(null);
        setSelectedFeature(null);
        setManualFeatureStats(null);
        setSelectedThreshold(null);
    }, [manualTree, selectedNodePath, getNodeByPath, updateNodeAtPath]);

    const canSplitManualNode = useCallback(() => {
        if (!selectedNodePath) return false;
        const node = getNodeByPath(manualTree, selectedNodePath);
        return node?.type === 'leaf' && selectedFeature !== null && selectedThreshold !== null;
    }, [manualTree, selectedNodePath, selectedFeature, selectedThreshold, getNodeByPath]);

    // Log the complete tree structure whenever it changes
    useEffect(() => {
        if (manualTree) {
            console.log('[ManualTree] Tree updated:', JSON.stringify(manualTree, null, 2));
            console.log('[ManualTree] Tree object:', manualTree);
        }
    }, [manualTree]);

    const contextValue: DecisionTreeContextType = {
        isModelLoading,
        modelError,
        currentModelData,
        lastTrainedParams,
        trainNewModel,
        retrieveStoredModel,
        clearStoredModelParams,
        // Helper methods for prediction components
        getFeatureNames,
        getClassNames,
        getModelKey,
        isModelReady,
        // Manual tree building
        manualTree,
        selectedNodePath,
        manualFeatureStats,
        selectedFeature,
        selectedThreshold,
        initializeManualTree,
        selectManualNode,
        loadManualFeatureStats,
        updateManualThreshold,
        splitManualNode,
        markNodeAsLeaf,
        canSplitManualNode,
    };

    return (
        <DecisionTreeContext.Provider value={contextValue}>
            {children}
        </DecisionTreeContext.Provider>
    );
};

export const useDecisionTree = () => {
    const context = useContext(DecisionTreeContext);
    if (context === undefined) {
        throw new Error(
            "useDecisionTree must be used within a DecisionTreeProvider"
        );
    }
    return context;
};
