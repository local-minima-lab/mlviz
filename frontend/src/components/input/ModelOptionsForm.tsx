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
                    className="w-full px-4 py-2 bg-blue-500 font-semibold rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isModelLoading ? "Training..." : "Train Model"}
                </button>
            </div>
        </div>
    );
};

export default ModelOptionsForm;
