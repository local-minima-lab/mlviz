/**
 * Shared utilities for scatter plot rendering
 * Common functions used across 1D, 2D, and 3D scatter renderers
 */

import type {
    ClassificationConfig,
    Config,
    PlotPoint,
    RegressionConfig,
} from "@/components/plots/types";
import {
    createColorScale,
    createContinuousColorScale,
} from "@/utils/colorUtils";

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ScatterRenderOptions {
    width: number;
    height: number;
    margin?: { top: number; right: number; bottom: number; left: number };
    pointRadius?: number;
    pointOpacity?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    showAxes?: boolean;
    onPointClick?: (index: number, point: number[]) => void;
    onPointHover?: (index: number | null) => void;
}

export interface Scatter3DRotation {
    alpha: number;
    beta: number;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_MARGIN = { top: 20, right: 20, bottom: 50, left: 60 };
export const DEFAULT_POINT_RADIUS = 5;
export const DEFAULT_POINT_OPACITY = 0.8;

// 1D specific constants
export const STRIP_HEIGHT_RATIO = 0.3;
export const JITTER_AMOUNT = 0.8;

// ============================================================================
// Color Scale Utilities
// ============================================================================

/**
 * Creates a color scale function for scatter plot points based on config type
 * Handles both classification (categorical) and regression (continuous) tasks
 */
export function createScatterColorScale(
    config: Config
): (point: PlotPoint) => string {
    if (config.type === "classification") {
        const categoricalScale = createColorScale(
            config.classNames,
            config.colorScheme || "default"
        );
        return (point: PlotPoint) =>
            point.type === "classification"
                ? categoricalScale(point.label)
                : "#000";
    } else {
        const valueRange = config.valueRange || [
            Math.min(...config.values),
            Math.max(...config.values),
        ];
        const continuousScale = createContinuousColorScale(
            valueRange,
            config.colorScheme || "viridis"
        );
        return (point: PlotPoint) =>
            point.type === "regression" ? continuousScale(point.value) : "#000";
    }
}

/**
 * Creates a color function for decision boundary predictions
 * Used for rendering decision boundary heatmaps/regions
 */
export function createBoundaryColorScale(
    config: Config
): (prediction: any) => string {
    if (config.type === "classification") {
        const categoricalScale = createColorScale(
            config.classNames,
            config.colorScheme || "default"
        );
        return (prediction) => categoricalScale(prediction);
    } else {
        const valueRange = config.valueRange || [
            Math.min(...config.values),
            Math.max(...config.values),
        ];
        const continuousScale = createContinuousColorScale(
            valueRange,
            config.colorScheme || "viridis"
        );
        return (prediction) => continuousScale(prediction);
    }
}

export function makeGetColor(
    config: ClassificationConfig
): (p: string) => string;
export function makeGetColor(config: RegressionConfig): (p: number) => string;
export function makeGetColor(config: Config) {
    if (config.type === "classification") {
        const scale = createColorScale(
            config.classNames,
            config.colorScheme ?? "default"
        );
        return (p: string) => scale(p);
    } else {
        const range: [number, number] = config.valueRange ?? [
            Math.min(...config.values),
            Math.max(...config.values),
        ];
        const scale = createContinuousColorScale(
            range,
            config.colorScheme ?? "viridis"
        );
        return (p: number) => scale(p);
    }
}
