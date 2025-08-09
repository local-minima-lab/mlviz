import { PredictComponent } from "@/components/PredictComponent";
import React from "react";

interface PredictPageProps {
    predictFeatureName: string;
    predictFeatureParameters: Record<string, any>;
}

const PredictPage: React.FC<PredictPageProps> = ({
    predictFeatureName,
    predictFeatureParameters,
}) => {
    return (
        <PredictComponent
            componentName={predictFeatureName}
            parameters={predictFeatureParameters}
        />
    );
};

export default PredictPage;
