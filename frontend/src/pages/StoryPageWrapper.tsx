import { Button } from "@/components/ui/button";
import { useConfig } from "@/contexts/ConfigContext";
import { CurrentStoryProvider, StoryContext } from "@/contexts/StoryContext";
import { StoryPage } from "@/pages/StoryPage";
import type { PageUnion, Story } from "@/types/story";
import { useContext } from "react";
import { useLocation, useParams } from "react-router-dom";

const StoryPageWrapper: React.FC = () => {
    const { config: storyConfig, loading, error } = useConfig();
    const { storyName } = useParams<{ storyName: string }>();
    const location = useLocation();
    const context = useContext(StoryContext);

    if (!storyName) throw new Error("No story name");

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-fuchsia-50">
                <div className="animate-pulse text-2xl font-mono text-fuchsia-600">
                    Loading story...
                </div>
            </div>
        );
    }

    if (error || !storyConfig) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-fuchsia-50">
                <div className="text-2xl font-mono text-red-600 mb-4">
                    Error loading config
                </div>
                <div className="text-sm font-mono text-gray-600 mb-8">
                    {error || "Config not found"}
                </div>
                <Button
                    onClick={() => {
                        window.location.href = "/";
                    }}
                    className="bg-white text-gray-800 hover:bg-gray-100 border border-gray-200 rounded-full px-6"
                >
                    Return to Home (Default Config)
                </Button>
            </div>
        );
    }

    const stories: Record<string, Story> = storyConfig.stories;
    const pages: Record<string, PageUnion> = storyConfig.pages;

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
