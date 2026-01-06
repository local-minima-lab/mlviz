/**
 * Decision Tree Model Context
 * Manages state and API interactions for Decision Tree visualizations
 */

import { loadDataset } from "@/api/dataset";
import {
    calculateFeatureStats,
    calculateNodeStats,
    evaluateManualTree as evaluateManualTreeAPI,
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
    useRef,
    useState,
    type ReactNode
} from "react";

const LOCAL_STORAGE_PARAMS_KEY = "dt_params";
const LOCAL_STORAGE_MODE_KEY = "dt_tree_mode";
const LOCAL_STORAGE_TREE_DATA_KEY = "dt_tree_data";

interface DecisionTreeContextType {
    isModelLoading: boolean;
    modelError: string | null;
    treeMode: 'trained' | 'manual' | null;
    currentModelData: DecisionTreeResponse | null;
    lastTrainedParams: Parameters;
    trainNewModel: (params: Parameters) => Promise<void>;
    clearStoredModelParams: () => void;
    // Helper methods for prediction components
    getFeatureNames: () => string[] | null;
    getClassNames: () => string[] | null;
    getModelKey: () => string | null;
    isModelReady: () => boolean;
    getManualTreeData: () => { tree: TreeNode; model_metadata: { feature_names: string[] }; classes: string[] } | null;
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
    markNodeAsLeaf: () => Promise<void>;
    canSplitManualNode: () => boolean;
    evaluateManualTree: () => Promise<void>;
    resetModelData: () => void;
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
 * It manages the state and O tjointeractions with the Decision Tree API.
 */
export const DecisionTreeProvider: React.FC<DecisionTreeProviderProps> = ({
    children,
}) => {
    const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
    const [modelError, setModelError] = useState<string | null>(null);
    
    // Unified tree data with mode tracking (persisted to localStorage)
    const [treeMode, setTreeMode] = useState<'trained' | 'manual' | null>(() => {
        const stored = localStorage.getItem(LOCAL_STORAGE_MODE_KEY);
        return (stored as 'trained' | 'manual' | null) || null;
    });
    const [currentModelData, setCurrentModelData] = useState<DecisionTreeResponse | null>(() => {
        const stored = localStorage.getItem(LOCAL_STORAGE_TREE_DATA_KEY);
        if (stored) {
            try {
                console.log('[DecisionTreeContext] Loading tree data from localStorage');
                return JSON.parse(stored);
            } catch (e) {
                console.error('[DecisionTreeContext] Failed to parse tree data:', e);
                return null;
            }
        }
        return null;
    });

    const [lastTrainedParams, setLastTrainedParams] = useState<Parameters>(
        () => {
            const storedParams = localStorage.getItem(LOCAL_STORAGE_PARAMS_KEY);
            if (storedParams == null) return {};
            else return JSON.parse(storedParams as string);
        }
    );

    // Manual tree building state (UI state only)
    const manualTree = treeMode === 'manual' ? currentModelData?.tree : null;
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
                setTreeMode('trained');
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
            setTreeMode(null);
        } finally {
            setIsModelLoading(false);
        }
    }, []);



    const clearStoredModelParams = useCallback(() => {
        localStorage.removeItem(LOCAL_STORAGE_PARAMS_KEY);
        setLastTrainedParams({});
        setCurrentModelData(null);
        setTreeMode(null);
        setModelError(null);
        setIsModelLoading(false);
    }, []);

    // Persist treeMode to localStorage whenever it changes
    useEffect(() => {
        if (treeMode) {
            localStorage.setItem(LOCAL_STORAGE_MODE_KEY, treeMode);
        } else {
            localStorage.removeItem(LOCAL_STORAGE_MODE_KEY);
        }
    }, [treeMode]);

    // Track if we've attempted auto-load to prevent infinite loops
    const autoLoadAttempted = useRef(false);

    useEffect(() => {
        // Only auto-load trained model if:
        // 1. Haven't already attempted auto-load
        // 2. No tree data exists
        // 3. Not currently loading
        // 4. Has stored training parameters  
        // 5. Not in manual mode (manual tree takes precedence)
        if (
            !autoLoadAttempted.current &&
            !currentModelData &&
            !isModelLoading &&
            treeMode !== 'manual' &&
            Object.keys(lastTrainedParams).length > 0
        ) {
            console.log('[AutoLoad] Attempting to load stored model with params:', lastTrainedParams);
            autoLoadAttempted.current = true;
            trainNewModel(lastTrainedParams);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty array = run only once on mount

    // Log and persist currentModelData to localStorage whenever it changes
    useEffect(() => {
        console.log('[DecisionTreeContext] currentModelData updated:', currentModelData);
        if (currentModelData) {
            localStorage.setItem(LOCAL_STORAGE_TREE_DATA_KEY, JSON.stringify(currentModelData));
        } else {
            localStorage.removeItem(LOCAL_STORAGE_TREE_DATA_KEY);
        }
    }, [currentModelData]);

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

    const getManualTreeData = useCallback(() => {
        // Return null if manual tree doesn't exist
        if (!manualTree) {
            return null;
        }

        // Get feature names and classes from the current model data
        const featureNames = getFeatureNames();
        const classNames = getClassNames();

        // Return null if metadata is missing
        if (!featureNames || !classNames) {
            console.warn('[ManualTree] Cannot create prediction data - missing feature names or class names');
            return null;
        }

        // Format the manual tree data for prediction component
        return {
            tree: manualTree,
            model_metadata: {
                feature_names: featureNames,
            },
            classes: classNames,
        };
    }, [manualTree, getFeatureNames, getClassNames]);

    // Manual tree building functions
    const initializeManualTree = useCallback(async () => {
        console.log('[ManualTree] initializeManualTree called');
        console.log('[ManualTree] treeData:', currentModelData);
        console.log('[ManualTree] treeMode:', treeMode);
        
        // If no tree data exists or not in manual mode, load dataset
        if (!currentModelData || treeMode !== 'manual') {
            console.log('[ManualTree] Loading dataset for manual tree...');
            try {
                const datasetResponse = await loadDataset('iris'); // Default to iris
                console.log('[ManualTree] Dataset loaded:', datasetResponse);
                
                // Transform dataset response to match DecisionTreeResponse format
                // Combine X and y into matrix format
                const matrix = datasetResponse.X.map((row: any, idx: number) => [
                    ...row,
                    datasetResponse.y[idx]
                ]);
                
                // Calculate class distribution from dataset
                const classes = datasetResponse.target_names;
                const numClasses = classes.length;
                
                // Count samples per class
                const classCounts = new Array(numClasses).fill(0);
                matrix.forEach((row: any) => {
                    const targetValue = row[row.length - 1]; // Last column is the target
                    const classIndex = targetValue; // Assuming target is already class index
                    if (classIndex >= 0 && classIndex < numClasses) {
                        classCounts[classIndex]++;
                    }
                });
                
                // Convert counts to proportions for the value array
                const totalSamples = matrix.length;
                const classProportions = classCounts.map(count => count / totalSamples);
                
                const rootNode: TreeNode = {
                    type: 'leaf',
                    samples: totalSamples,
                    impurity: 0, // Will be calculated by backend if needed
                    value: [classProportions], // Array of proportions for each class
                    samples_mask: Array.from({ length: totalSamples }, (_, i) => i), // [0, 1, 2, ..., n-1]
                };
                
                // Create tree data in manual mode
                const manualTreeData: DecisionTreeResponse = {
                    success: true,
                    model_key: 'manual_tree',
                    cached: false,
                    metadata: {
                        feature_names: datasetResponse.feature_names,
                    },
                    tree: rootNode,
                    classes: classes,
                    matrix: matrix,
                    scores: {
                        accuracy: 0,
                        precision: 0,
                        recall: 0,
                        f1: 0,
                    },
                };
                
                console.log('[ManualTree] Created manual tree data:', manualTreeData);
                
                setCurrentModelData(manualTreeData);
                setTreeMode('manual');
                
                // Clear training params when entering manual mode
                localStorage.removeItem(LOCAL_STORAGE_PARAMS_KEY);
                setLastTrainedParams({});
                
                setSelectedNodePath(null);
                setSelectedFeature(null);
                setManualFeatureStats(null);
                setSelectedThreshold(null);
            } catch (error) {
                console.error('[ManualTree] Failed to load dataset:', error);
            }
        }
    }, [currentModelData, treeMode]);

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
                parent_samples_mask: node.samples_mask || null, // Use node's sample indices
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
                parent_samples_mask: node.samples_mask || null, // Use node's sample indices
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
                samples_mask: node.samples_mask, // Preserve parent's sample mask
                histogram_data: nodeStats.histogram_data,
                left: {
                    type: 'leaf',
                    samples: nodeStats.split_stats.left_stats.samples,
                    impurity: nodeStats.split_stats.left_stats.impurity,
                    value: [leftProbs],
                    samples_mask: nodeStats.left_samples_mask, // From API response
                },
                right: {
                    type: 'leaf',
                    samples: nodeStats.split_stats.right_stats.samples,
                    impurity: nodeStats.split_stats.right_stats.impurity,
                    value: [rightProbs],
                    samples_mask: nodeStats.right_samples_mask, // From API response
                },
            };
            
            console.log('[ManualTree] Created split node:', splitNode);
            
            const newTree = updateNodeAtPath(manualTree, selectedNodePath, splitNode);
            
            // Update treeData with the new tree
            if (currentModelData) {
                const updatedModelData = {
                    ...currentModelData,
                    tree: newTree,
                };
                setCurrentModelData(updatedModelData);
                
                // Automatically evaluate the tree to get updated metrics
                try {

                    const result = await evaluateManualTreeAPI({
                        tree: newTree,
                        dataset: null, // Uses default Iris dataset
                    });
                    
                    // Update with scores and matrix
                    setCurrentModelData({
                        ...updatedModelData,
                        scores: result.scores,
                        matrix: result.matrix,
                    });

                    console.log("Show everything: ",currentModelData)
                } catch (error) {
                    console.error('[ManualTree] Failed to evaluate tree after split:', error);
                    console.log("request body ",{
                        tree: newTree,
                        dataset: null, // Uses default Iris dataset
                    })
                }
            }
            
            setSelectedNodePath(null);
            setSelectedFeature(null);
            setManualFeatureStats(null);
            setSelectedThreshold(null);
        } catch (error) {
            console.error('Failed to split node:', error);
        }
    }, [manualTree, selectedNodePath, selectedFeature, selectedThreshold, getNodeByPath, updateNodeAtPath, currentModelData]);

    const markNodeAsLeaf = useCallback(async () => {
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
        
        // Update treeData with the new tree
        if (currentModelData) {
            const updatedModelData = {
                ...currentModelData,
                tree: updatedTree,
            };
            setCurrentModelData(updatedModelData);

            // Automatically evaluate the tree to get updated metrics
            try {
                // Clean tree to remove frontend-only fields like 'terminal'
                const result = await evaluateManualTreeAPI({
                    tree: updatedTree,
                    dataset: null, // Uses default Iris dataset
                });
                
                // Update with scores and matrix
                setCurrentModelData({
                    ...updatedModelData,
                    scores: result.scores,
                    matrix: result.matrix,
                });
            } catch (error) {
                console.error('[ManualTree] Failed to evaluate tree after marking as leaf:', error);
            }
        }
        
        // Deselect the node
        setSelectedNodePath(null);
        setSelectedFeature(null);
        setManualFeatureStats(null);
        setSelectedThreshold(null);
    }, [manualTree, selectedNodePath, getNodeByPath, updateNodeAtPath, currentModelData]);

    const canSplitManualNode = useCallback(() => {
        if (!selectedNodePath) return false;
        const node = getNodeByPath(manualTree, selectedNodePath);
        return node?.type === 'leaf' && selectedFeature !== null && selectedThreshold !== null;
    }, [manualTree, selectedNodePath, selectedFeature, selectedThreshold, getNodeByPath]);

    const evaluateManualTree = useCallback(async () => {
        if (!currentModelData || treeMode !== 'manual') {
            console.error('[ManualTree] Cannot evaluate: no manual tree data');
            return;
        }
        
        try {
            console.log('[ManualTree] Evaluating tree...');
            const result = await evaluateManualTreeAPI({
                tree: currentModelData.tree,
                dataset: null, // Use default (Iris)
            });
            
            console.log('[ManualTree] Evaluation result:', result);
            
            // Update currentModelData with new scores and matrix
            setCurrentModelData({
                ...currentModelData,
                scores: result.scores,
                matrix: result.matrix,
            });
        } catch (error) {
            console.error('[ManualTree] Failed to evaluate tree:', error);
        }
    }, [currentModelData, treeMode]);

    const resetModelData = useCallback(() => {
        console.log('[Context] Resetting model data');
        
        // Clear state
        setCurrentModelData(null);
        setTreeMode(null);
        setSelectedNodePath(null);
        setSelectedFeature(null);
        setSelectedThreshold(null);
        setManualFeatureStats(null);
        
        // Clear localStorage
        localStorage.removeItem(LOCAL_STORAGE_TREE_DATA_KEY);
        localStorage.removeItem(LOCAL_STORAGE_MODE_KEY);
    }, []);

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
        treeMode,
        currentModelData: currentModelData,
        lastTrainedParams,
        trainNewModel,
        clearStoredModelParams,
        // Helper methods for prediction components
        getFeatureNames,
        getClassNames,
        getModelKey,
        isModelReady,
        getManualTreeData,
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
        evaluateManualTree,
        resetModelData,
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
