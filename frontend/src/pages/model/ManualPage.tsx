import ClassifierResults from "@/components/ClassifierResults";
import { ManualComponent } from "@/components/ManualComponent";
import { useModel } from "@/contexts/ModelContext";
import type { ModelPage as ModelPageProps } from "@/types/story";
import React from "react";

type ManualPageProps = Pick<ModelPageProps, "model_name" | "parameters">;

const ManualPage: React.FC<ManualPageProps> = ({ model_name }) => {

    const {
            currentModelData,
        } = useModel();

    return (
        <div className="grid grid-cols-10 mx-auto w-full h-full">
            <div className="col-span-8 shadow-lg overflow-hidden">
                <ManualComponent componentName={model_name} />
            </div>

            <div className="col-span-2 p-4 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
                <ClassifierResults data={currentModelData} />
            </div>
        </div>
    );
};

export default ManualPage;