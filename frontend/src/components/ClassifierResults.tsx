import ConfusionMatrix from "@/components/ConfusionMatrix";
import type { ClassificationMetadata, ClassificationMetrics } from "@/types/model";

interface DecisionTreeProps {
    metrics: ClassificationMetrics
    metadata: ClassificationMetadata
}

const roundNumber = (x: number) => String(x.toFixed(5));

const Results = ({ metrics, metadata }: DecisionTreeProps) => {
    if (metrics == null || metadata == null) {
        return <></>;
    }

    return (
        <div className="h-full flex flex-col justify-between overflow-auto">
            <div className="pb-4 border-black">
                <p className="text-2xl pb-2 text-center">Confusion Matrix</p>
                {metrics == null ? (
                    <></>
                ) : (
                    <div className="w-full">
                        <ConfusionMatrix
                            classes={metadata.class_names}
                            matrix={metrics.confusion_matrix}
                        />
                    </div>
                )}
            </div>
            <div className="pt-4">
                <p className="text-2xl pb-2 text-center">Results</p>
                <div>
                    <div className="flex flex-wrap justify-between tracking-tight">
                        <p className="font-lg font-semibold">Accuracy</p>
                        <p className="font-mono">
                            {roundNumber(metrics.accuracy)}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-between tracking-tight">
                        <p className="font-lg font-semibold">Recall</p>
                        <p className="font-mono">
                            {roundNumber(metrics.recall)}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-between  tracking-tight">
                        <p className="font-lg font-semibold">Precision</p>
                        <p className="font-mono">
                            {roundNumber(metrics.precision)}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-between tracking-tight">
                        <p className="font-lg font-semibold">F1</p>
                        <p className="font-mono">
                            {roundNumber(metrics.f1)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Results;
