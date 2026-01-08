import PredictionInputForm from "@/components/input/PredictionInputForm";
import { PredictComponent } from "@/components/PredictComponent";
import { useModel } from "@/contexts/ModelContext";
import { CurrentStoryContext } from "@/contexts/StoryContext";
import type { ModelPage as ModelPageProps } from "@/types/story";
import { useContext, useEffect, useState } from "react";

type PredictPageProps = Pick<ModelPageProps, "model_name" | "parameters">;

const PredictPage: React.FC<PredictPageProps> = ({
    model_name,
    parameters,
}) => {
    const context = useContext(CurrentStoryContext);
    if (!context) throw new Error("No context found.");
    const { updateParams } = context;

    const { currentModelData, getFeatureNames } = useModel();
    console.log("Current model data: ", currentModelData)

    const [predictionInputPoints, setPredictionInputPoints] = useState<
        Record<string, number>
    >(parameters?.presetPoints || {});

    const currentFeatures: string[] = getFeatureNames() || [];

    useEffect(() => {
        if (currentFeatures.length > 0) {
            setPredictionInputPoints((prevPoints) => {
                const newPoints: Record<string, number> = {};
                let hasContentChanged = false;

                currentFeatures.forEach((feature) => {
                    const value = prevPoints[feature];
                    if (value !== undefined) {
                        newPoints[feature] = value;
                    }
                    if (value !== prevPoints[feature]) {
                        hasContentChanged = true;
                    }
                });

                const prevFeatures = Object.keys(prevPoints);
                const hasRemovedFeatures = prevFeatures.some(
                    (feature) => !currentFeatures.includes(feature)
                );

                if (
                    hasContentChanged ||
                    hasRemovedFeatures ||
                    Object.keys(newPoints).length !== prevFeatures.length
                ) {
                    updateParams({ predictParams: newPoints });
                    return newPoints;
                } else {
                    updateParams({ predictParams: prevPoints });
                    return prevPoints;
                }
            });
        } else {
            setPredictionInputPoints((prevPoints) => {
                if (Object.keys(prevPoints).length > 0) {
                    return {};
                }
                return prevPoints;
            });
        }
    }, [currentFeatures]);

    if (!currentModelData) {
        return (
            <div>
                <p>No data available to display.</p>
            </div>
        );
    }

    const handlePredict = (newPoints: Record<string, number>) => {
        setPredictionInputPoints(newPoints);
        updateParams({ predictParams: newPoints });
    };

    return (
        <div className="grid grid-cols-10 w-full h-full">
            <div className="col-span-2 shadow-lg justify-between overflow-auto p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                <PredictionInputForm
                    features={currentFeatures}
                    initialPoints={predictionInputPoints}
                    onPredict={handlePredict}
                />
            </div>
            <div className="col-span-8 shadow-lg overflow-hidden">
                <PredictComponent
                    componentName={model_name}
                    data={currentModelData}
                    points={predictionInputPoints}
                />
            </div>
        </div>
    );
};

export default PredictPage;
