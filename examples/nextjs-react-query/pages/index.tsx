import { NextPage } from 'next';
import { useQuery } from '../lib/react-query';
import Nav from '../components/Nav';

const Home: NextPage = () => {
	const dragons = useQuery({
		operationName: 'Dragons',
	});

	return (
		<div className={'w-full h-screen'}>
			<Nav />
			<div className="relative max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-32">
				<div className={'flex flex-col items-center h-screen'}>
					<h1 className={'mb-4 text-4xl font-extrabold md:text-5xl lg:text-5xl'}>
						{' '}
						Welcome to{' '}
						<span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
							{' '}
							React Query
						</span>{' '}
						with
					</h1>
					<h1 className={'mb-4 text-4xl font-extrabold md:text-5xl lg:text-5xl'}>
						<span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
							{' '}
							WunderGraph
						</span>
					</h1>
					<div className="relative flex flex-col items-center overflow-hidden p-8 sm:p-12">
						<div className="w-full max-w-xl rounded-2xl bg-blue-50 px-20 py-14">
							<div className="mx-auto flex max-w-sm flex-col items-center">
								<p className="mt-3 mb-8 text-center text-black/80">
									This is the result of your{' '}
									<code className="font-mono font-medium text-amber-500 font-bold">Dragons</code> operation.
								</p>
								<ul>
									{dragons.data?.spacex_dragons?.map((dragon) => {
										return <li key={dragon.id}>{JSON.stringify(dragon)}</li>;
									})}
								</ul>
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
			</div>
		</div>
	);
};

export default Home;
