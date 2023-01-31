import Link from 'next/link';
import { Heading } from '@/components/Heading';
import { Paragraph } from '@/components/Paragraph';
import { CodeBlock } from '@/components/CodeBlock';
import { QuickLinks, QuickLink, QuickLinkMore } from '@/components/QuickLinks';
import {
	ShareIcon,
	LockClosedIcon,
	CircleStackIcon,
	CursorArrowRaysIcon,
	ServerIcon,
	ComputerDesktopIcon,
	WrenchIcon,
	CogIcon,
	CommandLineIcon,
} from '@heroicons/react/24/solid';
import { NextLogo } from '@/components/logos/next';
import { ViteLogo } from '@/components/logos/vite';
import { RemixLogo } from '@/components/logos/remix';

const code = `npx create-wundergraph-app my-project -E nextjs \\ &&
cd my-project && npm i && npm start`;

const Links = ({ href, links }) => {
	return (
		<div className="hidden h-10 lg:block">
			<ul className="absolute mt-4 flex space-x-4">
				{links.map(({ href, label }) => (
					<li key={href}>
						<Link
							href={href}
							className="text-sm text-white underline decoration-white/20 decoration-2 transition-all hover:text-pink-500"
						>
							{label}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
};

export default function HomePage() {
	return (
		<div className="space-y-8">
			<div className="stretch flex flex-col lg:flex-row lg:items-end lg:justify-end">
				<div className="flex-1">
					<Heading>WunderGraph Docs</Heading>
					<Paragraph className="max-w-lg text-xl">
						Learn more about how to integrate APIs and build complete backends with WunderGraph.
					</Paragraph>
				</div>
				<div className="flex-1">
					<CodeBlock filename="Quick start" language="bash">
						{code}
					</CodeBlock>
				</div>
			</div>

			<hr />

			<div>
				<Heading level={2} className="mb-12">
					Getting Started
				</Heading>

				<QuickLinks>
					<QuickLink
						title="Tutorials &amp; Examples"
						description="Get familiar with WunderGraph by following our tutorials and examples."
						href="/docs/getting-started"
						more
					/>
					<QuickLink
						title="Guides"
						description="In dept guides that teach you everything about how to build APIs and applications with WunderGraph."
						href="/docs/guides"
						more
					/>
				</QuickLinks>
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

			<hr />

			<div>
				<Heading level={2} className="mb-12">
					Explore WunderGraph
				</Heading>

				<QuickLinks>
					<QuickLink
						title="Integrate APIs"
						description="Connect existing services and 3rd APIs to WunderGraph."
						icon={<ShareIcon />}
						href="/docs/apis"
					>
						<Links
							href="/docs/apis"
							links={[
								{ href: '/docs/apis/rest', label: 'REST' },
								{ href: '/docs/apis/graphql', label: 'GraphQL' },
								{ href: '/docs/apis/federation', label: 'Apollo Federation' },
								{ href: '/docs/apis', label: 'View all' },
							]}
						/>
					</QuickLink>
					<QuickLink
						title="Databases"
						description="Create instant typesafe APIs on top of your databases."
						icon={<CircleStackIcon />}
						href="/docs/database"
					>
						<Links
							href="/docs/database"
							links={[
								{ href: '/docs/database/postgres', label: 'Postgres' },
								{ href: '/docs/database/mysql', label: 'MySQL' },
								{ href: '/docs/database/fauna', label: 'Fauna' },
								{ href: '/docs/database/planetscale', label: 'Planetscale' },
								{ href: '/docs/apis', label: 'View all' },
							]}
						/>
					</QuickLink>
				</QuickLinks>

				<QuickLinks className="lg:grid-cols-3">
					<QuickLink
						title="Authentication"
						description="Add authentication with to your WunderGraph API."
						icon={<LockClosedIcon />}
						href="/auth/overview"
					/>
					{/* <QuickLink
						title="Realtime"
						description="How to build realtime apps with WunderGraph."
						icon={<CursorArrowRaysIcon />}
						href="/realtime"
					/> */}
					<QuickLink
						title="Storage"
						description="Add S3 compatible storage and file uploads with the WunderGraph client."
						icon={<ServerIcon />}
						href="/storage"
					/>
				</QuickLinks>
			</div>

			<hr />

			<div>
				<Heading level={2} className="mb-12">
					Reference Documentation
				</Heading>

				<QuickLinks className="lg:grid-cols-3">
					<QuickLink
						title="Clients reference"
						description="Official client libraries for TypeScript, React and more."
						href="/docs/clients-reference"
						icon={<ComputerDesktopIcon />}
					/>
					<QuickLink
						title="WunderGraph directory"
						description="Manage and configure your Wundergraph application."
						href="/docs/wundergraph-reference"
						icon={<WrenchIcon />}
					/>
					<QuickLink
						title="Operations"
						description="Writing GraphQL and Typescript operations with WunderGraph."
						href="/docs/operations-reference"
						icon={<CogIcon />}
					/>
					<QuickLink
						title="WunderGraph CLI"
						description="Use the WunderGraph CLI to generate, build or create new projects."
						href="/docs/cli-reference"
						icon={<CommandLineIcon />}
					/>
				</QuickLinks>
			</div>
		</div>
	);
}

HomePage.getInitialProps = () => {
	return {
		title: 'WunderGraph Docs',
		description: 'Learn more about how to integrate APIs and build complete backends with WunderGraph.',
	};
};
