import Head from 'next/head';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { AppProps } from 'next/app';

const client = new ApolloClient({
	uri: 'http://localhost:9991/graphql',
	cache: new InMemoryCache(),
});

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<>
			<Head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<script src="https://cdn.tailwindcss.com"></script>
			</Head>
			<main className="flex dark:bg-slate-800 min-h-screen justify-center">
				<ApolloProvider client={client}>
					<Component {...pageProps} />
				</ApolloProvider>
			</main>
		</>
	);
}

export default MyApp;
