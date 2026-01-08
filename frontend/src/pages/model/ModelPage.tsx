import ManualPage from "@/pages/model/ManualPage";
import PredictPage from "@/pages/model/PredictPage";
import TrainPage from "@/pages/model/TrainPage";
import type { ModelPage as ModelPageType } from "@/types/story";

type ModelPageProps = Omit<
    ModelPageType,
    "dynamic_type" | "page_type" | "viz_only"
>;

const ModelPage: React.FC<ModelPageProps> = ({
    model_name,
    component_type,
    parameters,
}) => {
    if (component_type == "predict") {
        return (
            <PredictPage
                model_name={model_name}
                parameters={parameters}
            />
        );
    } else if (component_type == "train") {
        return (
            <TrainPage
                model_name={model_name}
                parameters={parameters}
            />
        );
    } else if (component_type == "manual") {
        return (
            <ManualPage
                model_name={model_name}
                parameters={parameters}
            />
        );
    }
};

export default ModelPage;
