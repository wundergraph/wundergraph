import Image from 'next/image';
import { graphql } from 'react-relay';
import { pagesDragonsQuery as PagesDragonsQueryType } from '../__relay__generated__/pagesDragonsQuery.graphql';
import { Dragon } from '@/components/Dragon';
import { fetchWunderGraphSSRQuery } from '@/lib/wundergraph';
import { InferGetServerSidePropsType } from 'next';

const PagesDragonsQuery = graphql`
	query pagesDragonsQuery {
		spacex_dragons {
			...Dragons_display_details
		}
	}
`;

export async function getServerSideProps() {
	const relayData = await fetchWunderGraphSSRQuery<PagesDragonsQueryType>(PagesDragonsQuery);

	return {
		props: relayData,
	};
}

export default function Home({ queryResponse }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
				<p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
					Get started by editing&nbsp;
					<code className="font-mono font-bold">src/pages/index.tsx</code>
				</p>
			</div>

			<div className="relative flex place-items-center">
				<Image
					className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] m-8"
					src="/wundergraph.png"
					alt="WunderGraph Logo"
					width={180}
					height={37}
					priority
				/>
				<Image
					className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert m-8"
					src="/next.svg"
					alt="Next.js Logo"
					width={180}
					height={37}
					priority
				/>
				<Image
					className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] m-8"
					src="/relay.svg"
					alt="Relay Logo"
					width={180}
					height={37}
					priority
				/>
			</div>

			<div>
				<p>Dragons:</p>
				{queryResponse?.spacex_dragons?.map((dragon, dragonIndex) => {
					if (dragon) return <Dragon key={dragonIndex.toString()} dragon={dragon} />;
					return null;
				})}
			</div>

			<div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left">
				<a
					href="https://docs.wundergraph.com/?utm_source=create-wundergraph-app&utm_medium=nextjs-relay-template&utm_campaign=create-wundergraph-app"
					className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
					target="_blank"
					rel="noopener noreferrer"
				>
					<h2 className={`mb-3 text-2xl font-semibold`}>
						WunderGraph{' '}
						<span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
							-&gt;
						</span>
					</h2>
					<p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
						Find in-depth information about WunderGraph & Next.js-Relay Integration.
					</p>
				</a>

				<a
					href="https://relay.dev/"
					className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
					target="_blank"
					rel="noopener noreferrer"
				>
					<h2 className={`mb-3 text-2xl font-semibold`}>
						Relay Docs{' '}
						<span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
							-&gt;
						</span>
					</h2>
					<p className={`m-0 max-w-[30ch] text-sm opacity-50`}>Learn about Relay!</p>
				</a>

				<a
					href="https://reverecre.github.io/relay-nextjs/"
					className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
					target="_blank"
					rel="noopener noreferrer"
				>
					<h2 className={`mb-3 text-2xl font-semibold`}>
						Relay Nextjs{' '}
						<span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
							-&gt;
						</span>
					</h2>
					<p className={`m-0 max-w-[30ch] text-sm opacity-50`}>Learn about Relay Next.js integration</p>
				</a>

				<a
					href="https://cloud.wundergraph.com/?utm_source=create-wundergraph-app&utm_medium=nextjs-relay-template&utm_campaign=create-wundergraph-app"
					className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
					target="_blank"
					rel="noopener noreferrer"
				>
					<h2 className={`mb-3 text-2xl font-semibold`}>
						Deploy{' '}
						<span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
							-&gt;
						</span>
					</h2>
					<p className={`m-0 max-w-[30ch] text-sm opacity-50`}>Deploy your WunderGraph app with wundergraph cloud.</p>
				</a>
			</div>
		</main>
	);
}
