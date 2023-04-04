import Head from 'next/head';
import { ClerkProvider, RedirectToSignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { withWunderGraph } from '../components/generated/nextjs';
import { useWunderGraphClerk } from '../lib/wundergraph';

const publicPages: Array<string> = ['/'];

function MyApp({ Component, pageProps }: AppProps) {
	const { pathname } = useRouter();

	// Check if the current route matches a public page
	const isPublicPage = publicPages.includes(pathname);
	return (
		<>
			<Head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<script src="https://cdn.tailwindcss.com"></script>
			</Head>
			<ClerkProvider {...pageProps}>
				<main className="dark flex dark:bg-[#171632] min-h-screen justify-center">
					{isPublicPage ? (
						<Component {...pageProps} />
					) : (
						<>
							<SignedIn>
								<Component {...pageProps} />
							</SignedIn>
							<SignedOut>
								<RedirectToSignIn />
							</SignedOut>
						</>
					)}
				</main>
			</ClerkProvider>
		</>
	);
}

export default withWunderGraph(MyApp, {
	use: [useWunderGraphClerk],
});
