import Head from 'next/head';
import styles from '../styles/Home.module.css';

import { useState } from 'react';
import { createHooks } from '@wundergraph/swr';

import { createClient, Operations } from '../components/generated/client';
const { useQuery, useMutation } = createHooks<Operations>(createClient());

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

export default function Swr() {
	return (
		<div className={styles.container}>
			<Head>
				<title>Create Next App</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<main className={styles.main}>
				<h1 className={styles.title}>
					Welcome to <a href="https://nextjs.org">Next.js!</a>
				</h1>
				<h2 className={styles.subTitle}>
					... with <a href="https://wundergraph.com?utm_source=nextjs_starter">WunderGraph</a>
				</h2>
				<p className={styles.description}>Take a look at the examples below...</p>
			</main>

			<div>
				<LiveWeather city="Berlin" />
			</div>

			<div>
				<NameForm />
			</div>

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
	);
}
