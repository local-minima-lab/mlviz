import { TrainComponent } from "@/components/TrainComponent"; // Adjust path if necessary
import React from "react";

interface TrainPageProps {
    trainFeatureName: string;
    trainFeatureParameters: Record<string, any>;
}

const TrainPage: React.FC<TrainPageProps> = ({
    trainFeatureName,
    trainFeatureParameters,
}) => {
    return (
        <TrainComponent
            componentName={trainFeatureName}
            parameters={trainFeatureParameters}
        />
    );
};

export default TrainPage;
