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
	ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { NextLogo } from '@/components/logos/next';
import { SvelteLogo } from '@/components/logos/svelte';
import { ViteLogo } from '@/components/logos/vite';
import { RemixLogo } from '@/components/logos/remix';
import { RelayLogo } from '@/components/logos/relay';
import { NuxtLogo } from '@/components/logos/nuxt';
import clsx from 'clsx';
import { DiscordIcon } from '../components/logos/discord';
import { GitHubIcon } from '../components/logos/github';
import { ExpoLogo } from '@/components/logos/expo';

const code = `npx create-wundergraph-app my-project -E nextjs \\ &&
cd my-project && npm i && npm start`;

const Links = ({ href, links }) => {
	return (
		<div className="hidden h-10 lg:block">
			<ul className="absolute mt-4 flex space-x-4">
				{links.map(({ href, label, className }) => (
					<li key={href}>
						<Link
							href={href}
							className={clsx(
								'inline-flex items-center text-sm decoration-white/20 decoration-2 transition-all hover:text-pink-500',
								className
							)}
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
					<Paragraph className="max-w-lg pr-8 text-xl">
						Learn more about how to integrate APIs and build backends with WunderGraph.
					</Paragraph>
				</div>
				<div className="hidden flex-1 xl:block">
					<CodeBlock filename="Quick start" language="bash">
						{code}
					</CodeBlock>
				</div>
			</div>

			<hr />

			<div>
				<Heading level={2} className="mb-12">
					Overview
				</Heading>

				<QuickLinks>
					<QuickLink
						title="Introduction to WunderGraph"
						description="Understand the big picture of WunderGraph, why we've built it and how it works."
						href="/introduction"
						more
					/>
				</QuickLinks>
			</div>

			<div>
				<Heading level={2} className="mb-12">
					Getting Started
				</Heading>

				<QuickLinks>
					<QuickLink
						title="Tutorials &amp; Examples"
						description="Get familiar with WunderGraph by following our quickstarts, tutorials and examples."
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
					<QuickLink
						title="Relay"
						description="Learn how to use WunderGraph with Relay."
						logo={<RelayLogo />}
						href="/docs/getting-started/relay-quickstart"
						variant="plain"
					/>
					<QuickLink
						title="SvelteKit"
						description="Learn how to use WunderGraph with SvelteKit."
						logo={<SvelteLogo />}
						href="/docs/getting-started/sveltekit-quickstart"
					/>
					<QuickLink
						title="Nuxt"
						description="Learn how to use WunderGraph with Nuxt."
						logo={<NuxtLogo />}
						href="/docs/getting-started/nuxt-quickstart"
						variant="plain"
					/>
					<QuickLink
						title="Expo"
						description="Learn how to use WunderGraph with Expo."
						logo={<ExpoLogo />}
						href="/docs/getting-started/expo-quickstart"
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
								{ href: '/docs/apis/rest-openapi', label: 'REST', className: 'underline' },
								{ href: '/docs/apis/graphql', label: 'GraphQL', className: 'underline' },
								{ href: '/docs/apis/apollo-federation', label: 'Apollo Federation', className: 'underline' },
								{
									href: '/docs/apis',
									label: <QuickLinkMore label="View all" />,
								},
							]}
						/>
					</QuickLink>
					<QuickLink
						title="Databases"
						description="Create instant typesafe APIs on top of your databases."
						icon={<CircleStackIcon />}
						href="/docs/databases"
					>
						<Links
							href="/docs/databases"
							links={[
								{ href: '/docs/databases/prisma', label: 'Prisma', className: 'underline' },
								{ href: '/docs/databases/prisma#postgre-sql', label: 'PostgreSQL', className: 'underline' },
								{ href: '/docs/databases/prisma#planetscale', label: 'Planetscale', className: 'underline' },
								{ href: '/docs/databases/faunadb', label: 'Fauna', className: 'underline' },
								{
									href: '/docs/databases',
									label: <QuickLinkMore label="View all" className="underline-0" />,
								},
							]}
						/>
					</QuickLink>
				</QuickLinks>

				<QuickLinks className="lg:grid-cols-3">
					<QuickLink
						title="Authentication"
						description="Add authentication with to your WunderGraph API."
						icon={<LockClosedIcon />}
						href="/docs/auth"
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
						href="/docs/storage"
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

			<hr />

			<div>
				<Heading level={2} className="mb-12">
					Support &amp; Community
				</Heading>

				<QuickLinks className="lg:grid-cols-2">
					<QuickLink
						title="Submit an issue"
						description="Report bugs or issues for WunderGraph Open Source."
						href="https://github.com/wundergraph/wundergraph/issues/new/choose"
						icon={<GitHubIcon className="text-black dark:text-white" />}
					/>
					<QuickLink
						title="Discord"
						description="Join our community of API enthausiasts."
						href="https://wundergraph.com/discord"
						icon={<DiscordIcon className="text-[#7289DA]" />}
					/>
				</QuickLinks>
			</div>
		</div>
	);
}

HomePage.getInitialProps = () => {
	return {
		title: 'Documentation Overview',
		description: 'Learn more about how to integrate APIs and build complete backends with WunderGraph.',
	};
};
