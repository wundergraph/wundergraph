import * as React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import Highlight, { defaultProps, Language } from 'prism-react-renderer';
import copy from 'copy-to-clipboard';
import { Card, CardProps } from './Card';
import clsx from 'clsx';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/solid';
import { SiGraphql, SiTypescript } from '@icons-pack/react-simple-icons';

export type CodeSnippet = {
	filename: string;
	content: string;
	language: Language;
};

export interface CodeWindowProps extends Omit<CardProps, 'children'> {
	snippets: readonly CodeSnippet[];
	hideCopy?: boolean;
}

const icons: Record<string, React.ReactElement> = {
	typescript: <SiTypescript />,
	tsx: <SiTypescript />,
	ts: <SiTypescript />,
	graphql: <SiGraphql />,
};

export const CodeWindow: React.FC<CodeWindowProps> = ({ snippets, hideCopy, ...rest }) => {
	const [copied, setCopied] = React.useState(false);
	const ref = React.useRef<any>(null);
	const tabsRef = React.useRef<any>(null);

	const [activeTab, setActiveTab] = React.useState(snippets[0].filename);

	React.useEffect(() => {
		if (copied) {
			copy(ref.current);
			const to = setTimeout(setCopied, 1000, false);
			return () => clearTimeout(to);
		}
	}, [copied]);

	React.useEffect(() => {
		setActiveTab(snippets[0].filename);
	}, [snippets]);

	return (
		<Card dark {...rest}>
			<Tabs.Root value={activeTab} onValueChange={setActiveTab} ref={tabsRef}>
				<Tabs.List
					aria-label="Select file to view"
					className="b-bottom flex flex-nowrap justify-between overflow-x-auto px-1.5 pt-1.5 dark:bg-gray-950"
				>
					<div className="flex space-x-1">
						{snippets.map(
							({ filename, language }, index) =>
								filename && (
									<Tabs.Trigger
										key={index}
										value={filename}
										className="dark:border-gray-000 relative flex h-10 shrink-0 items-center rounded-t-md border-x border-t border-gray-800 px-4 text-sm text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 radix-state-active:border-b-transparent radix-state-active:bg-gray-600 dark:text-gray-400  dark:focus-visible:ring-pink-500/30 dark:radix-state-active:bg-[#171632] dark:radix-state-active:text-gray-100 dark:hover:text-gray-200"
									>
										{icons[language] && (
											<span className="mr-2 inline-flex h-3.5 w-3.5 items-center">{icons[language]}</span>
										)}{' '}
										{filename}
									</Tabs.Trigger>
								)
						)}
					</div>
					{!hideCopy && (
						<div className="flex h-8 w-8 items-center justify-center">
							<button
								onClick={() => setCopied(true)}
								className="h-5 w-5 flex-shrink-0 text-gray-300 opacity-80 hover:opacity-100 dark:text-gray-300"
								aria-hidden="true"
							>
								{!copied ? <ClipboardIcon /> : <CheckIcon />}
							</button>
						</div>
					)}
				</Tabs.List>
				<div className="max-h-[600px] overflow-y-auto">
					{snippets.map(({ filename, content, language }, index) => (
						<Tabs.Content key={index} value={filename} className="flex overflow-y-hidden focus:outline-none">
							<div className="w-8 shrink-0 grow-0 bg-gray-800 pt-[19px] pb-3 text-right font-mono text-sm leading-none text-gray-300 dark:bg-[#171632] dark:text-gray-600">
								{[...new Array(content.trimEnd().split(/\r?\n/).length)].map((v, index) => (
									<div key={index} className="h-[20px] px-2">
										{index + 1}
									</div>
								))}
							</div>
							<ScrollArea.Root className="w-full overflow-auto bg-gray-800 dark:bg-[#171632]">
								<ScrollArea.Viewport>
									<div className="not-prose mt-4 flex items-start px-1 text-sm">
										<Highlight {...defaultProps} code={content.trimEnd()} language={language} theme={undefined}>
											{({ className, style, tokens, getLineProps, getTokenProps }) => (
												<pre
													className={clsx(className, 'flex overflow-x-auto pb-6')}
													style={style}
													ref={() => (ref.current = content.trimEnd())}
												>
													<code className="px-4">
														{tokens.map((line, index) => (
															<div key={index} {...getLineProps({ line })}>
																{line.map((token, index) => (
																	<span key={index} {...getTokenProps({ token })} />
																))}
															</div>
														))}
													</code>
												</pre>
											)}
										</Highlight>
									</div>
								</ScrollArea.Viewport>
								<ScrollArea.Scrollbar orientation="horizontal">
									<ScrollArea.Thumb className="relative" />
								</ScrollArea.Scrollbar>
								<ScrollArea.Corner />
							</ScrollArea.Root>
						</Tabs.Content>
					))}
				</div>
			</Tabs.Root>
		</Card>
	);
};
