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
    const { setDataset } = useDataset();
    const { config } = useConfig();

    // Resolve dataset if it's a reference
    const resolvedDataset = page.dataset?.type === "reference" 
        ? config?.datasets?.[page.dataset.name] 
        : page.dataset;

    // Set the dataset from page parameters when the page loads
    useEffect(() => {
        if (resolvedDataset) {
            console.log("[DynamicPage] Setting dataset:", resolvedDataset);
            setDataset(resolvedDataset);
        }
    }, [resolvedDataset, setDataset]);

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

