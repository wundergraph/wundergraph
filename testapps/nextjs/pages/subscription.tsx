import Head from 'next/head';
import styles from '../styles/Home.module.css';

import { useSubscription, withWunderGraph } from '../components/generated/nextjs';

const Countdown: React.FC = () => {
	const countdown = useSubscription({
		operationName: 'Countdown',
		input: {
			from: 100,
		},
		onSuccess: (data) => {
			console.log(data);
		},
		onError: (err) => {
			console.log(err);
		},
	});

	return <pre>{JSON.stringify(countdown, null, 2)}</pre>;
};

const SWR = () => {
	return (
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
				<p className={styles.description}>Take a look at the examples below...</p>

				<div style={{ paddingTop: '80px' }}>
					<h3>Subscription</h3>
					<Countdown />
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
	);
};

export default withWunderGraph(SWR, {
	ssr: true,
});
