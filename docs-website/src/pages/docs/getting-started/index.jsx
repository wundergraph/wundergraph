import { Heading } from '@/components/Heading';
import { QuickLinks, QuickLink } from '@/components/QuickLinks';

import { NextLogo } from '@/components/logos/next';
import { ViteLogo } from '@/components/logos/vite';
import { RemixLogo } from '@/components/logos/remix';

export default function GettingStartedPage() {
	return (
		<div className="space-y-8">
			<div>
				<Heading className="mb-12">Getting Started</Heading>

				<QuickLinks>
					<QuickLink
						title="1-minute quickstart"
						description="Get WunderGraph up and running in 1 minute."
						href="/docs/getting-started/quickstart"
						more
					/>
				</QuickLinks>
			</div>

			<hr />

			<div>
				<Heading level={2} className="mb-12">
					Framework quickstarts
				</Heading>

				<QuickLinks className="lg:grid-cols-3">
					<QuickLink
						title="Next.js"
						description="Learn how to use WunderGraph with Next.js."
						logo={<NextLogo />}
						href="/docs/getting-started/nextjs-quickstart"
						variant="plain"
					/>
					<QuickLink
						title="Vite"
						description="Learn how to use WunderGraph with Vite."
						logo={<ViteLogo />}
						href="/docs/getting-started/vite-quickstart"
						variant="plain"
					/>
					<QuickLink
						title="Remix"
						description="Learn how to use WunderGraph with Remix."
						logo={<RemixLogo />}
						href="/docs/getting-started/remix-quickstart"
						variant="plain"
					/>
				</QuickLinks>
			</div>
		</div>
	);
}

GettingStartedPage.getInitialProps = () => {
	return {
		title: 'Getting started with WunderGraph',
		description: 'Learn more about how to integrate APIs and build complete backends with WunderGraph.',
	};
};
