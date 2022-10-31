import Head from 'next/head';
import styles from '../../styles/Home.module.css';

import { useState } from 'react';
import { useMutation } from '../../lib/wundergraph';

const NameForm = () => {
	const mutation = useMutation({
		operationName: 'SetName',
		onSuccess(data, key, config) {
			console.log(data, key, config);
		},
	});

	const [name, setName] = useState('');

	return (
		<div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					mutation.trigger({
						name,
					});
				}}
			>
				<div>
					<label>
						Name
						<input name="name" value={name} onChange={(e) => setName(e.currentTarget.value)} />
					</label>
					<button type="submit">Submit</button>
				</div>

				<p>{JSON.stringify(mutation.data)}</p>
			</form>
		</div>
	);
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
					<h3>Mutation</h3>
					<NameForm />
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
