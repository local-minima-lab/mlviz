import type { TrainingParameters } from "@/types/story";

/** Represents the metadata of a trained model. */
export interface ModelMetadata extends TrainingParameters {
    created_at: string; // ISO 8601 string
}

/** Represents a leaf node in the decision tree. */
export interface LeafNode {
    type: "leaf";
    value: number[][]; // e.g., [[0, 0, 50]] for 50 samples of class 2
    samples: number;
    impurity: number;
}

/** Represents a split node in the decision tree. */
export interface SplitNode {
    type: "split";
    feature: string;
    feature_index: number;
    threshold: number;
    samples: number;
    impurity: number;
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
