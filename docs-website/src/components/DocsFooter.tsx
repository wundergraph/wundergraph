import { useRouter } from 'next/router';
import { GitHubIcon } from './icons/Github';

const githubBranch = 'main';
const githubBaseUrl = `https://github.com/wundergraph/wundergraph/edit/${githubBranch}/docs-website/src/pages`;

export const DocsFooter = ({ isIndexFile = false }) => {
	const router = useRouter();

	return (
		<>
			<div className="space-y-4 text-sm font-semibold text-gray-400 hover:text-gray-600 dark:text-gray-500 sm:flex sm:justify-between sm:space-y-0">
				<p className="m-0">
					Was this article helpful to you? <br />{' '}
					<a
						href="https://github.com/wundergraph/wundergraph/issues"
						className="mt-2 inline-flex items-center space-x-2 text-sm font-semibold text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
						target="_blank"
						rel="noreferrer"
					>
						<span className="inline-block">
							<GitHubIcon className="h-4 w-4 fill-gray-400 group-hover:fill-gray-500 dark:group-hover:fill-gray-300" />
						</span>
						<span>Provide feedback</span>
					</a>
				</p>
				<p className="m-0 text-right">
					<a
						href={`${githubBaseUrl}${router.pathname}${isIndexFile ? '/index.md' : '.md'}`}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
					>
						<span className="inline-block">
							<GitHubIcon className="h-4 w-4 fill-gray-400 group-hover:fill-gray-500 dark:group-hover:fill-gray-300" />
						</span>
						<span>Edit this page</span>
					</a>
				</p>
			</div>
		</>
	);
};
