/**
 * KNN Training Visualization
 * Displays the training dataset with decision boundaries
 * Similar to DecisionTree training mode but for KNN
 */

import { renderKNNTraining } from "@/components/knn/classifier/KNNRenderer";
import type { KNNVisualizationData } from "@/components/knn/classifier/types";
import BaseVisualisation from "@/components/visualisation/BaseVisualisation";
import type { VisualisationRenderContext } from "@/components/visualisation/types";
import type { components } from "@/types/api";
import * as d3 from "d3";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type KNNVisualisationResponse =
    components["schemas"]["KNNVisualisationResponse"];

interface VisualisationProps {
    data?: KNNVisualisationResponse;
}

const Visualisation: React.FC<VisualisationProps> = ({ data: knnData }) => {
    if (!knnData) return <></>;

    const [alpha, beta] = [0.35, 0.1];

    // State for 3D rotation (only updated when user manually changes sliders)
    const [rotation3D, setRotation3D] = useState({ alpha: alpha, beta: beta });

    // Ref for actual rotation values during animation (doesn't trigger re-renders)
    const currentRotationRef = useRef({ alpha: alpha, beta: beta });

    const [isRotating, setIsRotating] = useState(false);
    const [secondsPerRotation, setSecondsPerRotation] = useState(5); // seconds per full rotation (default 5 seconds)
    const targetFPS = 20; // Target 20 FPS - realistic for 3D rendering performance
    const frameInterval = 1000 / targetFPS; // ms between frames (50ms)
    const lastRenderTimeRef = useRef<number>(0); // Last time we rendered to screen
    const [rotationAxis, setRotationAxis] = useState<
        "horizontal" | "vertical" | "both"
    >("horizontal");
    // Track rotation directions (1 = forward, -1 = reverse)
    const rotationDirectionRef = useRef({ alpha: 1, beta: 1 });

    // Sync ref when state changes (manual slider adjustment)
    useEffect(() => {
        if (!isRotating) {
            currentRotationRef.current = rotation3D;
        }
    }, [rotation3D, isRotating]);

    // Auto-rotation animation loop with delta time for smooth 60fps
    // Uses refs to avoid triggering React re-renders on every frame
    const animationFrameRef = useRef<number | undefined>(undefined);
    useEffect(() => {
        if (!isRotating) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            lastRenderTimeRef.current = 0;
            // Sync ref with state when stopping
            currentRotationRef.current = { ...rotation3D };
            return;
        }

        // Initialize ref with current state when starting
        currentRotationRef.current = { ...rotation3D };

        const animate = (currentTime: number) => {
            // Initialize timestamps on first frame
            if (lastRenderTimeRef.current === 0) {
                lastRenderTimeRef.current = currentTime;
                animationFrameRef.current = requestAnimationFrame(animate);
                return;
            }

            // Throttle updates to target FPS for better performance
            // Only update React state (which triggers expensive D3 re-render) at target FPS
            const timeSinceLastRender = currentTime - lastRenderTimeRef.current;

            if (timeSinceLastRender >= frameInterval) {
                // Calculate delta time since last RENDER (not last frame)
                const deltaTime = timeSinceLastRender / 1000;

                // Calculate rotation increment based on time, not frames
                // Convert seconds per rotation to rotations per second, then to radians/second
                const rotationsPerSecond = 1 / secondsPerRotation;
                const radiansPerSecond = rotationsPerSecond * Math.PI * 2;
                const deltaRadians = radiansPerSecond * deltaTime;

                // Update rotation in ref (doesn't trigger re-render)
                const newRotation = { ...currentRotationRef.current };

                // Update based on selected axis with auto-reversing at bounds
                if (rotationAxis === "horizontal" || rotationAxis === "both") {
                    const newAlpha =
                        currentRotationRef.current.alpha +
                        deltaRadians * rotationDirectionRef.current.alpha;

                    // Check bounds for horizontal (0 to 2)
                    if (newAlpha > 2) {
                        newRotation.alpha = 2;
                        rotationDirectionRef.current.alpha = -1; // Reverse direction
                    } else if (newAlpha < 0) {
                        newRotation.alpha = 0;
                        rotationDirectionRef.current.alpha = 1; // Reverse direction
                    } else {
                        newRotation.alpha = newAlpha;
                    }
                }

                if (rotationAxis === "vertical" || rotationAxis === "both") {
                    const newBeta =
                        currentRotationRef.current.beta +
                        deltaRadians * rotationDirectionRef.current.beta;

                    // Check bounds for vertical (-0.5 to 0.5)
                    if (newBeta > 0.5) {
                        newRotation.beta = 0.5;
                        rotationDirectionRef.current.beta = -1; // Reverse direction
                    } else if (newBeta < -0.5) {
                        newRotation.beta = -0.5;
                        rotationDirectionRef.current.beta = 1; // Reverse direction
                    } else {
                        newRotation.beta = newBeta;
                    }
                }

                currentRotationRef.current = newRotation;
                setRotation3D({ ...newRotation });
                lastRenderTimeRef.current = currentTime;
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            lastRenderTimeRef.current = 0;
        };
        // Note: rotation3D is intentionally NOT in dependencies to avoid restarting animation loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRotating, secondsPerRotation, rotationAxis, knnData.visualisation_feature_indices]);

    // Transform API response to visualization data
    console.log(knnData);
    const dimensions = knnData.visualisation_feature_indices?.length || 0;

    const visualizationData: KNNVisualizationData = useMemo(() => {
        const decisionBoundary = knnData.decision_boundary
            ? {
                  meshPoints: knnData.decision_boundary.mesh_points,
                  predictions: knnData.decision_boundary.predictions,
                  dimensions: dimensions,
              }
            : undefined;

        return {
            trainingPoints: knnData.training_points,
            trainingLabels: knnData.training_labels,
            decisionBoundary,
            featureNames: knnData.feature_names,
            classNames: knnData.class_names,
            nDimensions: dimensions,
            k: 5, // Default K, can be made configurable
            queries: undefined,
        };
    }, [knnData, dimensions]);

    // Create color scale
    const colorScale = useMemo(
        () =>
            d3
                .scaleOrdinal<string>()
                .domain(visualizationData.classNames)
                .range(
                    d3.schemeDark2.slice(0, visualizationData.classNames.length)
                ),
        [visualizationData.classNames]
    );

    // Stable render callback that always reads latest rotation from ref
    const renderCallback = useCallback(
        (
            container: d3.Selection<SVGGElement, unknown, null, undefined>,
            _data: any,
            context: VisualisationRenderContext
        ) => {
            renderKNNTraining({
                container,
                data: visualizationData,
                context,
                props: {
                    colorScale,
                    k: visualizationData.k,
                    // Always read from ref to get latest rotation without recreating callback
                    rotation3D: currentRotationRef.current,
                },
            });
        },
        // rotation3D intentionally excluded - we read from ref instead
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [visualizationData, colorScale]
    );

    // 3D Rotation Controls (only show for 3D plots)
    const rotation3DControls =
        dimensions === 3 ? (
            <div className="flex flex-row gap-2">
                <div className="flex flex-col align-center w-full flex-1">
                    <div className="flex flex-row justify-between gap-2">
                        {/* Horizontal Rotation (Alpha - Y axis) */}
                        <div className="space-y-1 flex-1">
                            <label className="flex justify-between text-xs text-gray-600">
                                <span>Horizontal (α)</span>
                                <span className="font-mono text-gray-500">
                                    {Math.round(rotation3D.alpha * 360)}°
                                </span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.01"
                                value={rotation3D.alpha}
                                onChange={(e) =>
                                    setRotation3D((prev) => ({
                                        ...prev,
                                        alpha: parseFloat(e.target.value),
                                    }))
                                }
                                className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        {/* Vertical Rotation (Beta - X axis) */}
                        <div className="space-y-1 flex-1">
                            <label className="flex justify-between text-xs text-gray-600">
                                <span>Vertical (β)</span>
                                <span className="font-mono text-gray-500">
                                    {Math.round(rotation3D.beta * 360)}°
                                </span>
                            </label>
                            <input
                                type="range"
                                min="-0.5"
                                max="0.5"
                                step="0.01"
                                value={rotation3D.beta}
                                onChange={(e) =>
                                    setRotation3D((prev) => ({
                                        ...prev,
                                        beta: parseFloat(e.target.value),
                                    }))
                                }
                                className="w-full h-2 bg-green-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                        </div>
                    </div>

                    {/* Animation Controls */}
                    <div className="pt-2 border-gray-200 w-full flex-1">
                        <div className="flex flex-row justify-between gap-2 items-center">
                            {/* Play/Pause Button */}
                            <button
                                onClick={() => setIsRotating(!isRotating)}
                                className={`w-full px-3 py-2 text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 ${
                                    isRotating
                                        ? "!bg-red-500 !hover:bg-red-600 text-white"
                                        : "!bg-blue-500 !hover:bg-blue-600 text-white"
                                }`}
                            >
                                {isRotating ? (
                                    <>
                                        <svg
                                            className="w-4 h-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Pause Rotation
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-4 h-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Auto Rotate
                                    </>
                                )}
                            </button>

                            {/* Rotation Axis Selector */}
                            <div className="flex-1">
                                <label className="text-xs text-gray-600">
                                    <span>Rotation Axis</span>
                                </label>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() =>
                                            setRotationAxis("horizontal")
                                        }
                                        className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                                            rotationAxis === "horizontal"
                                                ? "!bg-blue-500 text-white"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                    >
                                        Horizontal
                                    </button>
                                    <button
                                        onClick={() =>
                                            setRotationAxis("vertical")
                                        }
                                        className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                                            rotationAxis === "vertical"
                                                ? "!bg-green-500 text-white"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                    >
                                        Vertical
                                    </button>
                                    <button
                                        onClick={() => setRotationAxis("both")}
                                        className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                                            rotationAxis === "both"
                                                ? "!bg-purple-500 text-white"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        }`}
                                    >
                                        Both
                                    </button>
                                </div>
                            </div>

                            {/* Speed Control */}
                            <div className="w-[100%]">
                                <label className="flex justify-between text-xs text-gray-600 w-full">
                                    <span>Speed</span>
                                    <span className="font-mono text-gray-500">
                                        {secondsPerRotation.toFixed(0)}s / rotation
                                    </span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    step="1"
                                    value={secondsPerRotation}
                                    onChange={(e) =>
                                        setSecondsPerRotation(
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    className="w-full h-2 !bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={() => {
                                    setRotation3D({ alpha: alpha, beta: beta });
                                    setIsRotating(false);
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            >
                                Reset View
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ) : null;

    return (
        <BaseVisualisation
            dataConfig={{
                data: visualizationData,
                renderContent: renderCallback,
            }}
            capabilities={{
                zoomable: {
                    scaleExtent: [0.5, 5],
                    enableReset: true,
                    enablePan: true,
                    panMargin: 50,
                },
            }}
            controlsConfig={{
                controlsPosition: "top-left",
                controlsStyle: "overlay",
            }}
            layoutConfig={{
                topControls: rotation3DControls,
            }}
        />
    );
};

export default Visualisation;
