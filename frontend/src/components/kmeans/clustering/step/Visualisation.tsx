/**
 * KMeans Step-by-Step Training Visualization
 * Specialized for an iterative cycle: Select -> Run Step -> Preview Next -> Repeat
 */

import { renderKMeansTraining } from "@/components/kmeans/clustering/KMeansRenderer";
import type { KMeansVisualizationData } from "@/components/kmeans/clustering/types";
import { DEFAULT_2D_ZOOM_CONFIG } from "@/components/plots/utils/zoomConfig";
import { Button } from "@/components/ui/button";
import BaseVisualisation from "@/components/visualisation/BaseVisualisation";
import type { VisualisationRenderContext } from "@/components/visualisation/types";
import { useKMeans } from "@/contexts/models/KMeansContext";
import { UNASSIGNED_COLOR } from "@/utils/colorUtils";
import * as d3 from "d3";
import { Check, Move, Play, Plus, RotateCcw, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface VisualisationProps {
    data?: unknown;
}

type Mode = "ready" | "selecting" | "preview";

const Visualisation: React.FC<VisualisationProps> = () => {
    const {
        visualizationData: kmeansData,
        loadVisualization,
        lastVisualizationParams,
        performStep,
        isStepLoading,
        stepData,
        selectedCentroids,
        setSelectedCentroids,
        setIsPlacingCentroids,
    } = useKMeans();

    const [mode, setMode] = useState<Mode>("ready");
    const scalesRef = useRef<{
        xScale?: d3.ScaleLinear<number, number>;
        yScale?: d3.ScaleLinear<number, number>;
    }>({});

    // Sync placement mode with context
    useEffect(() => {
        setIsPlacingCentroids(mode === "selecting");
    }, [mode, setIsPlacingCentroids]);

    // Reset mode when data is cleared or centroids are emptied
    useEffect(() => {
        if (!kmeansData) {
            setMode("ready");
        } else if (mode === "ready" && selectedCentroids.length > 0) {
            setMode("selecting");
        }
    }, [kmeansData, selectedCentroids.length]);

    // Dimensions helper
    const dimensions = kmeansData?.visualisation_feature_indices?.length || 2;

    // Transform and inject selected/preview centroids into visualization data
    const modifiedVisualizationData: KMeansVisualizationData | null =
        useMemo(() => {
            if (!kmeansData) return null;

            const currentPoints = kmeansData.data_points || [];

            // We inject a fake "iteration" that represents the CURRENT interactive state
            // This allows the renderer to show assignments/boundaries based on what the user is doing
            const interactiveCentroids =
                mode === "preview" && stepData?.new_centroids
                    ? stepData.new_centroids
                    : selectedCentroids;

            // Prefer boundary data from stepData if available (more recent), fallback to initial load data
            const boundarySource =
                stepData?.decision_boundary || kmeansData.decision_boundary;

            const baseData: KMeansVisualizationData = {
                dataPoints: currentPoints,
                iterations: [
                    {
                        iteration: 0,
                        assignments: currentPoints.map(() => -1),
                        centroids: interactiveCentroids,
                        newCentroids: stepData?.new_centroids || [],
                        centroidShifts: [],
                        converged: false,
                        clusterInfo: [],
                    },
                ],
                totalIterations: 1,
                converged: false,
                finalCentroids: interactiveCentroids,
                finalAssignments: currentPoints.map(() => -1),
                decisionBoundary: boundarySource
                    ? {
                          meshPoints: boundarySource.mesh_points,
                          predictions: boundarySource.predictions as string[],
                          dimensions: dimensions,
                      }
                    : undefined,
                featureNames: kmeansData.visualisation_feature_names || [],
                nDimensions: dimensions,
                nClusters: interactiveCentroids.length,
            };

            return baseData;
        }, [kmeansData, selectedCentroids, stepData, mode, dimensions]);

    const colorScale = useMemo(() => {
        const n = Math.max(selectedCentroids.length, 1);
        const domain = [
            ...Array.from({ length: n }, (_, i) => `Cluster ${i}`),
            "Unassigned",
        ];
        return d3
            .scaleOrdinal<string>()
            .domain(domain)
            .range([...d3.schemeCategory10.slice(0, n), UNASSIGNED_COLOR]);
    }, [selectedCentroids.length]);

    const handlePointClick = useCallback(
        (event: MouseEvent, svg: SVGSVGElement) => {
            if (
                mode !== "selecting" ||
                !scalesRef.current.xScale ||
                !scalesRef.current.yScale ||
                !kmeansData
            )
                return;

            const targetGroup = d3.select(svg).select(".zoom-content");
            if (targetGroup.empty()) return;

            const [mx, my] = d3.pointer(event, targetGroup.node());
            const x = scalesRef.current.xScale.invert(mx);
            const y = scalesRef.current.yScale
                ? scalesRef.current.yScale.invert(my)
                : 0;

            // Snap to nearest data point
            let nearestPoint = null;
            let minDist = Infinity;
            for (const p of kmeansData.data_points) {
                const d = Math.sqrt((p[0] - x) ** 2 + (p[1] - y) ** 2);
                if (d < minDist) {
                    minDist = d;
                    nearestPoint = p;
                }
            }

            if (nearestPoint && minDist < 0.5) {
                // Snapping threshold
                setSelectedCentroids((prev) => {
                    const isSelected = prev.some(
                        (c) =>
                            c[0] === nearestPoint![0] &&
                            c[1] === nearestPoint![1],
                    );
                    if (isSelected) {
                        return prev.filter(
                            (c) =>
                                !(
                                    c[0] === nearestPoint![0] &&
                                    c[1] === nearestPoint![1]
                                ),
                        );
                    }
                    return [...prev, nearestPoint!];
                });
            }
        },
        [mode, kmeansData, setSelectedCentroids],
    );

    const renderCustomMarkers = useCallback(
        (container: d3.Selection<SVGGElement, unknown, null, undefined>) => {
            const { xScale, yScale } = scalesRef.current;
            if (!xScale || !yScale) return;

            container.selectAll(".custom-marker").remove();

            // 1. Render currently SELECTED centroids (Input)
            selectedCentroids.forEach((c, i) => {
                const g = container
                    .append("g")
                    .attr("class", "custom-marker selected-marker")
                    .style("pointer-events", "none"); // Allow clicks to pass through to the background surface
                const color = colorScale(`Cluster ${i}`);

                g.append("circle")
                    .attr("cx", xScale(c[0]))
                    .attr("cy", yScale(c[1]))
                    .attr("r", 8)
                    .attr("fill", color)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 2);

                g.append("text")
                    .attr("x", xScale(c[0]))
                    .attr("y", yScale(c[1]) - 12)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10px")
                    .attr("font-weight", "bold")
                    .text(`C${i}`);
            });

            // 2. Render PROPOSED centroids (Output) if in preview mode
            if (mode === "preview" && stepData?.new_centroids) {
                stepData.new_centroids.forEach((c, i) => {
                    const g = container
                        .append("g")
                        .attr("class", "custom-marker proposed-marker")
                        .style("pointer-events", "none");
                    const color = colorScale(`Cluster ${i}`);

                    g.append("circle")
                        .attr("cx", xScale(c[0]))
                        .attr("cy", yScale(c[1]))
                        .attr("r", 12)
                        .attr("fill", color)
                        .attr("opacity", 0.3)
                        .append("animate")
                        .attr("attributeName", "r")
                        .attr("values", "10;14;10")
                        .attr("dur", "1.5s")
                        .attr("repeatCount", "indefinite");

                    g.append("circle")
                        .attr("cx", xScale(c[0]))
                        .attr("cy", yScale(c[1]))
                        .attr("r", 4)
                        .attr("fill", color)
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 1);

                    g.append("text")
                        .attr("x", xScale(c[0]))
                        .attr("y", yScale(c[1]) + 20)
                        .attr("text-anchor", "middle")
                        .attr("font-size", "9px")
                        .attr("fill", "#666")
                        .text("Proposed");
                });
            }
        },
        [selectedCentroids, mode, stepData, colorScale],
    );

    const renderCallback = useCallback(
        (
            container: d3.Selection<SVGGElement, unknown, null, undefined>,
            _data: any,
            context: VisualisationRenderContext,
        ) => {
            if (!modifiedVisualizationData) return;

            const result = renderKMeansTraining({
                container,
                data: modifiedVisualizationData,
                context,
                props: {
                    colorScale,
                    isPlacementMode: mode === "selecting" || mode === "preview",
                    activeClusterCount: selectedCentroids.length,
                    legendPosition: "bottom-right",
                },
            });

            if (result?.xScale && result?.yScale) {
                scalesRef.current = {
                    xScale: result.xScale,
                    yScale: result.yScale,
                };
                const targetGroup = result.contentGroup || container;
                const { innerWidth, innerHeight } = result.bounds || {
                    innerWidth:
                        context.dimensions.width -
                        context.dimensions.margin.left -
                        context.dimensions.margin.right,
                    innerHeight:
                        context.dimensions.height -
                        context.dimensions.margin.top -
                        context.dimensions.margin.bottom,
                };

                // 1. Add/Update a transparent background for reliable clicking
                targetGroup
                    .selectAll(".click-surface")
                    .data([null])
                    .join("rect")
                    .attr("class", "click-surface")
                    .attr("width", innerWidth)
                    .attr("height", innerHeight)
                    .attr("fill", "transparent")
                    .style(
                        "cursor",
                        mode === "selecting" ? "crosshair" : "default",
                    )
                    .on("click", (e) =>
                        handlePointClick(
                            e,
                            context.state.svgSelection!.node()!,
                        ),
                    );

                renderCustomMarkers(targetGroup);
            }
        },
        [
            modifiedVisualizationData,
            colorScale,
            mode,
            selectedCentroids.length,
            renderCustomMarkers,
            handlePointClick,
        ],
    );

    const handleRunStep = async () => {
        if (selectedCentroids.length === 0) return;
        // Check if boundary should be included based on params
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

    const handleInitialLoad = useCallback(() => {
        if (
            !kmeansData &&
            lastVisualizationParams &&
            Object.keys(lastVisualizationParams).length > 0
        ) {
            // Check if boundary should be included based on params
            const includeBoundary =
                lastVisualizationParams?.parameters?.include_boundary !== false;

            loadVisualization({
                ...lastVisualizationParams,
                include_boundary: includeBoundary,
            });
        }
    }, [kmeansData, lastVisualizationParams, loadVisualization]);

    useEffect(() => {
        handleInitialLoad();
    }, [handleInitialLoad]);

    if (!kmeansData)
        return <div className="p-8 text-center">Initializing...</div>;

    return (
        <div className="relative h-full w-full">
            {/* Control HUD */}
            <div className="absolute top-6 right-6 z-20 flex flex-col gap-4 w-72">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-slate-200">
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
                                            className="w-full gap-2 bg-slate-900 text-white border-none hover:bg-slate-700"
                                            onClick={() => setMode("selecting")}
                                        >
                                            <Move className="w-4 h-4" /> Adjust
                                            Centroids
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            onClick={handleRunStep}
                                            disabled={isStepLoading}
                                        >
                                            <Play className="w-4 h-4" /> Run
                                            Step
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="w-full text-xs h-8 text-slate-400"
                                            onClick={() => {
                                                setSelectedCentroids([]);
                                                setMode("selecting");
                                            }}
                                        >
                                            <RotateCcw className="w-3 h-3 mr-1" />{" "}
                                            Start Over (Clear)
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        className="w-full gap-2 bg-slate-900 border-none hover:bg-slate-700 text-black"
                                        onClick={() => setMode("selecting")}
                                    >
                                        <Plus className="w-4 h-4" /> Start
                                        Placing
                                    </Button>
                                )}
                            </div>
                        )}

                        {mode === "selecting" && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Centroids Placed
                                    </label>
                                    <span className="text-lg font-mono font-bold text-primary">
                                        {selectedCentroids.length}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 italic">
                                    Click data points to select/deselect them.
                                </p>
                                <Button
                                    className="w-full gap-2 bg-gradient-to-r from-green-100 to-blue-100 text-xs text-black border-none hover:from-green-200 hover:to-blue-200"
                                    disabled={
                                        selectedCentroids.length === 0 ||
                                        isStepLoading
                                    }
                                    onClick={handleRunStep}
                                >
                                    {isStepLoading ? (
                                        "Computing..."
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 fill-current " />{" "}
                                            Run Step
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-xs h-8 text-slate-400"
                                    onClick={() => setSelectedCentroids([])}
                                >
                                    <RotateCcw className="w-3 h-3 mr-1" /> Clear
                                    All
                                </Button>
                            </div>
                        )}

                        {mode === "preview" && (
                            <div className="space-y-3">
                                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                    <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        Step Complete
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        The algorithm has proposed new centers
                                        based on the current assignments.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 w-full">
                                    <Button
                                        className="w-full gap-2 bg-gradient-to-r from-red-100 to-fuchsia-100 text-xs text-black border-none hover:from-red-200 hover:to-fuchsia-200"
                                        onClick={handleTrainNext}
                                    >
                                        <Move className="w-4 h-4" /> Update &
                                        Adjust
                                    </Button>
                                    <Button
                                        className="w-full gap-2 bg-gradient-to-r from-green-100 to-blue-100 text-xs text-black border-none hover:from-green-200 hover:to-blue-200"
                                        onClick={() => setMode("selecting")}
                                    >
                                        <Check className="w-4 h-4" /> Keep
                                        Suggested Centroids
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BaseVisualisation
                dataConfig={{
                    data: modifiedVisualizationData,
                    renderContent: renderCallback,
                }}
                capabilities={{
                    zoomable: {
                        ...DEFAULT_2D_ZOOM_CONFIG,
                        enablePan: mode !== "selecting",
                        clickableSelector: ".zoom-content, .zoom-content *",
                    },
                }}
                controlsConfig={{
                    controlsPosition: "top-left",
                    controlsStyle: "overlay",
                }}
            />
        </div>
    );
};

export default Visualisation;
