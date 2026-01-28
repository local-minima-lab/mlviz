/**
 * Scatter Plot Renderers - Barrel Export
 *
 * This file re-exports all scatter rendering functions and types from their
 * dimension-specific files. This provides a clean API and maintains backward
 * compatibility for existing imports.
 *
 * Organization:
 * - scatterRenderHelpers.ts: Shared utilities and types
 * - scatter1DRenderer.ts: 1D strip plot rendering
 * - scatter2DRenderer.ts: 2D scatter plot rendering
 * - scatter3DRenderer.ts: 3D scatter plot rendering
 */

// Re-export types and utilities
export type {
    Scatter3DRotation,
    ScatterRenderOptions,
} from "@/components/plots/utils/scatterRenderHelpers";

export {
    createBoundaryColorScale,
    createScatterColorScale,
    DEFAULT_MARGIN,
    DEFAULT_POINT_OPACITY,
    DEFAULT_POINT_RADIUS,
    JITTER_AMOUNT,
    STRIP_HEIGHT_RATIO,
} from "@/components/plots/utils/scatterRenderHelpers";

// Re-export dimension-specific renderers
export { renderScatter1D } from "@/components/plots/dimensions/scatter1DrendererUtils";
export { renderScatter2D } from "@/components/plots/dimensions/scatter2DrendererUtils";
export { renderScatter3D } from "@/components/plots/dimensions/scatter3DrendererUtils";
