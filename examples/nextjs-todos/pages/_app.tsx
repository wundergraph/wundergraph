import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

const MyApp = ({ Component, pageProps }: AppProps) => {
	return (
		<>
			<Head>
				<title>Todo app</title>
			</Head>
			<main>
				<Component {...pageProps} />
			</main>
		</>
	);
};

export default MyApp;
