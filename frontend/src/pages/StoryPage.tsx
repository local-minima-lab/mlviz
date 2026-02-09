import NavigationBar from "@/components/navigation/NavigationBar";
import { Button } from "@/components/ui/button";
import DynamicPage from "@/pages/DynamicPage";
import StaticPage from "@/pages/StaticPage";
import type { Edge, PageUnion, Story } from "@/types/story";
import { House } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface StoryPageProps {
    story: Story;
    pages: Record<string, PageUnion>;
    initialPageId: number;
}

export const StoryPage: React.FC<StoryPageProps> = ({
    story,
    pages,
    initialPageId,
}) => {
    const [currentPageId, setCurrentPageId] = useState<number>(initialPageId);

    const currentPage = pages[story.nodes[currentPageId].index];

    const getAvailableEdges = (): Edge[] => {
        return story.edges.filter(
            (edge) => edge.start.local_index === currentPageId,
        );
    };

    const renderPage = () => {
        if (!currentPage) {
            return (
                <div className="p-4 text-center">
                    <h1 className="text-2xl font-bold">Page Not Found</h1>
                    <p>Page {currentPageId} does not exist.</p>
                </div>
            );
        }

        if (currentPage.page_type === "static") {
            return <StaticPage {...currentPage.parameters} />;
        } else if (currentPage.page_type === "dynamic") {
            return <DynamicPage page={currentPage} />;
        }
    };

    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-row justify-between items-center bg-gray-200 overflow-hidden">
                <div className="h-full w-[85dvw] flex flex-col">
                    {renderPage()}
                </div>
                <div className="h-full w-[15dvw] flex flex-col gap-2 items-center overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50">
                    <NavigationBar
                        edges={getAvailableEdges()}
                        handler={setCurrentPageId}
                    />
                </div>
            </div>

            <footer className="shrink-0 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm tracking-tight">
                <p className="bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent font-semibold font-mono">
                    story/{story.name}
                </p>
                <Link to={"/"}>
                    <Button
                        className="bg-gradient-to-br from-gray-50 to-stone-50 text-gray-800 hover:from-blue-500 hover:to-purple-500 hover:text-white transition-all duration-100 hover:shadow-2xl size-8"
                        size="icon"
                    >
                        <House />
                    </Button>
                </Link>
            </footer>
        </div>
    );
};
