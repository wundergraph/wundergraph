import Head from 'next/head';
import styles from '../../styles/Home.module.css';
import NextLink from 'next/link';

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

				<div className={styles.grid}>
					<NextLink href="/swr/query">
						<div className={styles.card}>
							<h3>Queries & LiveQueries &rarr;</h3>
							<p>Run queries with useQuery</p>
						</div>
					</NextLink>
					<NextLink href="/swr/mutation">
						<div className={styles.card}>
							<h3>Mutations &rarr;</h3>
							<p>Run mutations using useMutation.</p>
						</div>
					</NextLink>
					<NextLink href="/swr/subscription">
						<div className={styles.card}>
							<h3>Realtime Subscriptions &rarr;</h3>
							<p>Realtime updates with useSubscription</p>
						</div>
					</NextLink>
					<NextLink href="/swr/ssr">
						<div className={styles.card}>
							<h3>SSR</h3>
							<p>Server side rendering</p>
						</div>
					</NextLink>
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

export default SWR;
