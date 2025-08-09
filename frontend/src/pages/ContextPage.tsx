import React from "react";

interface ContextPageProps {
    text: string;
}

const ContextPage: React.FC<ContextPageProps> = ({ text }) => {
    return (
        <div className="flex justify-center items-center h-full w-full">
            <p>{text}</p>
        </div>
    );
};

export default ContextPage;
