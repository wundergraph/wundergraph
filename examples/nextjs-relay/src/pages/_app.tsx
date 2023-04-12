import '@/styles/globals.css';
import { createClientEnvironment } from '@/lib/wundergraph';
import type { AppProps } from 'next/app';
import { RelayEnvironmentProvider } from 'react-relay/hooks';
import { getInitialPreloadedQuery, getRelayProps } from 'relay-nextjs/app';

const clientEnv = createClientEnvironment();
const initialPreloadedQuery = getInitialPreloadedQuery({
	createClientEnvironment: () => createClientEnvironment()!,
});

export default function App({ Component, pageProps }: AppProps) {
	const relayProps = getRelayProps(pageProps, initialPreloadedQuery);
	const env = relayProps.preloadedQuery?.environment ?? clientEnv!;

	return (
		<RelayEnvironmentProvider environment={env}>
			<Component {...pageProps} {...relayProps} />
		</RelayEnvironmentProvider>
	);
}
