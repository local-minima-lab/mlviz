import { getParameters } from "@/api/dt";
import ConfusionMatrix from "@/components/ConfusionMatrix";
import DecisionTreeResults from "@/components/decision_tree/classifier/training/Results";
import Visualisation from "@/components/decision_tree/classifier/training/Visualisation";
import ModelOptionsForm from "@/components/input/ModelOptionsForm";
import type { TrainModelResponse } from "@/types/model";
import type { ModelOption } from "@/types/parameters";
import type { TrainingParameters } from "@/types/story";
import React, { useEffect, useState } from "react";

interface DecisionTreeProps {
    treeData: TrainModelResponse;
    params: TrainingParameters;
    setParams: (newParams: TrainingParameters) => void;
    onTrainModel: () => void;
    isModelLoading: boolean;
}

const Display: React.FC<DecisionTreeProps> = ({
    treeData,
    params,
    setParams,
    onTrainModel,
    isModelLoading,
}) => {
    if (!treeData) {
        return (
            <div>
                <p>No tree data available to display.</p>
            </div>
        );
    }

    const [options, setOptions] = useState<ModelOption[]>([]);
    const [_loadingParameters, setLoadingParameters] = useState(true);
    const [_parametersError, setParametersError] = useState<string | null>(
        null
    );

    useEffect(() => {
        const fetchParameters = async () => {
            try {
                setLoadingParameters(true);
                setParametersError(null);
                const response = await getParameters();
                setOptions(response);
            } catch (err) {
                setParametersError(
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch parameters"
                );
                console.error("Error fetching parameters:", err);
            } finally {
                setLoadingParameters(false);
            }
        };

        fetchParameters();
    }, []);

    return (
        <div className="grid grid-cols-10 gap-2 w-full h-full">
            <div className="col-span-2 shadow-lg justify-between overflow-auto p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                <ModelOptionsForm
                    optionsConfig={options}
                    params={params}
                    setParams={setParams}
                    onTrainModel={onTrainModel}
                    isModelLoading={isModelLoading}
                />
            </div>
            <div className="col-span-6 shadow-lg overflow-hidden">
                <Visualisation treeData={treeData} />
            </div>

            <div className="col-span-2 shadow-lg flex flex-col justify-between overflow-auto p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="pb-4 border-black">
                    <p className="text-2xl pb-2 tracking-tighter font-bold text-center">
                        Confusion Matrix
                    </p>
                    <ConfusionMatrix
                        classes={treeData.classes}
                        matrix={treeData.matrix}
                    />
                </div>
                <div className="pt-4">
                    <p className="text-2xl pb-2 tracking-tighter font-bold text-center">
                        Results
                    </p>
                    <DecisionTreeResults treeData={treeData} />
                </div>
            </div>
        </div>
    );
};

export default Display;
