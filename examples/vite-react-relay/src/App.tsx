import { Suspense, useEffect } from 'react';
import relayLogo from './assets/relay.svg';
import wundergraphLogo from './assets/wundergraph.png';
import { PreloadedQuery, graphql, useQueryLoader } from 'react-relay';
import viteLogo from '/vite.svg';
import './App.css';
import { AppDragonsQuery as AppDragonsQueryType } from './__relay__generated__/AppDragonsQuery.graphql';
import { Dragon } from './components/Dragon';
import { useLiveQuery } from './lib/wundergraph';

const AppDragonsQuery = graphql`
	query AppDragonsQuery {
		spacex_dragons {
			...Dragons_display_details
		}
	}
`;

const DragonsList = ({
	queryReference,
}: {
	queryReference: PreloadedQuery<AppDragonsQueryType, Record<string, unknown>>;
}) => {
	const { data } = useLiveQuery<AppDragonsQueryType>({
		query: AppDragonsQuery,
		queryReference,
	});

	return (
		<div>
			<p>Dragons:</p>
			{data?.spacex_dragons?.map((dragon, dragonIndex) => {
				if (dragon) return <Dragon key={dragonIndex.toString()} dragon={dragon} />;
				return null;
			})}
		</div>
	);
};

function App() {
	const [queryReference, loadQuery] = useQueryLoader<AppDragonsQueryType>(AppDragonsQuery);

	useEffect(() => {
		loadQuery({});
	}, []);

	return (
		<div className="App">
			<div>
				<a href="https://wundergraph.com" target="_blank">
					<img src={wundergraphLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://vitejs.dev" target="_blank">
					<img src={viteLogo} className="logo" alt="Vite logo" />
				</a>
				<a href="https://relay.dev/" target="_blank">
					<img src={relayLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<h1>WunderGraph + Vite + Relay</h1>
			<Suspense>{queryReference && <DragonsList queryReference={queryReference} />}</Suspense>
		</div>
	);
}

export default App;
