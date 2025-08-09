import ContextPage from "@/pages/ContextPage";
import PredictPage from "@/pages/PredictPage";
import TrainPage from "@/pages/TrainPage";
import React from "react";
interface ComponentRegistryProps {
    componentName: string;
    parameters: Record<string, any>;
}

const componentMap: Record<string, React.ComponentType<any>> = {
    context: ContextPage,
    train: TrainPage,
    predict: PredictPage,
} as const;

export const StoryComponent: React.FC<ComponentRegistryProps> = ({
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
