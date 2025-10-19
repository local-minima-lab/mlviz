import config from "@/assets/config.json";
import { CurrentStoryProvider, StoryContext } from "@/contexts/StoryContext";
import { StoryPage } from "@/pages/StoryPage";
import type { Config, PageUnion, Story } from "@/types/story";
import { useContext } from "react";
import { useLocation, useParams } from "react-router-dom";

const StoryPageWrapper: React.FC = () => {
    const { storyName } = useParams<{ storyName: string }>();
    if (!storyName) throw new Error("No story name");

    const location = useLocation();

    const storyConfig = config as Config;
    const stories: Record<string, Story> = storyConfig.stories;
    const pages: Record<string, PageUnion> = storyConfig.pages;

    const context = useContext(StoryContext);
    if (!context) throw new Error("Must be within StoryProvider");

    const story: Story | undefined = storyName ? stories[storyName] : undefined;

    if (!story) {
        return <div>Story not found</div>;
    }

    const initialPageId = location.state?.local_index ?? story.start_page;

    const pageKey = `${storyName}-${initialPageId}`;

    return (
        <CurrentStoryProvider
            storyId={storyName}
            key={pageKey}
        >
            <StoryPage
                story={story}
                pages={pages}
                initialPageId={initialPageId}
            />
        </CurrentStoryProvider>
    );
};

export default StoryPageWrapper;
