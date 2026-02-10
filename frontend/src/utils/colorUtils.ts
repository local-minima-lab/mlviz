/**
 * Shared color utilities for all visualizations across the project
 * Used by plots, histograms, decision trees, and other visualizations
 */

import * as d3 from "d3";

/**
 * Default grey color used for "Unassigned" labels or null values
 */
export const UNASSIGNED_COLOR = "#999999";

// ============================================================================
// Color Palettes
// ============================================================================

/**
 * Default color palette - consistent across histograms, plots, and other visualizations
 * Based on a subset of d3.schemeCategory10 with adjustments
 */
export const DEFAULT_COLORS = [
    "#1f77b4", // blue
    "#ff7f0e", // orange
    "#2ca02c", // green
    "#d62728", // red
    "#9467bd", // purple
    "#8c564b", // brown
    "#e377c2", // pink
    "#7f7f7f", // gray
    "#bcbd22", // olive
    "#17becf", // cyan
];

/**
 * Additional color palettes for different visualization needs
 */
export const COLOR_PALETTES = {
    default: DEFAULT_COLORS,
    category10: d3.schemeCategory10,
    dark2: d3.schemeDark2,
    set3: d3.schemeSet3,
    paired: d3.schemePaired,
    pastel1: d3.schemePastel1,
} as const;

export type PaletteName = keyof typeof COLOR_PALETTES;

// ============================================================================
// Color Scale Creation
// ============================================================================

/**
 * Creates a D3 ordinal color scale from labels
 * @param labels Array of unique labels
 * @param palette Name of the color palette to use
 * @returns D3 ordinal color scale
 */
export function createColorScale(
    labels: string[],
    palette: PaletteName = "default"
): d3.ScaleOrdinal<string, string> {
    const colors = COLOR_PALETTES[palette];
    
    // Create base range of colors
    const range = colors.slice(0, Math.max(labels.length, colors.length));
    
    // Explicitly handle "Unassigned" if present in labels
    const unassignedIndex = labels.indexOf("Unassigned");
    if (unassignedIndex !== -1) {
        // Ensure the range has enough slots
        if (unassignedIndex < range.length) {
            range[unassignedIndex] = UNASSIGNED_COLOR;
        }
    }

    return d3
        .scaleOrdinal<string>()
        .domain(labels)
        .range(range);
}

/**
 * Creates a color map from labels to colors
 * @param labels Array of unique labels
 * @param palette Name of the color palette to use
 * @returns Object mapping label to color string
 */
export function createColorMap(
    labels: string[],
    palette: PaletteName = "default"
): Record<string, string> {
    const scale = createColorScale(labels, palette);
    const colorMap: Record<string, string> = {};
    labels.forEach((label) => {
        colorMap[label] = scale(label);
    });
    return colorMap;
}

// ============================================================================
// Color Manipulation Utilities
// ============================================================================

/**
 * Adjusts the opacity of a hex color
 * @param color Hex color string (e.g., "#3b82f6") or rgb/rgba
 * @param opacity Opacity value between 0 and 1
 * @returns rgba color string
 */
export function withOpacity(color: string, opacity: number): string {
    // Handle hex colors
    if (color.startsWith("#")) {
        const hex = color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    // Already an rgba color, replace opacity
    if (color.startsWith("rgba")) {
        return color.replace(/[\d.]+\)$/, `${opacity})`);
    }

    // rgb color, convert to rgba
    if (color.startsWith("rgb")) {
        return color.replace("rgb", "rgba").replace(")", `, ${opacity})`);
    }

    return color;
}

/**
 * Darkens a color by a percentage
 * @param color Hex color string
 * @param percent Percentage to darken (0-100)
 * @returns Darkened hex color
 */
export function darkenColor(color: string, percent: number): string {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) - amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) - amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) - amt));

    return (
        "#" +
        (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
    );
}

/**
 * Lightens a color by a percentage
 * @param color Hex color string
 * @param percent Percentage to lighten (0-100)
 * @returns Lightened hex color
 */
export function lightenColor(color: string, percent: number): string {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));

    return (
        "#" +
        (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
    );
}

/**
 * Gets contrasting text color (black or white) for a given background color
 * @param backgroundColor Hex color string
 * @returns "#000000" or "#ffffff"
 */
export function getContrastColor(backgroundColor: string): string {
    const hex = backgroundColor.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Calculate luminance using standard formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Interpolates between two colors
 * @param color1 Starting color (hex)
 * @param color2 Ending color (hex)
 * @param t Interpolation factor (0-1)
 * @returns Interpolated color (hex)
 */
export function interpolateColor(
    color1: string,
    color2: string,
    t: number
): string {
    const hex1 = color1.slice(1);
    const hex2 = color2.slice(1);

    const r1 = parseInt(hex1.slice(0, 2), 16);
    const g1 = parseInt(hex1.slice(2, 4), 16);
    const b1 = parseInt(hex1.slice(4, 6), 16);

    const r2 = parseInt(hex2.slice(0, 2), 16);
    const g2 = parseInt(hex2.slice(2, 4), 16);
    const b2 = parseInt(hex2.slice(4, 6), 16);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (
        "#" +
        (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)
    );
}

// ============================================================================
// Continuous Color Scales (for Regression)
// ============================================================================

/**
 * Available continuous color schemes for regression tasks
 */
export const CONTINUOUS_COLOR_SCHEMES = {
    viridis: d3.interpolateViridis,
    plasma: d3.interpolatePlasma,
    inferno: d3.interpolateInferno,
    magma: d3.interpolateMagma,
    cividis: d3.interpolateCividis,
    blues: d3.interpolateBlues,
    greens: d3.interpolateGreens,
    reds: d3.interpolateReds,
    purples: d3.interpolatePurples,
    oranges: d3.interpolateOranges,
    greys: d3.interpolateGreys,
    turbo: d3.interpolateTurbo,
    cool: d3.interpolateCool,
    warm: d3.interpolateWarm,
} as const;

export type ContinuousSchemeName = keyof typeof CONTINUOUS_COLOR_SCHEMES;

/**
 * Creates a D3 sequential color scale for continuous data (regression)
 * @param domain Value range [min, max]
 * @param scheme Name of the continuous color scheme
 * @returns D3 sequential color scale
 */
export function createContinuousColorScale(
    domain: [number, number],
    scheme: ContinuousSchemeName = "viridis"
): d3.ScaleSequential<string> {
    const interpolator = CONTINUOUS_COLOR_SCHEMES[scheme];
    return d3.scaleSequential(interpolator).domain(domain);
}
