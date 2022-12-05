import { NextPage } from 'next';
import styles from '../styles/Home.module.css';
import { FC, useState } from 'react';
import { useQuery, withWunderGraph } from '../components/generated/nextjs';

const RealtimePage: NextPage = () => {
	const [city, setCity] = useState<string>('Berlin');
	return (
		<div className={styles.examplesContainer}>
			<h1>Live Weather</h1>
			<p>
				If you watch the Network Tab / DevTools, you'll see no WebSockets, No Subscriptions, No Polling, just a GET
				request with chunked encoding (HTTP 1.1) or a stream (HTTP/2).
			</p>
			<p>If you blur (un-focus) the browser window/tab you'll see that the stream ends.</p>
			<p>Once you re-enter the window, the stream re-starts and keepts the UI updated.</p>
			<p>
				The upstream doesn't support Subscriptions or Realtime Updates. WunderGraph polls the upstream on the serverside
				and distributed the response to the clients.
			</p>
			<p>
				You can change the polling interval by adjusting the "liveQuery" config in at{' '}
				<code className={styles.code}>.wundergraph/wundergraph.operations.ts:44</code>
			</p>
			<p>
				Learn more about Realtime Subscriptions:{' '}
				<a
					href="https://wundergraph.com/docs/overview/features/realtime_subscriptions?utm_source=nextjs-starter"
					target="_blank"
				>
					Realtime Subscriptions Overview
				</a>
			</p>
			<h2>Enter City Search</h2>
			<input value={city} onChange={(e) => setCity(e.target.value)} />
			<LiveWeather city={city} />
		</div>
	);
};

const LiveWeather: FC<{ city: string }> = ({ city }) => {
	const liveWeather = useQuery({
		operationName: 'Weather',
		input: { forCity: city },
		liveQuery: true,
	});
	return (
		<div>
			<div>
				<h3>City: {liveWeather.data?.getCityByName?.name}</h3>
				<p>{JSON.stringify(liveWeather.data?.getCityByName?.coord)}</p>
				<h3>Temperature</h3>
				<p>{JSON.stringify(liveWeather.data?.getCityByName?.weather?.temperature)}</p>
				<h3>Wind</h3>
				<p>{JSON.stringify(liveWeather.data?.getCityByName?.weather?.wind)}</p>
			</div>
		</div>
	);
};

export default withWunderGraph(RealtimePage);
