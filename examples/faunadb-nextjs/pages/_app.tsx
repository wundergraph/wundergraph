import Head from 'next/head';

function MyApp({ Component, pageProps }) {
	return (
		<>
			<Head>
				<link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css" />
			</Head>
			<main className="container">
				<Component {...pageProps} />
			</main>
		</>
	);
}

export default MyApp;
