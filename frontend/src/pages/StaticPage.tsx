import MarkdownWrapper from "@/components/markdown/MarkdownWrapper";
import type { StaticPageParameters } from "@/types/story";
import React from "react";

const StaticPage: React.FC<StaticPageParameters> = ({ text }) => {
    return (
        <div className="flex justify-center items-center h-full w-full bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="w-3/5">
                <MarkdownWrapper>{text}</MarkdownWrapper>
            </div>
        </div>
    );
};

export default StaticPage;
