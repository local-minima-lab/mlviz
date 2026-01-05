import { ManualComponent } from "@/components/ManualComponent";
import type { ModelPage as ModelPageProps } from "@/types/story";
import React from "react";

type ManualPageProps = Pick<ModelPageProps, "model_name" | "parameters">;

const ManualPage: React.FC<ManualPageProps> = ({ model_name }) => {
    return (
        <div className="flex flex-col h-full">
            <ManualComponent componentName={model_name} />
        </div>
    );
};

export default ManualPage;