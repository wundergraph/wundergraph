import Head from 'next/head';

function MyApp({ Component, pageProps }) {
	return (
		<>
			<Head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<script src="https://cdn.tailwindcss.com"></script>
			</Head>
			<main className="flex dark:bg-slate-800 min-h-screen justify-center">
				<Component {...pageProps} />
			</main>
		</>
	);
}

export default MyApp;
