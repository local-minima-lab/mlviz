import DecisionTreeFeature from "@/components/decision_tree/classifier/prediction/Feature";
import React from "react";
interface ComponentRegistryProps {
    componentName: string;
    parameters: Record<string, any>;
}

const componentMap: Record<string, React.ComponentType<any>> = {
    decision_tree: DecisionTreeFeature,
} as const;

export const PredictComponent: React.FC<ComponentRegistryProps> = ({
    componentName,
    parameters,
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

    return <Component {...parameters} />;
};
