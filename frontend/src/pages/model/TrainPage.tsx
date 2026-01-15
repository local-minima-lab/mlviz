import ClassifierResults from "@/components/ClassifierResults";
import ModelOptionsForm from "@/components/input/ModelOptionsForm";
import { TrainComponent } from "@/components/TrainComponent";
import { useModel } from "@/contexts/ModelContext";
import { CurrentStoryContext } from "@/contexts/StoryContext";
import type { ModelOption } from "@/types/parameters";
import type { ModelPage as ModelPageProps, Parameters } from "@/types/story";
import { filterParameters } from "@/utils/conditions";
import { useContext, useEffect, useState } from "react";

type TrainPageProps = Pick<ModelPageProps, "model_name" | "parameters">;

const TrainPage: React.FC<TrainPageProps> = ({ model_name, parameters }) => {
    const {
        isModelLoading,
        currentModelData,
        lastTrainedParams,
        trainNewModel,
        getParameters,
    } = useModel();

    const [options, setOptions] = useState<ModelOption[]>([]);
    const context = useContext(CurrentStoryContext);
    if (!context) throw new Error("No context found.");
    const { updateParams } = context;

    useEffect(() => {
        const fetchParameters = async () => {
            const response = await getParameters();
            setOptions(filterParameters(response, parameters));
        };

        fetchParameters();
    }, []);

    const [trainingParams, setTrainingParams] = useState<Parameters>(
        parameters == null ? lastTrainedParams : parameters
    );

    useEffect(() => {
        if (parameters == null) setTrainingParams(lastTrainedParams);
    }, [lastTrainedParams]);

    useEffect(() => {
        trainNewModel(parameters || {});
    }, [parameters]);

    const handleTrainModel = () => {
        trainNewModel(trainingParams);
        updateParams({ trainParams: trainingParams });
    };

    return (
        <div className="grid grid-cols-10 mx-auto w-full h-full">
            <div className="col-span-2 shadow-lg justify-between overflow-auto p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                <ModelOptionsForm
                    optionsConfig={options}
                    params={trainingParams}
                    setParams={setTrainingParams}
                    onTrainModel={handleTrainModel}
                    isModelLoading={isModelLoading}
                />
            </div>
            <div className="col-span-6 shadow-lg overflow-hidden">
                <TrainComponent
                    data={currentModelData}
                    componentName={model_name}
                />
            </div>

            <div className="col-span-2 p-4 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
                <ClassifierResults data={currentModelData} />
            </div>
        </div>
    );
};

export default TrainPage;
