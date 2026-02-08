/**
 * Legend helper for SVG plots
 * Uses foreignObject to embed HTML legend with glassmorphism styling
 */

import type { Config } from "@/components/plots/types";
import { createColorScale } from "@/utils/colorUtils";
import * as d3 from "d3";

interface LegendOptions {
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

/**
 * Renders an HTML-styled legend inside an SVG using foreignObject.
 * Matches the glassmorphism style of VisualisationControls.
 */
export function renderLegend(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    config: Config,
    innerWidth: number,
    innerHeight: number,
    options: LegendOptions = {},
) {
    const { position = "top-right" } = options;

    if (config.type !== "classification" && config.type !== "clustering") return;

    const names =
        config.type === "classification"
            ? config.classNames
            : config.clusterNames;
    if (names.length === 0) return;

    const colorScale = createColorScale(
        names,
        config.colorScheme || "default",
    );

    // Estimate dimensions for the foreignObject
    const foWidth = 130;
    const itemHeight = 22;
    const paddingY = 16;
    const foHeight = names.length * itemHeight + paddingY;

    // Position based on option
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
        .style("pointer-events", "none");

    const div = fo
        .append("xhtml:div")
        .attr(
            "class",
            "bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-sm border border-gray-200/50 rounded-lg px-3 py-2 shadow-sm",
        );

    names.forEach((name) => {
        const row = div
            .append("xhtml:div")
            .attr("class", "flex items-center gap-2")
            .style("margin-bottom", "2px");

        row.append("xhtml:span")
            .attr("class", "rounded-full flex-shrink-0")
            .style("width", "10px")
            .style("height", "10px")
            .style("display", "inline-block")
            .style("background-color", colorScale(name));

        row.append("xhtml:span")
            .attr(
                "class",
                "text-[10px] font-medium text-slate-700 select-none",
            )
            .text(name);
    });
}
