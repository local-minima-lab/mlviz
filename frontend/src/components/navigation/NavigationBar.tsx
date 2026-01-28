import NavigationButton from "@/components/navigation/NavigationButton";
import { Separator } from "@/components/ui/separator";
import { CurrentStoryContext } from "@/contexts/StoryContext";
import type { Edge } from "@/types/story";
import { displayCondition, isConditionMet } from "@/utils/conditions";
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
        isConditionMet(a.condition, storyState.params)
    );
    const incompleteEdges = edges.filter(
        (a) => !isConditionMet(a.condition, storyState.params)
    );

    return (
        <div className="p-2 w-full">
            <p className="text-2xl pt-2 pb-4 text-center">Pathways</p>
            <div className="h-full overflow-scroll flex flex-col gap-2">
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
