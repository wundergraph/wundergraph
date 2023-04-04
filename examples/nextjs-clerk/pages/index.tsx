import { NextPage } from 'next';
import { useQuery, useUser } from '../components/generated/nextjs';
import { SignInButton, SignOutButton, useAuth } from '@clerk/nextjs';

const Home: NextPage = () => {
	const user = useUser();
	const countries = useQuery({
		operationName: 'Country',
	});
	return (
		<div>
			<div className="relative max-w-5xl mx-auto pt-10 sm:pt-14 lg:pt-18">
				<div className="flex justify-center mb-8">
					<div className="text-cyan-400 dark:text-white flex flex-row space-x-12">
						<a href="https://wundergraph.com" className="inline-flex w-24 h-24">
							<img src="/wundergraph.svg" alt="WunderGraph" />
						</a>
						<a href="https://clerk.com" className="inline-flex w-24 h-24">
							<img src="/clerk.svg" alt="Clerk" />
						</a>
					</div>
				</div>
				<h1 className="text-slate-900 font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-center dark:text-white">
					WunderGraph + Clerk
				</h1>
				<p className="mt-6 text-lg text-slate-600 text-center max-w-3xl mx-auto dark:text-slate-400">
					Use{' '}
					<code className="font-mono font-medium text-sky-500 dark:text-sky-400">
						<a className="text-cyan-400 hover:text-cyan-600" target="_blank" href="https://clerk.com">
							Clerk
						</a>
					</code>{' '}
					to protect your WunderGraph API and Next.js application.
				</p>
			</div>
			<div className="relative flex flex-col items-center overflow-hidden p-8 sm:p-12">
				<div className="w-full max-w-5xl rounded-2xl bg-gray-50  px-20 py-14">
					<div className="mx-auto flex max-w-xl flex-col">
						<pre>
							<code className="p-3">{JSON.stringify(countries, null, 2)}</code>
						</pre>
					</div>
					<div className="mx-auto flex max-w-xl flex-col">
						<p className="mt-3 mb-8 text-center text-black/80">User: </p>
						{user.data && (
							<pre>
								<code className="max-w-3xl flex-wrap">{JSON.stringify(user.data, null, 2)}</code>
							</pre>
						)}
						{!user.data && <code className="max-w-3xl flex-wrap">User not authenticated, click Login</code>}
					</div>
					<div className="flex justify-center mt-8 gap-2">
						{!user.data && (
							<SignInButton>
								<button className="bg-slate-900 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-white font-semibold h-12 px-6 rounded-lg w-full flex items-center justify-center sm:w-auto dark:bg-sky-500 dark:highlight-white/20 dark:hover:bg-sky-400">
									Login
								</button>
							</SignInButton>
						)}
						{user.data && (
							<SignOutButton signOutCallback={() => window.location.reload()}>
								<button className="bg-slate-900 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 text-white font-semibold h-12 px-6 rounded-lg w-full flex items-center justify-center sm:w-auto dark:bg-sky-500 dark:highlight-white/20 dark:hover:bg-sky-400">
									Logout
								</button>
							</SignOutButton>
						)}
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

export default Home;
