import Markdown, { type Components, type ExtraProps } from "react-markdown";
import rehypeMathjax from "rehype-mathjax";
import remarkMath from "remark-math";

interface MarkdownWrapperProps {
    children: string;
}

type ParagraphProps = React.ComponentProps<"p"> & ExtraProps;

const Paragraph: React.FC<ParagraphProps> = ({ children, node, ...props }) => {
    return (
        <p
            className="text-gray-800 text-xl tracking-tight font-light mb-4"
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
            className="font-bold text-6xl mb-2 tracking-tight bg-gradient-to-br from-blue-600 to-purple-700 bg-clip-text text-transparent font-width-expanded border-l-4 border-blue-600 pl-4 mb-6"
            {...props}
        >
            {children}
        </h1>
    );
};

type Heading2Props = React.ComponentProps<"h2"> & ExtraProps;

const Heading2: React.FC<Heading2Props> = ({ children, node, ...props }) => {
    return (
        <h2
            className="font-bold text-4xl mb-2 tracking-tight bg-gradient-to-br from-purple-600 to-indigo-500 bg-clip-text text-transparent font-width-expanded border-l-4 border-purple-600 pl-4 mb-5"
            {...props}
        >
            {children}
        </h2>
    );
};

type Heading3Props = React.ComponentProps<"h3"> & ExtraProps;

const Heading3: React.FC<Heading3Props> = ({ children, node, ...props }) => {
    return (
        <h3
            className="font-bold text-3xl mb-2 tracking-tight bg-gradient-to-br from-indigo-500 to-fuchsia-400 bg-clip-text text-transparent font-width-expanded border-l-4 border-indigo-500 pl-4 mb-4"
            {...props}
        >
            {children}
        </h3>
    );
};

type Heading4Props = React.ComponentProps<"h4"> & ExtraProps;

const Heading4: React.FC<Heading4Props> = ({ children, node, ...props }) => {
    return (
        <h4
            className="font-bold text-2xl mb-2 tracking-tight bg-gradient-to-br from-fuchsia-400 to-blue-300 bg-clip-text text-transparent font-width-expanded border-l-4 border-fuchsia-400 pl-4 mb-4"
            {...props}
        >
            {children}
        </h4>
    );
};

const ComponentMap: Components = {
    p: Paragraph,
    h1: Heading1,
    h2: Heading2,
    h3: Heading3,
    h4: Heading4,
};

const MarkdownWrapper: React.FC<MarkdownWrapperProps> = ({ children }) => {
    return (
        <Markdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeMathjax]}
            components={ComponentMap}
        >
            {children}
        </Markdown>
    );
};

export default MarkdownWrapper;
