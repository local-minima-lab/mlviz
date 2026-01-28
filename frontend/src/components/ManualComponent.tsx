import DecisionTreeManual from "@/components/decision_tree/classifier/manual/Visualisation";
import React from "react";

interface ManualComponentRegistryProps {
    componentName: string;
}

const componentMap: Record<string, React.ComponentType<any>> = {
    decision_tree: DecisionTreeManual,
} as const;

export const ManualComponent: React.FC<ManualComponentRegistryProps> = ({
    componentName,
}) => {
    const Component = componentMap[componentName as keyof typeof componentMap];

    if (!Component) {
        return (
            <div className="text-center p-8">
                <p className="text-destructive">
                    Manual builder for "{componentName}" not found
                </p>
            </div>
        );
    }

    return <Component />;
};
