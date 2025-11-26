import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardTitle } from "@/components/ui/card";
import { CurrentStoryContext } from "@/contexts/StoryContext";
import type { Edge } from "@/types/story";
import { displayCondition, isConditionMet } from "@/utils/conditions";
import { CheckCircle, XCircle } from "lucide-react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

interface NavigationButtonProps {
    edge: Edge;
    handler: (h: number) => void;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
    edge,
    handler,
}) => {
    const context = useContext(CurrentStoryContext);
    if (!context) throw new Error("Must be within CurrentStoryProvider");
    const { storyState, addEdge } = context;

    const navigate = useNavigate();

    const isNavigable = isConditionMet(edge.condition, storyState.params);

    const goToNextPage = () => {
        const edgeNode = edge.end;
        if (isNavigable) {
            addEdge(edge.start);
            if (edgeNode.story_name) {
                navigate(`/story/${edgeNode.story_name}`, {
                    state: {
                        local_index: edgeNode.local_index,
                    },
                    replace: true,
                });
            } else {
                handler(edgeNode.local_index);
            }
        }
    };

    return (
        <Button
            asChild
            disabled={!isNavigable}
            onClick={goToNextPage}
            className={`
             w-full min-h-[10dvh] h-auto py-3 transition-all duration-100 shadow-lg hover:shadow-2xl text-sm tracking-tight
            ${
                isNavigable
                    ? `
                        border-0 bg-gradient-to-br from-emerald-200 to-teal-100 text-stone-800
                        hover:bg-gradient-to-br hover:from-teal-500 hover:to-emerald-500 hover:text-white hover:shadow-2xl
                    `
                    : `
                        border-0 bg-gradient-to-br from-grey-100 to-stone-200 text-stone-800
                        hover:bg-gradient-to-br hover:from-grey-100 hover:to-stone-200
                        cursor-not-allowed
                        `
            }
        `}
        >
            <Card
                key={`${edge.end.story_name}_${edge.end.local_index}`}
                className="flex flex-col justify-start items-start shadow-none w-full"
            >
                <CardTitle className="flex items-center font-normal text-wrap gap-2 px-2">
                    {isNavigable ? (
                        edge.condition.condition_type === "Slide" ? (
                            edge.condition.slide_name
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Complete
                            </>
                        )
                    ) : (
                        <>
                            <XCircle className="w-5 h-5" />
                            Incomplete
                        </>
                    )}
                </CardTitle>

                <CardFooter className="text-sm text-left px-2 py-2 font-light leading-tight whitespace-normal break-words">
                    {displayCondition(edge.condition)}
                </CardFooter>
            </Card>
        </Button>
    );
};

export default NavigationButton;
