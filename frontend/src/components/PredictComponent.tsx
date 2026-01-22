import DecisionTreePredictVisualization from "@/components/decision_tree/classifier/prediction/Visualisation";
import KNNPredictVisualization from "@/components/knn/classifier/prediction/Visualisation";
import React from "react";
interface ComponentRegistryProps {
    componentName: string;
    data?: Record<string, any> | null;
    points?: Record<string, any> | null;
}

const componentMap: Record<string, React.ComponentType<any>> = {
    decision_tree: DecisionTreePredictVisualization,
    knn: KNNPredictVisualization,
} as const;

export const PredictComponent: React.FC<ComponentRegistryProps> = ({
    componentName,
    data,
    points,
}) => {
    const Component = componentMap[componentName as keyof typeof componentMap];
    if (!Component) {
        return (
            <div className="text-center p-8">
                <p className="text-destructive">
                    Component "{componentName}" not found
                </p>
            </div>
        );
    }

    return (
        <Component
            data={data}
            points={points}
        />
    );
};
