import MarkdownWrapper from "@/components/markdown/MarkdownWrapper";
import React from "react";

interface ContextPageProps {
    text: string;
}

const ContextPage: React.FC<ContextPageProps> = ({ text }) => {
    return (
        <div className="flex justify-center items-center h-full w-full bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="w-3/5">
                <MarkdownWrapper>{text}</MarkdownWrapper>
            </div>
        </div>
    );
};

export default ContextPage;
