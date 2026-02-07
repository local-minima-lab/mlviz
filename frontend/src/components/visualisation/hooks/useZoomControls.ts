// Reusable hook for zoom and pan controls

import * as d3 from "d3";
import { useCallback, useRef } from "react";
import type { ZoomControlState } from "../types";

interface UseZoomControlsOptions {
    scaleExtent?: [number, number];
    enablePan?: boolean;
    onZoomChange?: (transform: d3.ZoomTransform) => void;
    contentBounds?: {
        width: number;
        height: number;
        margin?: { top: number; right: number; bottom: number; left: number };
    };
    panMargin?: number; // Fixed pixel margin around content bounds
    clickableSelector?: string; // CSS selector for elements that should be clickable (not trigger zoom/pan)
}

export const useZoomControls = ({
    scaleExtent = [0.1, 3],
    enablePan = true,
    onZoomChange,
    contentBounds,
    panMargin = 200, // 200px margin around content bounds
    clickableSelector,
}: UseZoomControlsOptions = {}): ZoomControlState => {
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<
        SVGSVGElement,
        unknown
    > | null>(null);
    const svgSelectionRef = useRef<d3.Selection<
        SVGSVGElement,
        unknown,
        null,
        undefined
    > | null>(null);

    // Store dynamic bounds that can be updated
    const dynamicBoundsRef = useRef(contentBounds);
    const dynamicPanMarginRef = useRef(panMargin);

    const createZoomBehavior = useCallback(
        (
            svgSelection: d3.Selection<SVGSVGElement, unknown, null, undefined>,
            contentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
            initialTransform: string
        ) => {
            const zoom = d3
                .zoom<SVGSVGElement, unknown>()
                .scaleExtent(scaleExtent);

            let rubberBandTimer: NodeJS.Timeout | null = null;

            // Initialize dynamic bounds
            dynamicBoundsRef.current = contentBounds;
            dynamicPanMarginRef.current = panMargin;

            if (contentBounds) {
                // Create rubber band constraint function
                const applyRubberBand = (
                    transform: d3.ZoomTransform,
                    extent: [[number, number], [number, number]]
                ) => {
                    // Use dynamic bounds that can be updated
                    const currentBounds = dynamicBoundsRef.current;
                    const currentPanMargin = dynamicPanMarginRef.current || 200;

                    if (!currentBounds) {
                        return transform;
                    }
                    const [[x0, y0], [x1, y1]] = extent;
                    const viewportWidth = x1 - x0;
                    const viewportHeight = y1 - y0;

                    if (viewportWidth <= 0 || viewportHeight <= 0) {
                        return transform;
                    }

                    const scaledWidth = currentBounds.width * transform.k;
                    const scaledHeight = currentBounds.height * transform.k;

                    // Calculate bounds based on whether content is larger or smaller than viewport
                    let minX: number, maxX: number, minY: number, maxY: number;

                    if (scaledWidth > viewportWidth) {
                        // Content is wider than viewport - constrain to show only content
                        // maxX = 0: when pan.x = 0, left edge of content aligns with left edge of viewport
                        // minX = viewport - scaled: when pan.x = minX, right edge of content aligns with right edge of viewport
                        // This allows panning from 0 (see left) to negative (see right)
                        maxX = 0;
                        minX = viewportWidth - scaledWidth;
                    } else {
                        // Content is smaller than viewport - allow margin
                        minX = -currentPanMargin;
                        maxX = viewportWidth - scaledWidth + currentPanMargin;
                    }

                    if (scaledHeight > viewportHeight) {
                        // Content is taller than viewport - constrain to show only content
                        // maxY = 0: when pan.y = 0, top edge of content aligns with top edge of viewport
                        // minY = viewport - scaled: when pan.y = minY, bottom edge of content aligns with bottom edge of viewport
                        maxY = 0;
                        minY = viewportHeight - scaledHeight;
                    } else {
                        // Content is smaller than viewport - allow margin
                        minY = -currentPanMargin;
                        maxY = viewportHeight - scaledHeight + currentPanMargin;
                    }

                    // Debug logging
                    console.log("Bounds calculation:", {
                        panMargin: currentPanMargin,
                        viewport: {
                            width: viewportWidth,
                            height: viewportHeight,
                        },
                        scaled: { width: scaledWidth, height: scaledHeight },
                        bounds: { minX, maxX, minY, maxY },
                        transform: { x: transform.x, y: transform.y, k: transform.k },
                        isContentLarger: {
                            width: scaledWidth > viewportWidth,
                            height: scaledHeight > viewportHeight,
                        },
                    });

                    // Check if we're outside bounds
                    const isOutsideBounds =
                        transform.x < minX ||
                        transform.x > maxX ||
                        transform.y < minY ||
                        transform.y > maxY;

                    if (isOutsideBounds) {
                        let rubberX = transform.x;
                        let rubberY = transform.y;

                        // Apply rubber band resistance with exponential falloff
                        if (transform.x < minX) {
                            const overDistance = minX - transform.x;
                            // Rubber band formula: allows movement but with increasing resistance
                            rubberX =
                                minX -
                                overDistance * Math.exp(-overDistance / 100);
                        } else if (transform.x > maxX) {
                            const overDistance = transform.x - maxX;
                            rubberX =
                                maxX +
                                overDistance * Math.exp(-overDistance / 100);
                        }

                        if (transform.y < minY) {
                            const overDistance = minY - transform.y;
                            rubberY =
                                minY -
                                overDistance * Math.exp(-overDistance / 100);
                        } else if (transform.y > maxY) {
                            const overDistance = transform.y - maxY;
                            rubberY =
                                maxY +
                                overDistance * Math.exp(-overDistance / 100);
                        }

                        return d3.zoomIdentity
                            .translate(rubberX, rubberY)
                            .scale(transform.k);
                    }

                    return transform;
                };

                // Apply rubber band constraint during zoom
                zoom.constrain((transform, extent) => {
                    return applyRubberBand(transform, extent);
                });

                // Add snap-back behavior on zoom end
                zoom.on("end", () => {
                    if (rubberBandTimer) {
                        clearTimeout(rubberBandTimer);
                    }

                    rubberBandTimer = setTimeout(() => {
                        const currentTransform = getCurrentTransform();
                        if (currentTransform && svgSelectionRef.current) {
                            const currentBounds = dynamicBoundsRef.current;
                            const currentPanMargin = dynamicPanMarginRef.current || 200;

                            if (!currentBounds) return;

                            const extent = [
                                [0, 0],
                                [
                                    svgSelectionRef.current.node()!.clientWidth,
                                    svgSelectionRef.current.node()!
                                        .clientHeight,
                                ],
                            ] as [[number, number], [number, number]];

                            const [[x0, y0], [x1, y1]] = extent;
                            const viewportWidth = x1 - x0;
                            const viewportHeight = y1 - y0;

                            const scaledWidth = currentBounds.width * currentTransform.k;
                            const scaledHeight = currentBounds.height * currentTransform.k;

                            // Calculate proper bounds
                            let minX: number, maxX: number, minY: number, maxY: number;

                            if (scaledWidth > viewportWidth) {
                                minX = viewportWidth - scaledWidth;
                                maxX = 0;
                            } else {
                                minX = -currentPanMargin;
                                maxX = viewportWidth - scaledWidth + currentPanMargin;
                            }

                            if (scaledHeight > viewportHeight) {
                                minY = viewportHeight - scaledHeight;
                                maxY = 0;
                            } else {
                                minY = -currentPanMargin;
                                maxY = viewportHeight - scaledHeight + currentPanMargin;
                            }

                            // Constrain to bounds
                            const constrainedX = Math.max(minX, Math.min(maxX, currentTransform.x));
                            const constrainedY = Math.max(minY, Math.min(maxY, currentTransform.y));

                            // Only snap back if we're outside bounds
                            const deltaX = Math.abs(currentTransform.x - constrainedX);
                            const deltaY = Math.abs(currentTransform.y - constrainedY);

                            if (deltaX > 1 || deltaY > 1) {
                                console.log("Snapping back to bounds:", {
                                    from: { x: currentTransform.x, y: currentTransform.y },
                                    to: { x: constrainedX, y: constrainedY },
                                    bounds: { minX, maxX, minY, maxY }
                                });
                                const constrainedTransform = d3.zoomIdentity
                                    .translate(constrainedX, constrainedY)
                                    .scale(currentTransform.k);
                                setZoom(constrainedTransform, true);
                            }
                        }
                    }, 150); // Small delay to feel natural
                });
            }

            // Filter out events from clickable elements to allow them to receive clicks
            if (clickableSelector) {
                zoom.filter((event) => {
                    // Don't handle zoom/pan for events on clickable elements
                    const target = event.target as Element;
                    if (target && target.closest(clickableSelector)) {
                        return false;
                    }
                    return true;
                });
            }

            zoom.on("zoom", (event) => {
                // Parse initial transform to get base translation and scale
                const transformMatch = initialTransform.match(
                    /translate\(([^,]+),([^)]+)\)/
                );
                const baseX = transformMatch
                    ? parseFloat(transformMatch[1])
                    : 0;
                const baseY = transformMatch
                    ? parseFloat(transformMatch[2])
                    : 0;

                // Apply zoom transform only to zoom-content group, not axes
                // This allows axes to stay fixed while content zooms
                const zoomContentGroup = contentGroup.select(".zoom-content");
                if (!zoomContentGroup.empty()) {
                    // Apply zoom to content group only
                    zoomContentGroup.attr(
                        "transform",
                        `translate(${event.transform.x}, ${event.transform.y}) scale(${event.transform.k})`
                    );

                    // Update axes with rescaled domains
                    const axesGroup = contentGroup.select(".axes-fixed");
                    if (!axesGroup.empty()) {
                        // Get original scales from data attributes (stored during render)
                        const xAxisGroup = axesGroup.select(".x-axis");
                        const yAxisGroup = axesGroup.select(".y-axis");

                        if (!xAxisGroup.empty() && !yAxisGroup.empty()) {
                            // Get stored scale info
                            const xScaleData = (xAxisGroup.node() as any).__xScale__;
                            const yScaleData = (yAxisGroup.node() as any).__yScale__;

                            if (xScaleData && yScaleData) {
                                // Rescale the axes
                                const newXScale = event.transform.rescaleX(xScaleData);
                                const newYScale = event.transform.rescaleY(yScaleData);

                                // Update the axes
                                xAxisGroup.call(d3.axisBottom(newXScale) as any);
                                yAxisGroup.call(d3.axisLeft(newYScale) as any);

                                // Update the grid to match rescaled axes (grid is now in a separate group)
                                const gridGroup = contentGroup.select(".grid-fixed .grid");
                                if (!gridGroup.empty()) {
                                    // Get grid dimensions from stored data
                                    const gridData = (gridGroup.node() as any).__gridDimensions__;
                                    if (gridData) {
                                        const { width, height } = gridData;

                                        // Update X-axis grid
                                        const gridX = gridGroup.select(".grid-x");
                                        if (!gridX.empty()) {
                                            gridX.call(
                                                d3
                                                    .axisBottom(newXScale)
                                                    .tickSize(-height)
                                                    .tickFormat(() => "") as any
                                            );
                                            // Preserve grid styling
                                            gridX.select(".domain").remove();
                                            gridX.selectAll(".tick line")
                                                .attr("stroke", "#e5e7eb")
                                                .attr("stroke-opacity", 0.7);
                                        }

                                        // Update Y-axis grid
                                        const gridY = gridGroup.select(".grid-y");
                                        if (!gridY.empty()) {
                                            gridY.call(
                                                d3
                                                    .axisLeft(newYScale)
                                                    .tickSize(-width)
                                                    .tickFormat(() => "") as any
                                            );
                                            // Preserve grid styling
                                            gridY.select(".domain").remove();
                                            gridY.selectAll(".tick line")
                                                .attr("stroke", "#e5e7eb")
                                                .attr("stroke-opacity", 0.7);
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // Fallback: apply to entire contentGroup if no .zoom-content found
                    contentGroup.attr(
                        "transform",
                        `translate(${baseX + event.transform.x}, ${
                            baseY + event.transform.y
                        }) scale(${event.transform.k})`
                    );
                }

                // Notify external handlers
                onZoomChange?.(event.transform);
            });

            // Conditionally disable panning
            if (!enablePan) {
                zoom.on("start", (event) => {
                    if (event.sourceEvent?.type === "mousedown") {
                        event.transform.x = 0;
                        event.transform.y = 0;
                    }
                });
            }

            // Store references
            zoomBehaviorRef.current = zoom;
            svgSelectionRef.current = svgSelection;

            // Apply zoom behavior
            svgSelection.call(zoom);

            return zoom;
        },
        [scaleExtent, enablePan, onZoomChange, contentBounds, clickableSelector]
    );

    const resetZoom = useCallback(() => {
        if (zoomBehaviorRef.current && svgSelectionRef.current) {
            svgSelectionRef.current
                .transition()
                .duration(750)
                .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
        }
    }, []);

    const getCurrentTransform = useCallback((): d3.ZoomTransform | null => {
        if (svgSelectionRef.current) {
            return d3.zoomTransform(svgSelectionRef.current.node()!);
        }
        return null;
    }, []);

    const setZoom = useCallback(
        (transform: d3.ZoomTransform, animated = true) => {
            if (zoomBehaviorRef.current && svgSelectionRef.current) {
                if (animated) {
                    svgSelectionRef.current
                        .transition()
                        .duration(500)
                        .call(zoomBehaviorRef.current.transform, transform);
                } else {
                    svgSelectionRef.current.call(
                        zoomBehaviorRef.current.transform,
                        transform
                    );
                }
            }
        },
        []
    );

    const zoomTo = useCallback(
        (scale: number, center?: [number, number], animated = true) => {
            if (zoomBehaviorRef.current && svgSelectionRef.current) {
                const [x, y] = center || [0, 0];
                const transform = d3.zoomIdentity
                    .translate(-x * scale + x, -y * scale + y)
                    .scale(scale);
                setZoom(transform, animated);
            }
        },
        [setZoom]
    );

    // Method to update bounds dynamically
    const updateContentBounds = useCallback(
        (
            newBounds?: UseZoomControlsOptions["contentBounds"],
            newPanMargin?: number
        ) => {
            if (newBounds) {
                dynamicBoundsRef.current = newBounds;
            }
            if (newPanMargin !== undefined) {
                dynamicPanMarginRef.current = newPanMargin;
            }
        },
        []
    );

    return {
        zoomBehavior: zoomBehaviorRef.current,
        svgSelection: svgSelectionRef.current,
        resetZoom,
        getCurrentTransform,
        createZoomBehavior,
        setZoom,
        zoomTo,
        updateContentBounds,
        // Make these accessible for BaseVisualization
        contentBounds: dynamicBoundsRef.current,
        panMargin: dynamicPanMarginRef.current,
    } as ZoomControlState & {
        createZoomBehavior: typeof createZoomBehavior;
        setZoom: typeof setZoom;
        zoomTo: typeof zoomTo;
        updateContentBounds: typeof updateContentBounds;
        contentBounds?: UseZoomControlsOptions["contentBounds"];
        panMargin?: number;
    };
};
