import { PredictComponent } from "@/components/PredictComponent";
import React from "react";

interface PredictPageProps {
    predictFeatureName: string;
    predictParameters: Record<string, any>;
}

const PredictPage: React.FC<PredictPageProps> = ({
    predictFeatureName,
    predictParameters,
}) => {
    return (
        <PredictComponent
            componentName={predictFeatureName}
            parameters={predictParameters}
        />
    );
};

export default PredictPage;
