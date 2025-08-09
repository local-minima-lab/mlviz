// src/components/decision_tree/classifier/prediction/PredictionInputForm.tsx

import React, { useEffect, useState } from "react";

interface PredictionInputFormProps {
    features: string[]; // List of feature names from the model
    initialPoints: Record<string, number>; // Initial values for the input fields
    onPredict: (newPoints: Record<string, number>) => void; // Callback when "Predict" button is clicked
}

const PredictionInputForm: React.FC<PredictionInputFormProps> = ({
    features,
    initialPoints,
    onPredict, // Renamed from onPointsChange
}) => {
    // State to hold the current input values for the form (local to this component)
    const [formPoints, setFormPoints] =
        useState<Record<string, number>>(initialPoints);

    // Update internal form state when initialPoints prop changes (e.g., when treeData changes)
    useEffect(() => {
        // Perform a deep comparison to avoid unnecessary updates if content is the same
        const initialKeys = Object.keys(initialPoints);
        const formKeys = Object.keys(formPoints);

        // Check if feature sets are different
        const featureSetsDifferent =
            initialKeys.length !== formKeys.length ||
            initialKeys.some((key) => !formKeys.includes(key));

        // Check if any specific value has changed for existing features
        const valuesChanged = initialKeys.some(
            (key) => initialPoints[key] !== formPoints[key]
        );

        if (featureSetsDifferent || valuesChanged) {
            setFormPoints(initialPoints);
        }
    }, [initialPoints]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newValue = parseFloat(value);

        setFormPoints((prevPoints) => ({
            ...prevPoints,
            [name]: isNaN(newValue) ? 0 : newValue, // Handle non-numeric input gracefully
        }));
        // IMPORTANT: No call to onPredict here. State is managed locally until button click.
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission behavior
        onPredict(formPoints); // Send the current form values to the parent
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="p-4"
        >
            <div className="space-y-3">
                {features.length === 0 && (
                    <p className="text-gray-500 text-sm">
                        No features available for prediction inputs.
                    </p>
                )}
                {features.map((featureName) => (
                    <div
                        key={featureName}
                        className="flex flex-col"
                    >
                        <label
                            htmlFor={`input-${featureName}`}
                            className="text-xs font-medium text-gray-600 mb-1"
                        >
                            {featureName}
                        </label>
                        <input
                            type="number"
                            id={`input-${featureName}`}
                            name={featureName}
                            value={formPoints[featureName] ?? ""}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 bg-gray-50 font-mono rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            step="any" // Allow decimal inputs
                        />
                    </div>
                ))}
            </div>
            <div>
                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 font-medium rounded-md shadow-sm transition duration-100 hover:shadow-xl my-2"
                >
                    Predict
                </button>
            </div>
        </form>
    );
};

export default PredictionInputForm;
