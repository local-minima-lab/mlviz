import ConfusionMatrix from "@/components/ConfusionMatrix";
import type { TrainModelResponse } from "@/types/model";

interface DecisionTreeProps {
    data: TrainModelResponse | null;
}

const roundNumber = (x: number) => String(x.toFixed(5));

const Results = ({ data }: DecisionTreeProps) => {
    if (data == null) {
        return <></>;
    }

    return (
        <div className="h-full flex flex-col justify-between overflow-auto">
            <div className="pb-4 border-black">
                <p className="text-2xl pb-2 text-center">Confusion Matrix</p>
                {data == null ? (
                    <></>
                ) : (
                    <div className="w-full">
                        <ConfusionMatrix
                            classes={data.classes}
                            matrix={data.matrix}
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
                            {roundNumber(data.scores.accuracy)}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-between tracking-tight">
                        <p className="font-lg font-semibold">Recall</p>
                        <p className="font-mono">
                            {roundNumber(data.scores.recall)}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-between  tracking-tight">
                        <p className="font-lg font-semibold">Precision</p>
                        <p className="font-mono">
                            {roundNumber(data.scores.precision)}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-between tracking-tight">
                        <p className="font-lg font-semibold">F1</p>
                        <p className="font-mono">
                            {roundNumber(data.scores.f1)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Results;
