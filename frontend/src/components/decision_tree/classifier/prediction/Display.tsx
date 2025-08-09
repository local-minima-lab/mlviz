// src/components/decision_tree/classifier/prediction/Display.tsx

import Visualisation from "@/components/decision_tree/classifier/prediction/Visualisation";
import PredictionInputForm from "@/components/input/PredictionInputForm";
import type { TrainModelResponse } from "@/types/model";
import React, { useEffect, useState } from "react";

interface DecisionTreeProps {
    treeData: TrainModelResponse;
}

const Display: React.FC<DecisionTreeProps> = ({ treeData }) => {
    // State to hold the current input values for prediction (used by Visualization)
    const [predictionInputPoints, setPredictionInputPoints] = useState<
        Record<string, number>
    >({});

    const currentFeatures: string[] =
        treeData?.model_metadata?.feature_names || [];

    useEffect(() => {
        if (currentFeatures.length > 0) {
            setPredictionInputPoints((prevPoints) => {
                const newPoints: Record<string, number> = {};
                let hasContentChanged = false;

                currentFeatures.forEach((feature) => {
                    const value = prevPoints[feature] ?? 0;
                    newPoints[feature] = value;
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
                    console.log(
                        "Display: predictionInputPoints initialized/updated based on features:",
                        newPoints
                    );
                    return newPoints;
                } else {
                    return prevPoints;
                }
            });
        } else {
            setPredictionInputPoints((prevPoints) => {
                if (Object.keys(prevPoints).length > 0) {
                    console.log(
                        "Display: predictionInputPoints cleared (no features)."
                    );
                    return {};
                }
                return prevPoints;
            });
        }
    }, [currentFeatures]);

    if (!treeData) {
        return (
            <div>
                <p>No tree data available to display.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-10 gap-2 w-full h-full">
            <div className="col-span-2 shadow-lg justify-between overflow-auto p-4 bg-gray-50">
                {/* Prediction Input Form Component */}
                <PredictionInputForm
                    features={currentFeatures}
                    initialPoints={predictionInputPoints} // Pass current prediction points for initial form state
                    onPredict={(newPoints) => {
                        console.log(
                            "Display: received new points from form (on Predict button click), updating state to:",
                            newPoints
                        );
                        setPredictionInputPoints(newPoints); // This updates the state that Visualisation depends on
                    }}
                />
            </div>
            <div className="col-span-8 shadow-lg overflow-hidden">
                <Visualisation
                    treeData={treeData}
                    points={predictionInputPoints}
                />
            </div>
        </div>
    );
};

export default Display;
