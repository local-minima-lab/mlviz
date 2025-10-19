import { getParameters } from "@/api/dt";
import { TrainComponent } from "@/components/TrainComponent";
import { useModel } from "@/contexts/ModelContext";
import { CurrentStoryContext } from "@/contexts/StoryContext";
import type { ModelOption } from "@/types/parameters";
import type { ModelPage as ModelPageProps } from "@/types/story";
import { filterParameters } from "@/utils/conditions";
import { useContext, useEffect, useState } from "react";

type VizOnlyPageProps = Pick<ModelPageProps, "model_name" | "parameters">;

const VizOnlyPage: React.FC<VizOnlyPageProps> = ({
    model_name,
    parameters,
}) => {
    const { visualizationData, loadVisualization } = useModel();

    const [options, setOptions] = useState<ModelOption[]>([]);
    const context = useContext(CurrentStoryContext);
    if (!context) throw new Error("No context found.");

    useEffect(() => {
        const fetchParameters = async () => {
            const response = await getParameters();
            setOptions(filterParameters(response, parameters));
        };

        fetchParameters();
    }, []);

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
