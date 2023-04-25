import { Language } from 'prism-react-renderer';
import { CardProps } from './Card';
import * as React from 'react';
import { CodeWindow } from './CodeWindow';

interface CodeBlockProps extends CardProps {
	children: string;
	language: Language;
	filename: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, language, filename, ...rest }) => {
	return <CodeWindow snippets={[{ filename, content: children, language }]} {...rest} />;
};
