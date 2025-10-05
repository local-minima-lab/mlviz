/** Histogram data for a node in the decision tree. */
export interface HistogramData {
    feature_values: number[];
    class_labels: number[];
    bins: number[];
    counts_by_class: Record<string, number[]>;
    threshold?: number;
    total_samples: number;
}

/** Represents a leaf node in the decision tree. */
export interface LeafNode {
    type: "leaf";
    value: number[][]; // e.g., [[0, 0, 50]] for 50 samples of class 2
    samples: number;
    impurity: number;
    histogram_data?: HistogramData | null;
}

/** Represents a split node in the decision tree. */
export interface SplitNode {
    type: "split";
    feature: string;
    feature_index: number;
    threshold: number;
    samples: number;
    impurity: number;
    value?: number[][];  // Class distribution for the split node
    histogram_data?: HistogramData | null;
    left: TreeNode;
    right: TreeNode;
}

/** Union type for either a leaf or split node. */
export type TreeNode = LeafNode | SplitNode;

/** Represents the metrics/scores from model evaluation. */
export interface ModelScores {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
}

export interface ModelMetadata {
    created_at: string;
    dataset_info: any;
    feature_names: string[];      // ✅ Critical for prediction!
    class_names: string[];       // ✅ Also needed for prediction
    // Sklearn parameters
    max_depth?: number;
    criterion?: string;
    min_samples_split?: number;
    min_samples_leaf?: number;
    random_state?: number;
    max_features?: string | number | null;
}

export interface TrainModelResponse {
    success: boolean;
    model_key: string; // New field from backend
    cached: boolean; // New field from backend
    metadata: ModelMetadata;
    tree: TreeNode; // Placeholder, assuming this matches your tree_to_dict output
    classes: string[];
    matrix: number[][];
    scores: {
        accuracy: number;
        precision: number;
        recall: number;
        f1: number;
    };
    model_metadata: any;
}

export interface PredictionProps {
    data?: Record<string, any>;
    points?: Record<string, any>;
}
