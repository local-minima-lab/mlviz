import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useKMeans } from "@/contexts/models/KMeansContext";
import { Check, Move, Play, Plus, RotateCcw, Target } from "lucide-react";
import React from "react";

export type KMeansStepMode = "ready" | "selecting" | "preview";

interface KMeansStepHUDProps {
    mode: KMeansStepMode;
    setMode: (mode: KMeansStepMode) => void;
}

const KMeansStepHUD: React.FC<KMeansStepHUDProps> = ({ mode, setMode }) => {
    const {
        selectedCentroids,
        setSelectedCentroids,
        performStep,
        isStepLoading,
        stepData,
        lastVisualizationParams,
    } = useKMeans();

    const handleRunStep = async () => {
        if (selectedCentroids.length === 0) return;
        const includeBoundary =
            lastVisualizationParams?.parameters?.include_boundary !== false;

        await performStep({
            ...lastVisualizationParams,
            centroids: selectedCentroids,
            include_boundary: includeBoundary,
        });
        setMode("preview");
    };

    const handleTrainNext = () => {
        if (stepData?.new_centroids) {
            setSelectedCentroids(stepData.new_centroids);
        }
        setMode("selecting");
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-slate-200 w-72">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" />
                Step-by-Step Training
            </h3>

            <div className="space-y-4">
                {mode === "ready" && (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {selectedCentroids.length > 0
                                ? "Continue from your saved state or start fresh."
                                : "Start by choosing initial points as cluster centers."}
                        </p>
                        {selectedCentroids.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-full gap-2 bg-slate-900 text-white border-none hover:bg-slate-700 shadow-md transition-all active:scale-[0.98]"
                                    onClick={() => setMode("selecting")}
                                >
                                    <Move className="w-4 h-4" /> Adjust Centroids
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full gap-2 shadow-sm transition-all active:scale-[0.98]"
                                    onClick={handleRunStep}
                                    disabled={isStepLoading}
                                >
                                    <Play className="w-4 h-4" /> Run Step
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-xs h-8 text-slate-400 hover:text-slate-600"
                                    onClick={() => {
                                        setSelectedCentroids([]);
                                        setMode("selecting");
                                    }}
                                >
                                    <RotateCcw className="w-3 h-3 mr-1" /> Start Over (Clear)
                                </Button>
                            </div>
                        ) : (
                            <Button
                                className="w-full gap-2 bg-slate-900 border-none hover:bg-slate-700 text-white shadow-md transition-all active:scale-[0.98]"
                                onClick={() => setMode("selecting")}
                            >
                                <Plus className="w-4 h-4" /> Start Placing
                            </Button>
                        )}
                    </div>
                )}

                {mode === "selecting" && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Centroids Placed
                            </Label>
                            <span className="text-lg font-mono font-bold text-primary leading-none">
                                {selectedCentroids.length}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                            Click data points to select/deselect them.
                        </p>
                        <Button
                            className="w-full h-auto py-2 gap-2 bg-gradient-to-r from-green-100 to-blue-100 text-black border-none hover:from-green-200 hover:to-blue-200 shadow-md transition-all active:scale-[0.98] whitespace-normal text-center flex items-center justify-center px-2"
                            disabled={selectedCentroids.length === 0 || isStepLoading}
                            onClick={handleRunStep}
                        >
                            {isStepLoading ? (
                                "Computing..."
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-current shrink-0" /> <span className="text-xs font-semibold">Run Step</span>
                                </>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-xs h-8 text-slate-400 hover:text-slate-600"
                            onClick={() => setSelectedCentroids([])}
                        >
                            <RotateCcw className="w-3 h-3 mr-1" /> Clear All
                        </Button>
                    </div>
                )}

                {mode === "preview" && (
                    <div className="space-y-3">
                        <div className="p-3 rounded-xl border border-primary/10 bg-white/50">
                            <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                Step Complete
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                                The algorithm has proposed new centers based on the current assignments.
                            </p>
                        </div>
                        <div className="text-xs text-slate-500 px-1">
                            Would you like to keep the centroids suggested?
                        </div>
                        <div className="flex flex-row gap-2 w-full pt-1">
                            <Button
                                className="w-1/2 h-auto py-2 gap-2 bg-gradient-to-r from-green-100 to-blue-100 text-black border-none hover:from-green-200 hover:to-blue-200 shadow-md transition-all active:scale-[0.98] whitespace-normal text-center flex items-center justify-center px-2"
                                onClick={() => setMode("selecting")}
                            >
                                <Check className="w-4 h-4 shrink-0" /> <span className="text-xs font-semibold">Keep</span>
                            </Button>
                            <Button
                                className="w-1/2 h-auto py-2 gap-2 bg-gradient-to-r from-red-100 to-fuchsia-100 text-black border-none hover:from-red-200 hover:to-fuchsia-200 shadow-md transition-all active:scale-[0.98] whitespace-normal text-center flex items-center justify-center px-2"
                                onClick={handleTrainNext}
                            >
                                <Move className="w-4 h-4 shrink-0" /> <span className="text-xs font-semibold">Adjust</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KMeansStepHUD;
