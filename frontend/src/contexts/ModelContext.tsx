/**
 * Generic Model Context Provider
 *
 * This component acts as a router for model-specific contexts.
 * Based on the `model_name` provided in a story page, it wraps its
 * children with the appropriate context provider (e.g., DecisionTreeProvider, KNNProvider).
 *
 * It also provides a unified `useModel` hook that returns the correct
 * context data for the currently active model.
 */
import React, { createContext, useContext } from "react";
import { DecisionTreeProvider, useDecisionTree } from "./DecisionTreeContext";
import { KNNProvider, useKNN } from "./KNNContext";

interface ModelProviderProps {
    children: React.ReactNode;
    model_name: string;
}

// A map of model names to their respective providers
const providers: Record<string, React.FC<{ children: React.ReactNode }>> = {
    decision_tree: DecisionTreeProvider,
    knn: KNNProvider,
};

export const ModelProvider: React.FC<ModelProviderProps> = ({
    children,
    model_name,
}) => {
    const Provider = providers[model_name];

    if (!Provider) {
        // Fallback or error for an unknown model
        return <>{children}</>;
    }

    return <Provider>{children}</Provider>;
};

// A map of model names to their respective hooks
const hooks: Record<string, () => any> = {
    decision_tree: useDecisionTree,
    knn: useKNN,
};

// A generic context to hold the current model name
const ModelNameContext = createContext<string | undefined>(undefined);

export const ModelNameProvider = ModelNameContext.Provider;

/**
 * A unified hook to access the context of the currently active model.
 */
export const useModel = () => {
    const modelName = useContext(ModelNameContext);
    if (!modelName) {
        throw new Error("useModel must be used within a ModelNameProvider");
    }

    const useModelHook = hooks[modelName];
    if (!useModelHook) {
        throw new Error(`No model context hook found for model: ${modelName}`);
    }

    return useModelHook();
};
