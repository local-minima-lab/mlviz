import ModelPage from "@/pages/model/ModelPage";
import type { DynamicPageUnion } from "@/types/story";
import React from "react";

interface DynamicPageProps {
    page: DynamicPageUnion;
}

const DynamicPage: React.FC<DynamicPageProps> = ({ page }) => {
    if (page.dynamic_type == "none") {
        return <></>;
    } else if (page.dynamic_type == "model") {
        return (
            <ModelPage
                model_name={page.model_name}
                component_type={page.component_type}
                parameters={page.parameters}
            />
        );
    }
};

export default DynamicPage;
