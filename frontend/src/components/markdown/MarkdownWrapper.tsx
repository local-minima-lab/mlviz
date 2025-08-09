import Markdown, { type Components, type ExtraProps } from "react-markdown";

interface MarkdownWrapperProps {
    children: string;
}

type ParagraphProps = React.ComponentProps<"p"> & ExtraProps;

const Paragraph: React.FC<ParagraphProps> = ({ children, node, ...props }) => {
    return (
        <p
            className="text-gray-800 tracking-tight text-2xl font-light"
            {...props}
        >
            {children}
        </p>
    );
};

type Heading1Props = React.ComponentProps<"h1"> & ExtraProps;

const Heading1: React.FC<Heading1Props> = ({ children, node, ...props }) => {
    return (
        <h1
            className="text-gray-800 font-bold text-6xl mb-2 tracking-tight bg-gradient-to-r from-gray-600 to-stone-700 bg-clip-text text-transparent font-width-expanded"
            {...props}
        >
            {children}
        </h1>
    );
};

const ComponentMap: Components = {
    p: Paragraph,
    h1: Heading1,
};

const MarkdownWrapper: React.FC<MarkdownWrapperProps> = ({ children }) => {
    return <Markdown components={ComponentMap}>{children}</Markdown>;
};

export default MarkdownWrapper;
