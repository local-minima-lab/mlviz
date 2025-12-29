import { TrainComponent } from "@/components/TrainComponent";
import { useModel } from "@/contexts/ModelContext";
import { CurrentStoryContext } from "@/contexts/StoryContext";
import type { ModelPage as ModelPageProps } from "@/types/story";
import { useContext, useEffect } from "react";

type VizOnlyPageProps = Pick<ModelPageProps, "model_name" | "parameters">;

const VizOnlyPage: React.FC<VizOnlyPageProps> = ({
    model_name,
    parameters,
}) => {
    const { visualizationData, loadVisualization } = useModel();

    const context = useContext(CurrentStoryContext);
    if (!context) throw new Error("No context found.");

    useEffect(() => {
        loadVisualization(parameters || {});
    }, [parameters]);

    return (
        <div className="mx-auto w-full h-full">
            <TrainComponent
                data={visualizationData}
                componentName={model_name}
            />
        </div>
    );
};

export default VizOnlyPage;
