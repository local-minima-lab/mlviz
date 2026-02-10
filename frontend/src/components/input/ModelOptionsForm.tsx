import ModelOptionWrapper from "@/components/input/ModelOptionWrapper";
import type { ModelOption } from "@/types/parameters";
interface ModelOptionsFormProps {
    optionsConfig: ModelOption[];
    params: Record<string, any>;
    setParams: (newParams: Record<string, any>) => void;
    onTrainModel: () => void;
    isModelLoading: boolean;
    featureNames?: string[] | null;
    buttonLabel?: string;
}

const ModelOptionsForm = ({
    optionsConfig,
    params,
    setParams,
    onTrainModel,
    isModelLoading,
    featureNames,
    buttonLabel = "Train Model",
}: ModelOptionsFormProps) => {
    return (
        <div className="flex flex-col gap-4 h-full">
            {optionsConfig.map((option: ModelOption) => (
                <ModelOptionWrapper
                    option={option}
                    params={params}
                    setParams={setParams}
                    featureNames={featureNames}
                    key={option.name}
                />
            ))}

            <div>
                <button
                    onClick={onTrainModel}
                    disabled={isModelLoading}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 font-medium rounded-md shadow-sm transition duration-100 hover:shadow-xl my-2"
                >
                    {isModelLoading ? "Processing..." : buttonLabel}
                </button>
            </div>
        </div>
    );
};

export default ModelOptionsForm;
