import Head from 'next/head';
import styles from '../../styles/Home.module.css';

// import SWRConfig from the WunderGraph package,
// otherwise it's possible to run into issues where the context is not shared.
import { SWRConfig } from '@wundergraph/swr';

import { useQuery } from '../../lib/wundergraph';
import { useState } from 'react';

const LiveWeather: React.FC<{ city: string; isLive: boolean }> = ({ city, isLive }) => {
	const liveWeather = useQuery({
		operationName: 'Weather',
		input: { forCity: city },
		liveQuery: isLive,
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

const SWR = () => {
	const [city, setCity] = useState('Berlin');
	const [isLive, setLive] = useState(false);

	return (
		<SWRConfig
			value={{
				revalidateOnFocus: true,
				onError: (err) => {
					console.error(err);
				},
			}}
		>
			<div className={styles.container}>
				<Head>
					<title>Create Next App</title>
					<link rel="icon" href="/favicon.ico" />
				</Head>
				<main className={styles.main}>
					<h1 className={styles.title}>
						Welcome to <a href="https://nextjs.org">SWR</a>
					</h1>
					<h2 className={styles.subTitle}>
						... with <a href="https://wundergraph.com?utm_source=nextjs_starter">WunderGraph</a>
					</h2>

					<div style={{ paddingTop: '80px' }}>
						<div style={{ marginBottom: '20px' }}>
							<button onClick={() => setLive(!isLive)}>{isLive ? 'Disable' : 'Enable'} LiveQuery</button>
						</div>
						<div>
							<label>
								City: <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
							</label>
						</div>
						<div>
							<LiveWeather city={city} isLive={isLive} />
						</div>
					</div>
				</main>

				<footer className={styles.footer}>
					Powered by{' '}
					<a
						href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
						target="_blank"
						rel="noopener noreferrer"
					>
						<img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
					</a>
					&nbsp;&nbsp;and&nbsp;
					<img src="/wundergraph.svg" alt="WunderGraph Logo" className={styles.logoWg} />
				</footer>
			</div>
		</SWRConfig>
	);
};

export default SWR;
