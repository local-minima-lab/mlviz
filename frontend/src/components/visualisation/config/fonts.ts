export interface FontConfig {
    family: string;
    weights: {
        normal: string;
        medium: string;
        bold: string;
    };
    sizes: {
        small: number;
        normal: number;
        medium: number;
        large: number;
        title: number;
    };
}

export const FONT_PRESETS: Record<string, FontConfig> = {
    inter: {
        family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        weights: { normal: "400", medium: "500", bold: "600" },
        sizes: {
            small: 8,
            normal: 9,
            medium: 10,
            large: 12,
            title: 14,
        },
    },

    robotoMono: {
        family: "Roboto Mono, 'SF Mono', Monaco, Inconsolata, 'Liberation Mono', 'Courier New', monospace",
        weights: { normal: "400", medium: "500", bold: "600" },
        sizes: { small: 8, normal: 10, medium: 11, large: 13, title: 15 },
    },

    system: {
        family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        weights: { normal: "400", medium: "500", bold: "600" },
        sizes: { small: 8, normal: 11, medium: 12, large: 14, title: 16 },
    },
} as const;

export const ACTIVE_FONTS: FontConfig = FONT_PRESETS.inter;

type FontPresetName = keyof typeof FONT_PRESETS;

export interface ApplyFontHelpers {
    family: (selection: any) => any;
    weight: {
        normal: (selection: any) => any;
        medium: (selection: any) => any;
        bold: (selection: any) => any;
    };
    size: {
        small: (selection: any) => any;
        normal: (selection: any) => any;
        medium: (selection: any) => any;
        large: (selection: any) => any;
        title: (selection: any) => any;
    };
    label: (selection: any) => any;
    title: (selection: any) => any;
    body: (selection: any) => any;
    complete: (
        size: keyof FontConfig["sizes"],
        weight: keyof FontConfig["weights"]
    ) => (selection: any) => any;
}

// Factory function that creates font helpers for a specific font configuration
const createFontHelpers = (fontConfig: FontConfig): ApplyFontHelpers => ({
    family: (selection: any) =>
        selection.attr("font-family", fontConfig.family),

    weight: {
        normal: (selection: any) =>
            selection.attr("font-weight", fontConfig.weights.normal),
        medium: (selection: any) =>
            selection.attr("font-weight", fontConfig.weights.medium),
        bold: (selection: any) =>
            selection.attr("font-weight", fontConfig.weights.bold),
    },

    size: {
        small: (selection: any) =>
            selection.attr("font-size", `${fontConfig.sizes.small}px`),
        normal: (selection: any) =>
            selection.attr("font-size", `${fontConfig.sizes.normal}px`),
        medium: (selection: any) =>
            selection.attr("font-size", `${fontConfig.sizes.medium}px`),
        large: (selection: any) =>
            selection.attr("font-size", `${fontConfig.sizes.large}px`),
        title: (selection: any) =>
            selection.attr("font-size", `${fontConfig.sizes.title}px`),
    },

    // Combination helpers for common text styles
    label: (selection: any) =>
        selection
            .attr("font-family", fontConfig.family)
            .attr("font-size", `${fontConfig.sizes.small}px`)
            .attr("font-weight", fontConfig.weights.medium),

    title: (selection: any) =>
        selection
            .attr("font-family", fontConfig.family)
            .attr("font-size", `${fontConfig.sizes.title}px`)
            .attr("font-weight", fontConfig.weights.bold),

    body: (selection: any) =>
        selection
            .attr("font-family", fontConfig.family)
            .attr("font-size", `${fontConfig.sizes.normal}px`)
            .attr("font-weight", fontConfig.weights.normal),

    complete:
        (
            size: keyof FontConfig["sizes"],
            weight: keyof FontConfig["weights"]
        ) =>
        (selection: any) =>
            selection
                .attr("font-family", fontConfig.family)
                .attr("font-size", `${fontConfig.sizes[size]}px`)
                .attr("font-weight", fontConfig.weights[weight]),
});

export const applyFont: ApplyFontHelpers = createFontHelpers(ACTIVE_FONTS);

export const applyFontPreset = (preset: FontPresetName): ApplyFontHelpers =>
    createFontHelpers(FONT_PRESETS[preset]);

export const loadWebFonts = async (): Promise<void> => {
    const fontLinks = [
        "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
        "https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap",
        "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;600&display=swap",
    ];

    fontLinks.forEach((href) => {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            document.head.appendChild(link);
        }
    });

    if ("fonts" in document) {
        try {
            await document.fonts.ready;
            console.log("Visualization fonts loaded successfully");
        } catch (error) {
            console.warn("Font loading failed, using fallbacks:", error);
        }
    }
};

export const fontUrlMapping = {
    Inter: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff2",
    Arial: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff2",
    "sans-serif":
        "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff2",
    "-apple-system":
        "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff2",
    "Helvetica Neue":
        "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff2",
    Roboto: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff2",

    Merriweather:
        "https://cdn.jsdelivr.net/npm/@fontsource/merriweather@5.0.13/files/merriweather-latin-400-normal.woff2",
    Georgia:
        "https://cdn.jsdelivr.net/npm/@fontsource/merriweather@5.0.13/files/merriweather-latin-400-normal.woff2",
    serif: "https://cdn.jsdelivr.net/npm/@fontsource/merriweather@5.0.13/files/merriweather-latin-400-normal.woff2",
    "Times New Roman":
        "https://cdn.jsdelivr.net/npm/@fontsource/merriweather@5.0.13/files/merriweather-latin-400-normal.woff2",

    "Roboto Mono":
        "https://cdn.jsdelivr.net/npm/@fontsource/roboto-mono@5.0.18/files/roboto-mono-latin-400-normal.woff2",
    "SF Mono":
        "https://cdn.jsdelivr.net/npm/@fontsource/roboto-mono@5.0.18/files/roboto-mono-latin-400-normal.woff2",
    Monaco: "https://cdn.jsdelivr.net/npm/@fontsource/roboto-mono@5.0.18/files/roboto-mono-latin-400-normal.woff2",
    monospace:
        "https://cdn.jsdelivr.net/npm/@fontsource/roboto-mono@5.0.18/files/roboto-mono-latin-400-normal.woff2",
    "Courier New":
        "https://cdn.jsdelivr.net/npm/@fontsource/roboto-mono@5.0.18/files/roboto-mono-latin-400-normal.woff2",
};
