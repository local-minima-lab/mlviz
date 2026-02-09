/**
 * Legend helper for SVG plots
 * Uses foreignObject to embed HTML legend with glassmorphism styling
 * Supports clickable legend items to focus/filter classes
 */

import type { Config } from "@/components/plots/types";
import { createColorScale } from "@/utils/colorUtils";
import * as d3 from "d3";

interface LegendOptions {
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export type LegendFilterCallback = (focusedNames: Set<string> | null) => void;

/**
 * Renders an HTML-styled legend inside an SVG using foreignObject.
 * Matches the glassmorphism style of VisualisationControls.
 * Legend items are clickable to focus specific classes/clusters.
 *
 * Returns an object with an `onFilterChange` method to subscribe to filter changes,
 * and a `destroy` method for cleanup.
 */
export function renderLegend(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    config: Config,
    innerWidth: number,
    innerHeight: number,
    options: LegendOptions = {},
) {
    const { position = "top-right" } = options;

    if (config.type !== "classification" && config.type !== "clustering")
        return null;

    const names =
        config.type === "classification"
            ? config.classNames
            : config.clusterNames;
    if (names.length === 0) return null;

    const colorScale = createColorScale(names, config.colorScheme || "default");

    let focusedNames: Set<string> | null = null;
    let filterCallback: LegendFilterCallback | null = null;

    // Estimate dimensions for the foreignObject
    const foWidth = 130;
    const itemHeight = 22;
    const paddingY = 16;
    const foHeight = names.length * itemHeight + paddingY;

    let x = 0;
    let y = 0;
    switch (position) {
        case "top-right":
            x = innerWidth - foWidth - 8;
            y = 8;
            break;
        case "top-left":
            x = 8;
            y = 8;
            break;
        case "bottom-right":
            x = innerWidth - foWidth - 8;
            y = innerHeight - foHeight - 8;
            break;
        case "bottom-left":
            x = 8;
            y = innerHeight - foHeight - 8;
            break;
    }

    const fo = container
        .append("foreignObject")
        .attr("class", "legend-overlay")
        .attr("x", x)
        .attr("y", y)
        .attr("width", foWidth)
        .attr("height", foHeight)
        .style("pointer-events", "all");

    const div = fo
        .append("xhtml:div")
        .attr(
            "class",
            "bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-sm border border-gray-200/50 rounded-lg px-3 py-2 shadow-sm",
        );

    const rows: Map<
        string,
        d3.Selection<HTMLDivElement, unknown, null, undefined>
    > = new Map();

    function updateRowStyles() {
        rows.forEach((row, name) => {
            const isActive = focusedNames === null || focusedNames.has(name);

            row.select(".legend-swatch")
                .style(
                    "background-color",
                    isActive ? colorScale(name) : "#d1d5db",
                )
                .style("transition", "background-color 0.2s ease");

            row.select(".legend-label")
                .style("color", isActive ? "#334155" : "#9ca3af")
                .style("transition", "color 0.2s ease");

            row.style("opacity", isActive ? "1" : "0.5").style(
                "transition",
                "opacity 0.2s ease",
            );
        });
    }

    names.forEach((name) => {
        const row = div
            .append("xhtml:div")
            .attr("class", "flex items-center gap-2")
            .style("margin-bottom", "2px")
            .style("cursor", "pointer")
            .style("user-select", "none")
            .style("border-radius", "4px")
            .style("padding", "1px 2px") as unknown as d3.Selection<
            HTMLDivElement,
            unknown,
            null,
            undefined
        >;

        row.append("xhtml:span")
            .attr("class", "rounded-full flex-shrink-0 legend-swatch")
            .style("width", "10px")
            .style("height", "10px")
            .style("display", "inline-block")
            .style("background-color", colorScale(name));

        row.append("xhtml:span")
            .attr(
                "class",
                "text-[10px] font-medium text-slate-700 select-none legend-label",
            )
            .text(name);

        rows.set(name, row);

        // Click handler for toggling focus
        row.on("click", (event: MouseEvent) => {
            event.stopPropagation();

            if (focusedNames === null) {
                // Nothing is focused yet — focus only this class
                focusedNames = new Set([name]);
            } else if (focusedNames.has(name)) {
                // This class is already focused
                if (focusedNames.size === 1) {
                    // Only this class is focused — clear filter (show all)
                    focusedNames = null;
                } else {
                    // Multiple focused — remove this one
                    focusedNames.delete(name);
                    focusedNames = new Set(focusedNames); // new ref
                }
            } else {
                // This class is not focused — add it
                focusedNames.add(name);
                focusedNames = new Set(focusedNames); // new ref
            }

            updateRowStyles();

            if (filterCallback) {
                filterCallback(focusedNames);
            }
        });
    });

    return {
        /** Subscribe to filter changes. Callback receives the focused set, or null if all are shown. */
        onFilterChange(cb: LegendFilterCallback) {
            filterCallback = cb;
        },
    };
}
