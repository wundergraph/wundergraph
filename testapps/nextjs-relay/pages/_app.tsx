import { RelayEnvironmentProvider } from 'react-relay/hooks';
import { getInitialPreloadedQuery, getRelayProps } from 'relay-nextjs/app';
import { createClientEnvironment } from '@wundergraph/relay-nextjs';
import type { AppProps } from 'next/app';

const clientEnv = createClientEnvironment();
const initialPreloadedQuery = getInitialPreloadedQuery({
	createClientEnvironment: () => createClientEnvironment()!,
});

function ExampleApp({ Component, pageProps }: AppProps) {
	const relayProps = getRelayProps(pageProps, initialPreloadedQuery);
	const env = relayProps.preloadedQuery?.environment ?? clientEnv!;

	return (
		<RelayEnvironmentProvider environment={env}>
			<Component {...pageProps} {...relayProps} />
		</RelayEnvironmentProvider>
	);
}

export default ExampleApp;
