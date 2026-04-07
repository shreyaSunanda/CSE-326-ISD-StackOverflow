import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./MarkdownElement.css";

const MarkdownElement = ({ children }) => {
	return (
		<div className="markdown-element">
			<ReactMarkdown disallowedElements={["hr"]} remarkPlugins={[remarkGfm]}>
				{children || ""}
			</ReactMarkdown>
		</div>
	);
};

export default MarkdownElement;
