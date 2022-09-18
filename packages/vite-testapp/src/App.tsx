import reactLogo from './assets/react.svg';
import './App.css';
import { newSWRHooks } from '@wundergraph/swr-hooks';
import { useState } from 'react';

import { createClient, Mutations, Queries, Subscriptions } from './components/generated/client';
const { useQuery, useMutation } = newSWRHooks<Queries, Mutations, Subscriptions>(createClient());

const LiveWeather: React.FC<{ city: string }> = ({ city }) => {
	const liveWeather = useQuery({
		operationName: 'Weather',
		input: { forCity: city },
		liveQuery: true,
	});

	return (
		<div>
			{liveWeather.isValidating && <p>Loading...</p>}
			{liveWeather.error && <p>Error</p>}
			{liveWeather.data && (
				<div>
					<h3>City: {liveWeather.data.getCityByName?.name}</h3>
					<p>{JSON.stringify(liveWeather.data.getCityByName?.coord)}</p>
					<h3>Temperature</h3>
					<p>{JSON.stringify(liveWeather.data.getCityByName?.weather?.temperature)}</p>
					<h3>Wind</h3>
					<p>{JSON.stringify(liveWeather.data.getCityByName?.weather?.wind)}</p>
				</div>
			)}
		</div>
	);
};

const NameForm = () => {
	const mutation = useMutation({
		operationName: 'SetName',
	});

	const [name, setName] = useState('');

	return (
		<div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					mutation.mutate({
						input: { name },
					});
				}}
			>
				<div>
					<label>
						Name
						<input name="name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
					</label>
				</div>
				<button type="submit">Submit</button>

				<p>{JSON.stringify(mutation.data)}</p>
			</form>
		</div>
	);
};

function App() {
	return (
		<div className="App">
			<div>
				<a href="https://wundergraph.com" target="_blank">
					<img src="/wundergraph.svg" className="logo wundergraph" alt="WunderGraph logo" />
				</a>
				<a href="https://vitejs.dev" target="_blank">
					<img src="/vite.svg" className="logo" alt="Vite logo" />
				</a>
				<a href="https://reactjs.org" target="_blank">
					<img src={reactLogo} className="logo react" alt="React logo" />
				</a>
			</div>
			<h1>WunderGraph + Vite + React</h1>
			<div className="card">
				<LiveWeather city="Berlin" />
			</div>

			<div className="card">
				<NameForm />
			</div>
			<p className="read-the-docs">Click on the WunderGraph, Vite and React logos to learn more</p>
		</div>
	);
}

export default App;
