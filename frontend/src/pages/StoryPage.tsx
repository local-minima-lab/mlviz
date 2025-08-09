import config from "@/assets/config.json";
import { StoryComponent } from "@/components/StoryComponent";
import { Button } from "@/components/ui/button";
import type { Story, StoryConfig } from "@/types/story";
import { ChevronLeft, ChevronRight, House } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export const StoryPage: React.FC = () => {
    const { storyName } = useParams<{ storyName: string }>();

    const storyConfig = config as StoryConfig;
    const stories: Record<string, Story> = storyConfig.stories; // Get the dictionary of stories

    // Access the story directly using the key from the URL parameters
    const story: Story | undefined = storyName ? stories[storyName] : undefined;

    if (!story) {
        return (
            <div className="p-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Story Not Found</h1>
                <p className="text-lg text-gray-700">
                    The requested story with identifier '{storyName}' does not
                    exist.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    Please check the URL or go back to the{" "}
                    <a
                        href="/"
                        className="text-blue-600 hover:underline"
                    >
                        main page
                    </a>
                    .
                </p>
            </div>
        );
    }
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const currentPage = story.pages[currentPageIndex];

    useEffect(() => {
        localStorage.clear();
    }, []);

    const handlePrevious = () => {
        setCurrentPageIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentPageIndex((prev) =>
            Math.min(story.pages.length - 1, prev + 1)
        );
    };

    return (
        <div className="h-dvh flex flex-col overflow-hidden">
            <div className="h-[5dvh] flex flex-row justify-between items-center p-2 bg-gray-100">
                <Button
                    className="bg-gradient-to-r from-gray-50 to-stone-50 text-gray-800 hover:from-fuchsia-500 hover:to-cyan-500 hover:text-white transition-all duration-100 hover:shadow-2xl size-8"
                    size="icon"
                    onClick={handlePrevious}
                    disabled={currentPageIndex === 0}
                >
                    <ChevronLeft />
                </Button>

                <p className="font-light tracking-widest">
                    {currentPageIndex + 1}/{story.pages.length}
                </p>

                <Button
                    className="bg-gradient-to-r from-gray-50 to-stone-50 text-gray-800 hover:from-fuchsia-500 hover:to-cyan-500 hover:text-white transition-all duration-100 hover:shadow-2xl size-8"
                    size="icon"
                    onClick={handleNext}
                    disabled={currentPageIndex === story.pages.length - 1}
                >
                    <ChevronRight />
                </Button>
            </div>
            <div className="h-[90dvh] flex flex-col">
                <StoryComponent
                    componentName={currentPage.component}
                    parameters={currentPage.parameters}
                />
            </div>

            <div className="h-[5dvh] flex flex-row justify-between items-center p-2 bg-gray-100">
                <p className="px-4 font-medium text-xs">{story.name}</p>
                <Link to={"/"}>
                    <Button
                        className="bg-gradient-to-r from-gray-50 to-stone-50 text-gray-800 hover:from-fuchsia-500 hover:to-cyan-500 hover:text-white transition-all duration-100 hover:shadow-2xl size-8"
                        size="icon"
                    >
                        <House />
                    </Button>
                </Link>
            </div>
        </div>
    );
};
