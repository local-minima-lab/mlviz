import NavigationButton from "@/components/navigation/NavigationButton";
import { Separator } from "@/components/ui/separator";
import { CurrentStoryContext } from "@/contexts/StoryContext";
import type { Edge } from "@/types/story";
import { displayCondition, isConditionMet } from "@/utils/conditions";
import { Route } from "lucide-react";
import { useContext } from "react";

interface NavigationBarProps {
    edges: Edge[];
    handler: (h: number) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ edges, handler }) => {
    const context = useContext(CurrentStoryContext);
    if (!context) throw new Error("Must be within CurrentStoryProvider");
    const { storyState } = context;

    const completeEdges = edges.filter((a) =>
        isConditionMet(a.condition, storyState.params),
    );
    const incompleteEdges = edges.filter(
        (a) => !isConditionMet(a.condition, storyState.params),
    );

    return (
        <div className="p-4 w-full flex flex-col items-center">
            <p className="text-xl text-slate-500 flex items-center gap-2 mb-4">
                <Route className="h-4 w-4" /> Pathways
            </p>
            <div className="h-full w-full overflow-hidden flex flex-col gap-2">
                {completeEdges.map((edge) => (
                    <NavigationButton
                        key={displayCondition(edge.condition)}
                        edge={edge}
                        handler={handler}
                    />
                ))}
                {completeEdges && incompleteEdges && <Separator />}
                {incompleteEdges.map((edge) => (
                    <NavigationButton
                        key={displayCondition(edge.condition)}
                        edge={edge}
                        handler={handler}
                    />
                ))}
            </div>
        </div>
    );
};

export default NavigationBar;
