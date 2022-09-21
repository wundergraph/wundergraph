import { InferGetServerSidePropsType, NextPage } from 'next';
import { useAuth, useUser } from '../lib/wundergraph';
import { SWRConfig } from 'swr';
import Link from 'next/link';
import { createClient, AuthProviderId } from '../components/generated/client';

const Authentication = () => {
	const { login, logout } = useAuth();
	const { data } = useUser({});

	return (
		<div>
			<div className="relative max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-32">
				<div className="flex justify-center">
					<Link href={'/'}>
						<a>
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
						</a>
					</Link>
				</div>
				<h1 className="text-slate-900 font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-center dark:text-white">
					WunderGraph Authentication & SWR
				</h1>
				<p className="mt-6 text-lg text-slate-600 text-center max-w-3xl mx-auto dark:text-slate-400">
					Use{' '}
					<code className="font-mono font-medium text-sky-500 dark:text-sky-400">
						<a className="text-cyan-400 hover:text-cyan-600" target="_blank" href="https://swr.vercel.app/">
							SWR
						</a>
					</code>{' '}
					to simplify the data fetching logic in your project.
				</p>
			</div>
			<div className="relative flex flex-col items-center overflow-hidden p-8 sm:p-12">
				<div className="w-full max-w-xl rounded-2xl bg-blue-50 px-20 py-14">
					<div className="mx-auto flex max-w-sm flex-col items-center">
						<p className="mt-3 mb-8 text-center text-black/80">
							This is the user data of your logged in{' '}
							<code className="font-mono font-medium text-amber-500 font-bold">User</code>. The implementation supports{' '}
							<b>SSR</b>.
						</p>
						<code className="p-3">{data ? JSON.stringify(data, null, 2) : 'Not logged in'}</code>
					</div>
					<div className="flex justify-center mt-8 space-x-2">
						<button
							onClick={() => login(AuthProviderId.github, 'http://localhost:3003/authentication')}
							className="bg-slate-900 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-white font-semibold h-12 px-6 rounded-lg w-full flex items-center justify-center sm:w-auto dark:bg-sky-500 dark:highlight-white/20 dark:hover:bg-sky-400"
						>
							<svg
								stroke="currentColor"
								fill="currentColor"
								strokeWidth="0"
								viewBox="0 0 24 24"
								className="w-6 h-6 mr-2 -ml-1"
								height="1em"
								width="1em"
								xmlns="http://www.w3.org/2000/svg"
							>
								<g>
									<path fill="none" d="M0 0h24v24H0z"></path>
									<path d="M10 11V8l5 4-5 4v-3H1v-2h9zm-7.542 4h2.124A8.003 8.003 0 0 0 20 12 8 8 0 0 0 4.582 9H2.458C3.732 4.943 7.522 2 12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10c-4.478 0-8.268-2.943-9.542-7z"></path>
								</g>
							</svg>
							Login with GitHub
						</button>
						<button
							onClick={() => logout()}
							className="bg-slate-900 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-white font-semibold h-12 px-6 rounded-lg w-full flex items-center justify-center sm:w-auto dark:bg-sky-500 dark:highlight-white/20 dark:hover:bg-sky-400"
						>
							<svg
								stroke="currentColor"
								fill="currentColor"
								strokeWidth="0"
								viewBox="0 0 24 24"
								className="w-6 h-6 mr-2 -ml-1"
								height="1em"
								width="1em"
								xmlns="http://www.w3.org/2000/svg"
							>
								<g>
									<path fill="none" d="M0 0h24v24H0z"></path>
									<path d="M5 11h8v2H5v3l-5-4 5-4v3zm-1 7h2.708a8 8 0 1 0 0-12H4A9.985 9.985 0 0 1 12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10a9.985 9.985 0 0 1-8-4z"></path>
								</g>
							</svg>
							Logout
						</button>
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

export const getServerSideProps = async ({ req }) => {
	const cookieHeader = req.headers.cookie;
	const client = createClient();
	client.setExtraHeaders({
		cookie: cookieHeader,
	});

	try {
		const user = await client.fetchUser();

		return {
			props: {
				fallback: {
					// this key is important to tell SWR that this is a fallback data for the "useUser" hook
					// See https://swr.vercel.app/docs/with-nextjs#pre-rendering-with-default-data
					['wg_user']: user,
				},
			},
		};
	} catch (e) {
		return {
			props: {},
		};
	}
};

const Home: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ fallback }) => {
	return (
		// Pass the fallback data to the SWR config
		// Here you can also configure other global options like errorRetryCount ...
		<SWRConfig value={{ fallback }}>
			<Authentication />
		</SWRConfig>
	);
};

export default Home;
