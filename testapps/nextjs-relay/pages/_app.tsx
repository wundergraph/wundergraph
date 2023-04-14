import type { AppProps } from 'next/app';
import Link from 'next/link';
import { WunderGraphRelayProvider } from '../lib/createWunderGraphRelayApp';

function ExampleApp({ Component, pageProps }: AppProps) {
	return (
		<WunderGraphRelayProvider initialRecords={pageProps.initialRecords}>
			<nav>
				Pages
				<ul>
					<li>
						<Link href="/">Weather</Link>
					</li>
					<li>
						<Link href="/live">Live Weather</Link>
					</li>
					<li>
						<Link href="/subpage">Sub Page</Link>
					</li>
				</ul>
			</nav>
			<Component {...pageProps} />
		</WunderGraphRelayProvider>
	);
}

export default ExampleApp;
