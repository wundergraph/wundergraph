import Head from 'next/head';

function MyApp({ Component, pageProps }) {
	return (
		<>
			<Head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<script src="https://cdn.tailwindcss.com"></script>
				<title>Todo</title>
			</Head>
			{/*<main className="flex min-h-screen justify-center">*/}
			<main>
				<Component {...pageProps} />
			</main>
		</>
	);
}

export default MyApp;
