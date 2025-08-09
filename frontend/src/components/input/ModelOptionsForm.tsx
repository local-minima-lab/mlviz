import ModelOptionWrapper from "@/components/input/ModelOptionWrapper";
import type { ModelOption } from "@/types/parameters";
import type { TrainingParameters } from "@/types/story"; // Assuming TrainingParameters is still the generic type

// Use a specific type for the generic T to ensure it has the expected properties
// If TrainingParameters from "@/types/story" is used everywhere, then we can use that directly.
// For now, let's keep it generic but with a clearer intent.
interface ModelOptionsFormProps {
    optionsConfig: ModelOption[];
    params: TrainingParameters; // Directly use TrainingParameters now for consistency
    setParams: (newParams: TrainingParameters) => void; // Directly use TrainingParameters now for consistency
    onTrainModel: () => void;
    isModelLoading: boolean;
}

const ModelOptionsForm = ({
    optionsConfig,
    params,
    setParams,
    onTrainModel,
    isModelLoading,
}: // Removed: hasModel, // No longer destructuring hasModel
ModelOptionsFormProps) => {
    return (
        <div className="flex flex-col gap-4 h-full">
            {optionsConfig.map((option: ModelOption) => (
                <ModelOptionWrapper
                    option={option}
                    params={params}
                    setParams={setParams}
                    key={option.name}
                />
            ))}

            <div>
                <button
                    onClick={onTrainModel}
                    disabled={isModelLoading}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 font-medium rounded-md shadow-sm transition duration-100 hover:shadow-xl my-2"
                >
                    {isModelLoading ? "Training..." : "Train Model"}
                </button>
            </div>
        </div>
    );
};

export default ModelOptionsForm;
