import React from 'react';
import { CodeSnippet, CodeWindow } from './CodeWindow';

interface DeployButtonGeneratorProps {}

export const DeployButtonGenerator = (props: DeployButtonGeneratorProps) => {
	const [url, setUrl] = React.useState<string | undefined>('');
	const snippets = React.useMemo<CodeSnippet[]>(() => {
		const encodedUrl = encodeURIComponent(
			url || 'https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs'
		);
		return [
			{
				filename: 'Markdown',
				content: `[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?repositoryUrl=${encodedUrl})`,
				language: 'markdown',
			},
			{
				filename: 'HTML',
				content: `<a
    href="https://cloud.wundergraph.com/new/clone?repositoryUrl=${encodedUrl}"
    ><img src="https://wundergraph.com/button" alt="Deploy to WunderGraph"
/></a>`,
				language: 'handlebars',
			},
			{
				filename: 'URL',
				content: `https://cloud.wundergraph.com/new/clone?repositoryUrl=${encodedUrl}`,
				language: 'bash',
			},
		];
	}, [url]);

	return (
		<div className="space-y-4">
			<CodeWindow snippets={snippets}></CodeWindow>

			<div className="flex flex-col space-y-1">
				<label htmlFor="url">Repository URL</label>
				<input
					type="text"
					id="url"
					name="url"
					className="text-md block w-full flex-1 rounded-md border border-gray-300 px-2 py-1 placeholder-gray-400 transition focus:border-sky-500 focus:ring-sky-500 disabled:cursor-not-allowed hover:border-gray-400 hover:focus:border-sky-500 disabled:hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-sky-500 hover:dark:border-gray-500 dark:hover:focus:border-sky-500 dark:disabled:hover:border-gray-600"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs"
				/>
			</div>
		</div>
	);
};
