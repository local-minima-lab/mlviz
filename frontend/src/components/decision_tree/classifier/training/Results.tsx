import type { TrainModelResponse } from "@/types/model";

interface DecisionTreeProps {
    treeData: TrainModelResponse | null;
}

const roundNumber = (x: number) => String(x.toFixed(5));

const Results = ({ treeData }: DecisionTreeProps) => {
    if (treeData == null) {
        return <></>;
    }

    return (
        <div>
            <div className="flex flex-wrap justify-between tracking-tight">
                <p className="font-lg font-semibold">Accuracy</p>
                <p className="font-mono">
                    {roundNumber(treeData.scores.accuracy)}
                </p>
            </div>
            <div className="flex flex-wrap justify-between tracking-tight">
                <p className="font-lg font-semibold">Recall</p>
                <p className="font-mono">
                    {roundNumber(treeData.scores.recall)}
                </p>
            </div>
            <div className="flex flex-wrap justify-between  tracking-tight">
                <p className="font-lg font-semibold">Precision</p>
                <p className="font-mono">
                    {roundNumber(treeData.scores.precision)}
                </p>
            </div>
            <div className="flex flex-wrap justify-between tracking-tight">
                <p className="font-lg font-semibold">F1</p>
                <p className="font-mono">{roundNumber(treeData.scores.f1)}</p>
            </div>
        </div>
    );
};

export default Results;
