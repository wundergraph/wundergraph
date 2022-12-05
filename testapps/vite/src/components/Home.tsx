import reactLogo from '../assets/react.svg';
import styles from '../../styles/Home.module.css';
import React from 'react';

const Home = () => {
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
				<p className={styles.description}>Take a look at the examples below...</p>

				<div className={styles.grid}>
					<a href="/mocks" className={styles.card}>
						<div>
							<h3>Typesafe Mocking &rarr;</h3>
							<p>Mock any API with type safety.</p>
						</div>
					</a>

					<a href="/authenticate" className={styles.card}>
						<div>
							<h3>Authentication with Realtime &rarr;</h3>
							<p>Authentication with Realtime Subscription </p>
						</div>
					</a>
					<a href="/generate-user" className={styles.card}>
						<div>
							<h3>Mutation &rarr;</h3>
							<p>Mutation, generate user</p>
						</div>
					</a>
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
			</div>
			<p className="read-the-docs">Click on the WunderGraph, Vite and React logos to learn more</p>
		</div>
	);
};
export default Home;
