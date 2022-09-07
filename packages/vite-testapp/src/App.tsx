import reactLogo from './assets/react.svg';
import './App.css';
import { WunderGraphProvider, useWeatherLiveQuery } from './components/generated/react';

const LiveWeather: React.FC<{ city: string }> = ({ city }) => {
	const liveWeather = useWeatherLiveQuery({
		forCity: city,
	});
	return (
		<div>
			{liveWeather.isLoading && <p>Loading...</p>}
			{liveWeather.isError && <p>Error</p>}
			{liveWeather.isSuccess && (
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

function App() {
	return (
		<WunderGraphProvider>
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
				<p className="read-the-docs">Click on the WunderGraph, Vite and React logos to learn more</p>
			</div>
		</WunderGraphProvider>
	);
}

export default App;
