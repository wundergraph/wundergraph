import Link from 'next/link'
import { Heading } from '../components/Heading'
import { Paragraph } from '../components/Paragraph'
import { CodeBlock } from '../components/CodeBlock'
import { QuickLinks, QuickLink } from '../components/QuickLinks'
import {
	ShareIcon,
	LockClosedIcon,
	CircleStackIcon,
	CursorArrowRaysIcon,
	ServerIcon,
} from '@heroicons/react/24/solid'
import { NextLogo } from '../components/logos/next'
import { ViteLogo } from '../components/logos/vite'
import { RemixLogo } from '../components/logos/remix'

const code = `npx create-wundergraph-app my-project -E nextjs \\ &&
cd my-project && npm i && npm start`

const Links = ({ links }) => {
	return (
		<div>
			<ul className="absolute mt-4 flex space-x-4 ">
				{links.map(({ href, label }) => (
					<li key={href}>
						<Link
							href={href}
							className="text-sm text-white transition-all hover:text-pink-500"
						>
							{label}
						</Link>
					</li>
				))}
			</ul>
		</div>
	)
}

export default function HomePage() {
	return (
		<div className="space-y-8">
			<div className="flex flex-row items-end justify-end">
				<div className="flex-1">
					<Heading>WunderGraph Docs</Heading>
					<Paragraph className="max-w-lg text-xl">
						Learn more about how to integrate APIs and build complete backends
						with WunderGraph.
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
						href="/getting-started"
						more
					/>
					<QuickLink
						title="Guides"
						description="In dept guides that teach you everything about WunderGraph."
						href="/getting-started/vite"
						more
					/>
				</QuickLinks>
				<QuickLinks className="lg:grid-cols-3">
					<QuickLink
						title="Next.js"
						description="Learn how to use WunderGraph with Next.js"
						logo={<NextLogo />}
						href="/getting-started/nextjs"
						variant="plain"
					/>
					<QuickLink
						title="Vite"
						description="Learn how to use WunderGraph with Vite"
						logo={<ViteLogo />}
						href="/getting-started/vite"
						variant="plain"
					/>
					<QuickLink
						title="Remix"
						description="Learn how to use WunderGraph with Remix"
						logo={<RemixLogo />}
						href="/getting-started/remix"
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
						href="/apis/overview"
					>
						<Links
							links={[
								{ href: '/apis/rest', label: 'REST' },
								{ href: '/apis/graphql', label: 'GraphQL' },
								{ href: '/apis/overview', label: 'View all' },
							]}
						/>
					</QuickLink>
					<QuickLink
						title="Databases"
						description="Create instant typesafe APIs on top of your databases."
						icon={<CircleStackIcon />}
						href="/database/overview"
					/>
				</QuickLinks>

				<QuickLinks className="lg:grid-cols-3">
					<QuickLink
						title="Authentication"
						description="Add authentication with to your WunderGraph API."
						icon={<LockClosedIcon />}
						href="/auth/overview"
					/>
					<QuickLink
						title="Realtime"
						description="How to build realtime apps with WunderGraph."
						icon={<CursorArrowRaysIcon />}
						href="/realtime"
					/>
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
						href="/reference/clients"
					/>
					<QuickLink
						title="WunderGraph"
						description="Manage and configure your Wundergraph application."
						href="/reference/wundergraph"
					/>
					<QuickLink
						title="WunderGraph CLI"
						description="Use the WunderGraph CLI to generate, build or create new projects."
						href="/reference/cli"
					/>
				</QuickLinks>
			</div>
		</div>
	)
}
