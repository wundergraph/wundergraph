import { WunderGraphRelayProvider } from '@/lib/wundergraph';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
	return (
		<WunderGraphRelayProvider initialRecords={pageProps.initialRecords}>
			<Component {...pageProps} />
		</WunderGraphRelayProvider>
	);
}
