import DecisionTreeDisplay from "@/components/decision_tree/classifier/training/Display";
import { useModel } from "@/contexts/ModelContext";
import type { TrainingParameters } from "@/types/story";
import React, { useEffect, useState } from "react";

interface FeatureProps {
    presetParams: Record<string, any>;
}

const Feature: React.FC<FeatureProps> = ({ presetParams = null }) => {
    const {
        isModelLoading,
        modelError,
        currentModelData,
        lastTrainedParams,
        trainNewModel,
    } = useModel();

    const [trainingParams, setTrainingParams] = useState<TrainingParameters>(
        presetParams == null ? lastTrainedParams : presetParams
    );

    useEffect(() => {
        if (presetParams == null) setTrainingParams(lastTrainedParams);
    }, [lastTrainedParams]);

    useEffect(() => {
        trainNewModel(presetParams as TrainingParameters);
    }, [presetParams]);

    const handleTrainModel = () => {
        console.log("Train/Retrain Model button clicked with:", trainingParams);
        trainNewModel(trainingParams);
    };

    if (isModelLoading && !currentModelData) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
                <p className="text-xl text-gray-700">Loading Model...</p>
                <p className="text-gray-500 mt-2">
                    Retrieving or training the decision tree model based on
                    stored parameters.
                </p>
            </div>
        );
    }

    if (modelError && !currentModelData) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-red-50">
                <p className="text-xl text-red-700 mb-4">
                    Error Loading Model:
                </p>
                <p className="text-red-600 mb-6">{modelError}</p>
                <button
                    onClick={handleTrainModel}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                    disabled={isModelLoading} // Disable button if currently loading
                >
                    Try Training Again
                </button>
            </div>
        );
    }

    return (
        <>
            {currentModelData ? (
                <DecisionTreeDisplay
                    treeData={currentModelData}
                    params={trainingParams}
                    setParams={setTrainingParams}
                    onTrainModel={handleTrainModel}
                    isModelLoading={isModelLoading}
                />
            ) : (
                // Fallback UI if, for some reason, currentModelData is null after initial attempts
                <div className="w-full bg-gray-200 p-8 rounded-lg shadow-inner text-center text-gray-600">
                    <p>
                        No model data available. Click "Train Initial Model" to
                        start.
                    </p>
                    <button
                        onClick={handleTrainModel}
                        className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                        disabled={isModelLoading}
                    >
                        Train Initial Model
                    </button>
                </div>
            )}
        </>
    );
};

export default Feature;
