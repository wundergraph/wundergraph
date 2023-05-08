import Head from 'next/head';
import styles from '../../styles/Home.module.css';
import NextLink from 'next/link';

export default function Home() {
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
				<div className={styles.grid}>
					<NextLink href="/react-query/caching">
						<div className={styles.card}>
							<h3>Caching &rarr;</h3>
							<p>Example using WunderGraph Caching</p>
						</div>
					</NextLink>
					<NextLink href="/react-query/mocks">
						<div className={styles.card}>
							<h3>Typesafe Mocking &rarr;</h3>
							<p>WunderGraph allows your do mock any API with type safety.</p>
						</div>
					</NextLink>
					<NextLink href="/react-query/realtime">
						<div className={styles.card}>
							<h3>Realtime Subscriptions &rarr;</h3>
							<p>Turn any API into a Realtime Subscription</p>
						</div>
					</NextLink>
					<NextLink href="/react-query/authentication">
						<div className={styles.card}>
							<h3>Authentication &rarr;</h3>
							<p>Authentication aware Data Fetching</p>
						</div>
					</NextLink>
					<NextLink href="/react-query/upload">
						<div className={styles.card}>
							<h3>File uploading &rarr;</h3>
							<p>Upload files to a S3 compatible server</p>
						</div>
					</NextLink>
					<a
						href="https://wundergraph.com/docs/guides/your_first_wundergraph_application/overview?utm_source=nextjs_starter"
						target="_blank"
						className={styles.card}
					>
						<h3>Docs &rarr;</h3>
						<p>Read the full Getting Started Guide</p>
					</a>
					<a href="https://wundergraph.com/discord?utm_source=nextjs_starter" target="_blank" className={styles.card}>
						<h3>Feedback &rarr;</h3>
						<p>We'd love to hear from you! Join us on Discord and Chat with us.</p>
					</a>
				</div>
				<a href="https://wundergraph.com/demo?utm_source=nextjs_starter" target="_blank" className={styles.card}>
					<h3>Book a Meeting with the Makers of WunderGraph &rarr;</h3>
					<p>Talk to the Founders, learn more about our tool and let us help you find the right solution for you.</p>
				</a>
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
}
