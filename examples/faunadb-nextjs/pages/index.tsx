import { NextPage } from 'next';
import { useQuery, withWunderGraph } from '../components/generated/nextjs';

const Home: NextPage = () => {
	const stores = useQuery.AllStores();
	return (
		<div>
			<nav>
				<ul>
					<li>
						<a href="#" className="secondary">
							WunderGraph
						</a>
					</li>
				</ul>
				<ul>
					<li>
						<strong>FaunaDB & Next.js</strong>
					</li>
				</ul>
				<li>
					<a>Github</a>
				</li>
			</nav>

			<div className="grid pt-8">
				<div>All Stores:</div>
				<div>
					<code>{JSON.stringify(stores, null, 2)}</code>
				</div>
			</div>

			<style jsx>{`
				.pt-8 {
					padding-top: 2rem;
				}
			`}</style>
		</div>
	);
};

export default withWunderGraph(Home);
