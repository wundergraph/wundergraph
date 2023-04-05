import * as React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import Highlight, { defaultProps, Language } from 'prism-react-renderer';
import copy from 'copy-to-clipboard';
import { Card, CardProps } from './Card';
import clsx from 'clsx';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/solid';

export type CodeSnippet = {
	filename: string;
	content: string;
	language: Language;
};

export interface CodeWindowProps extends Omit<CardProps, 'children'> {
	snippets: readonly CodeSnippet[];
	hideCopy?: boolean;
}

export const CodeWindow: React.FC<CodeWindowProps> = ({ snippets, hideCopy, ...rest }) => {
	const [copied, setCopied] = React.useState(false);
	const ref = React.useRef<any>(null);

	React.useEffect(() => {
		if (copied) {
			copy(ref.current);
			const to = setTimeout(setCopied, 1000, false);
			return () => clearTimeout(to);
		}
	}, [copied]);

	return (
		<Card dark {...rest}>
			<Tabs.Root defaultValue={snippets[0].filename}>
				<Tabs.List aria-label="Select file to view" className="flex flex-nowrap justify-between overflow-x-auto">
					<div className="flex">
						<div className="flex h-10 items-center space-x-1.5 border-r border-b border-gray-900 px-4 dark:border-gray-900">
							<span className="h-3 w-3 rounded-full bg-gray-500 dark:bg-gray-600" />
							<span className="h-3 w-3 rounded-full bg-gray-500 dark:bg-gray-600" />
							<span className="h-3 w-3 rounded-full bg-gray-500 dark:bg-gray-600" />
						</div>

						{snippets.map(
							({ filename }, index) =>
								filename && (
									<Tabs.Trigger
										key={index}
										value={filename}
										className="relative flex h-10 shrink-0 items-center border-r border-b border-gray-800 px-4 text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 radix-state-active:border-b-transparent radix-state-active:bg-gray-800 dark:border-gray-900 dark:text-gray-400 dark:focus:ring-sky-900 dark:radix-state-active:bg-gray-800"
									>
										{filename}
									</Tabs.Trigger>
								)
						)}
					</div>
					{!hideCopy && (
						<div className="flex h-10 w-10 items-center justify-center">
							<button
								onClick={() => setCopied(true)}
								title="Copy to clipboard"
								className="h-5 w-5 flex-shrink-0 text-gray-300 dark:text-gray-300"
								aria-hidden="true"
							>
								{!copied ? <ClipboardIcon /> : <CheckIcon />}
							</button>
						</div>
					)}
				</Tabs.List>
				<div>
					{snippets.map(({ filename, content, language }, index) => (
						<Tabs.Content key={index} value={filename} className="flex overflow-y-hidden focus:outline-none">
							<div className="w-8 shrink-0 grow-0 bg-gray-800 pt-[19px] pb-3 text-right font-mono text-sm leading-none text-gray-300 dark:bg-[#0d1116] dark:text-gray-600">
								{[...new Array(content.trimEnd().split(/\r?\n/).length)].map((v, index) => (
									<div key={index} className="h-[20px] px-2">
										{index + 1}
									</div>
								))}
							</div>
							<ScrollArea.Root className="w-full overflow-auto bg-gray-800 dark:bg-[#0D1116]">
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
