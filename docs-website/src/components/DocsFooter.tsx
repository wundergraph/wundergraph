import { useRouter } from 'next/router'
import { GitHubIcon } from './icons/Github'

const githubBranch = 'main'
const githubBaseUrl = `https://github.com/wundergraph/wundergraph/edit/${githubBranch}/docs-website/src/pages`

export const DocsFooter = ({ isIndexFile = false }) => {
	const router = useRouter()

	return (
		<>
			<div className="space-y-4 text-sm font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 sm:flex sm:justify-between sm:space-y-0">
				<p className="m-0">
					Was this article helpful to you? <br />{' '}
					<a
						href="https://github.com/wundergraph/wundergraph/issues"
						className="mt-2 inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
						target="_blank"
						rel="noreferrer"
					>
						<span className="inline-block">
							<GitHubIcon className="h-4 w-4 fill-slate-400 group-hover:fill-slate-500 dark:group-hover:fill-slate-300" />
						</span>
						<span>Provide feedback</span>
					</a>
				</p>
				<p className="m-0 text-right">
					<a
						href={`${githubBaseUrl}${router.pathname}${
							isIndexFile ? 'index.md' : '.md'
						}`}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
					>
						<span className="inline-block">
							<GitHubIcon className="h-4 w-4 fill-slate-400 group-hover:fill-slate-500 dark:group-hover:fill-slate-300" />
						</span>
						<span>Edit this page</span>
					</a>
				</p>
			</div>
		</>
	)
}
