import { useConfig } from "@/contexts/ConfigContext";
import { useDataset } from "@/contexts/DatasetContext";
import { ModelNameProvider, ModelProvider } from "@/contexts/ModelContext";
import ModelPage from "@/pages/model/ModelPage";
import type { DynamicPageUnion } from "@/types/story";
import React, { useEffect } from "react";

interface DynamicPageProps {
    page: DynamicPageUnion;
}

const DynamicPage: React.FC<DynamicPageProps> = ({ page }) => {
    const { activeDataset, setDataset } = useDataset();
    const { config } = useConfig();

    // Resolve dataset if it's a reference
    const resolvedDataset =
        page.dataset?.type === "reference"
            ? config?.datasets?.[page.dataset.name]
            : page.dataset;

    useEffect(() => {
        if (resolvedDataset) {
            console.log("[DynamicPage] Setting dataset:", resolvedDataset);
            setDataset(resolvedDataset);
        }
    }, [resolvedDataset, setDataset]);

    // Wait until the dataset context has been updated before rendering children.
    // Without this gate, children mount and read the old/null activeDataset
    // before the useEffect above has propagated the new value.
    if (resolvedDataset && activeDataset !== resolvedDataset) {
        return null;
    }

    if (page.dynamic_type == "none") {
        return <></>;
    } else if (page.dynamic_type == "model") {
        return (
            <ModelProvider model_name={page.model_name}>
                <ModelNameProvider value={page.model_name}>
                    <ModelPage
                        model_name={page.model_name}
                        component_type={page.component_type}
                        parameters={page.parameters}
                        problem_type={page.problem_type}
                        dataset={resolvedDataset}
                    />
                </ModelNameProvider>
            </ModelProvider>
        );
    }
};

export default DynamicPage;
