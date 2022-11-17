import { NextPage } from 'next';
import { useAuth, useQuery, withWunderGraph } from '../components/generated/nextjs';

const Home: NextPage = () => {
	const result = useQuery({
		operationName: 'Dragons',
	});

	const { login, logout } = useAuth();

	const loginGithub = () => {
		login('github');
	};
	const logoutGithub = () => {
		logout();
	};
	const getDragons = () => {
		result.mutate();
	};

	return (
		<div>
			<div className="relative max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-32">
				<div className="flex justify-center">
					<div className="w-40 text-cyan-400 dark:text-white">
						<svg
							version="1.1"
							id="Layer_1"
							xmlns="http://www.w3.org/2000/svg"
							xmlnsXlink="http://www.w3.org/1999/xlink"
							x="0px"
							y="0px"
							viewBox="0 0 1000 1000"
							enableBackground="new 0 0 1000 1000"
							xmlSpace="preserve"
						>
							<path
								fill="currentColor"
								d="M675.4,473.2l-53.6,91l-68.5-116.7L484.9,564l-118.1-204c42.4-56.8,110.1-93.4,186.5-93.4
	c45.8,0,88.5,13.2,124.6,35.9c-0.7,3.8-1.1,7.6-1.1,11.6c0,34.4,27.9,62.2,62.2,62.2s62.2-27.9,62.2-62.2
	c0-34.4-27.9-62.2-62.2-62.2c-9.3,0-18.2,2.1-26.1,5.8c-45.8-30.2-100.6-47.9-159.6-47.9c-86.5,0-164,37.7-217,97.6L296,237.6
	c7-10.1,11.1-22.2,11.1-35.4c0-34.4-27.9-62.2-62.2-62.2s-62.2,27.9-62.2,62.2s27.9,62.2,62.2,62.2c1.8,0,3.5-0.1,5.3-0.3l52.2,90.3
	c-24.9,42.7-39,92.6-39,145.4c0,80.1,32.4,152.6,84.9,205.1c52.5,52.5,125,84.9,205.1,84.9c151,0,275.4-115.7,288.7-263.5
	c0.8-8.8,1.3-17.5,1.3-26.5v-26.5H675.4z M553.4,733.2c-64.5,0-122.8-26.3-165-68.4c-42.2-42.2-68.5-100.6-68.5-165
	c0-30.5,5.8-59.7,16.7-86.5L484.4,669l69-116.7l68.5,116.5l83.8-142.5H785C772,642.8,673.3,733.2,553.4,733.2z"
							/>
						</svg>
					</div>
				</div>
				<h1 className="text-slate-900 font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-center dark:text-white">
					RBAC with Github API
				</h1>
				<p className="mt-6 text-lg text-slate-600 text-center max-w-3xl mx-auto dark:text-slate-400">
					Use{' '}
					<code className="font-mono font-medium text-sky-500 dark:text-sky-400">
						<a className="text-cyan-400 hover:text-cyan-600" target="_blank" href="https://wundergraph.com">
							WunderGraph
						</a>
					</code>{' '}
					to protect your operations using Role Based Access Controls (RBAC).
				</p>
			</div>
			<div className="relative flex flex-col items-center overflow-hidden p-8 sm:p-12">
				<div className="w-full max-w-xl rounded-2xl bg-blue-50 px-20 py-14">
					<div className="mx-auto flex max-w-sm flex-col items-center">
						<p className="mt-3 mb-8 text-center text-black/80">
							Your operation <code className="font-mono font-medium text-amber-500 font-bold">Dragons</code> can only be
							called with the <code>stargazer</code> role. You have to star our{' '}
							<a
								className="font-mono text-cyan-500 hover:text-cyan-700"
								target="_blank"
								href="https://github.com/wundergraph/wundergraph"
							>
								wundergraph/wundergraph
							</a>{' '}
							before you can login. 😄
						</p>
					</div>
					<div className="flex justify-center mt-4">
						<div className="inline-flex rounded-md shadow-sm" role="group">
							<button
								type="button"
								onClick={loginGithub}
								className="inline-flex items-center py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-l-lg border border-gray-200 hover:bg-gray-100 hover:text-cyan-500 focus:z-10 focus:ring-2 focus:ring-cyan-700 focus:text-cyan-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-cyan-500 dark:focus:text-white"
							>
								<svg
									stroke="currentColor"
									className="w-6 h-6 mr-2 -ml-1"
									fill="currentColor"
									strokeWidth="0"
									viewBox="0 0 1024 1024"
									height="1em"
									width="1em"
									xmlns="http://www.w3.org/2000/svg"
								>
									<defs></defs>
									<path d="M521.7 82c-152.5-.4-286.7 78.5-363.4 197.7-3.4 5.3.4 12.3 6.7 12.3h70.3c4.8 0 9.3-2.1 12.3-5.8 7-8.5 14.5-16.7 22.4-24.5 32.6-32.5 70.5-58.1 112.7-75.9 43.6-18.4 90-27.8 137.9-27.8 47.9 0 94.3 9.3 137.9 27.8 42.2 17.8 80.1 43.4 112.7 75.9 32.6 32.5 58.1 70.4 76 112.5C865.7 417.8 875 464.1 875 512c0 47.9-9.4 94.2-27.8 137.8-17.8 42.1-43.4 80-76 112.5s-70.5 58.1-112.7 75.9A352.8 352.8 0 0 1 520.6 866c-47.9 0-94.3-9.4-137.9-27.8A353.84 353.84 0 0 1 270 762.3c-7.9-7.9-15.3-16.1-22.4-24.5-3-3.7-7.6-5.8-12.3-5.8H165c-6.3 0-10.2 7-6.7 12.3C234.9 863.2 368.5 942 520.6 942c236.2 0 428-190.1 430.4-425.6C953.4 277.1 761.3 82.6 521.7 82zM395.02 624v-76h-314c-4.4 0-8-3.6-8-8v-56c0-4.4 3.6-8 8-8h314v-76c0-6.7 7.8-10.5 13-6.3l141.9 112a8 8 0 0 1 0 12.6l-141.9 112c-5.2 4.1-13 .4-13-6.3z"></path>
								</svg>
								Login
							</button>
							<button
								type="button"
								onClick={getDragons}
								className="inline-flex items-center py-2 px-4 text-sm font-medium text-gray-900 bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-cyan-500 focus:z-10 focus:ring-2 focus:ring-cyan-700 focus:text-cyan-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-cyan-500 dark:focus:text-white"
							>
								<svg
									stroke="currentColor"
									className="w-6 h-6 mr-2 -ml-1"
									fill="currentColor"
									strokeWidth="0"
									viewBox="0 0 1024 1024"
									height="1em"
									width="1em"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path d="M868 732h-70.3c-4.8 0-9.3 2.1-12.3 5.8-7 8.5-14.5 16.7-22.4 24.5a353.84 353.84 0 0 1-112.7 75.9A352.8 352.8 0 0 1 512.4 866c-47.9 0-94.3-9.4-137.9-27.8a353.84 353.84 0 0 1-112.7-75.9 353.28 353.28 0 0 1-76-112.5C167.3 606.2 158 559.9 158 512s9.4-94.2 27.8-137.8c17.8-42.1 43.4-80 76-112.5s70.5-58.1 112.7-75.9c43.6-18.4 90-27.8 137.9-27.8 47.9 0 94.3 9.3 137.9 27.8 42.2 17.8 80.1 43.4 112.7 75.9 7.9 7.9 15.3 16.1 22.4 24.5 3 3.7 7.6 5.8 12.3 5.8H868c6.3 0 10.2-7 6.7-12.3C798 160.5 663.8 81.6 511.3 82 271.7 82.6 79.6 277.1 82 516.4 84.4 751.9 276.2 942 512.4 942c152.1 0 285.7-78.8 362.3-197.7 3.4-5.3-.4-12.3-6.7-12.3zm88.9-226.3L815 393.7c-5.3-4.2-13-.4-13 6.3v76H488c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h314v76c0 6.7 7.8 10.5 13 6.3l141.9-112a8 8 0 0 0 0-12.6z"></path>
								</svg>
								Call Operation
							</button>
							<button
								type="button"
								onClick={logoutGithub}
								className="inline-flex items-center py-2 px-4 text-sm font-medium text-gray-900 bg-white rounded-r-md border border-gray-200 hover:bg-gray-100 hover:text-cyan-500 focus:z-10 focus:ring-2 focus:ring-cyan-700 focus:text-cyan-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-cyan-500 dark:focus:text-white"
							>
								<svg
									stroke="currentColor"
									fill="currentColor"
									strokeWidth="0"
									className="w-6 h-6 mr-2 -ml-1"
									viewBox="0 0 24 24"
									height="1em"
									width="1em"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path fill="none" d="M0 0h24v24H0V0z"></path>
									<path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z"></path>
								</svg>
								Logout
							</button>
						</div>
					</div>
					<div className="flex justify-center mt-2"></div>
					<div className="mx-auto flex max-w-sm flex-col items-center mt-8">
						<code className="p-3">{JSON.stringify(result, null, 2)}</code>
					</div>
				</div>
				<footer className="flex justify-between text-gray-400">
					<p className="pt-3">
						Visit{' '}
						<a
							className="text-cyan-400 hover:text-cyan-600"
							target="_blank"
							href="https://github.com/wundergraph/wundergraph"
						>
							Github
						</a>{' '}
						to learn more about WunderGraph.
					</p>
				</footer>
			</div>
		</div>
	);
};

export default withWunderGraph(Home);
