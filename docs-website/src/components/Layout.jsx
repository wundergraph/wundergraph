import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import clsx from 'clsx'

import { Hero } from '@/components/Hero'
import { Logo, Logomark } from '@/components/Logo'
import { MobileNavigation } from '@/components/MobileNavigation'
import { Navigation } from '@/components/Navigation'
import { Prose } from '@/components/Prose'
import { Search } from '@/components/Search'
import { ThemeSelector } from '@/components/ThemeSelector'

const navigation = [
	{
		title: 'Introduction',
		links: [
			{ title: 'Overview', href: '/' },
			{ title: 'Getting Started', href: '/getting-started' },
		],
	},
	{
		title: 'Use Cases',
		links: [
			{
				title: 'Programmable API Gateway',
				href: '/docs/use-cases/programmable-api-gateway',
			},
			{
				title: 'API Management',
				href: '/docs/use-cases/api-management',
			},
			{
				title: 'Backend for Frontend',
				href: '/docs/use-cases/backend-for-frontend',
			},
			{
				title: 'API Composition & Integration',
				href: '/docs/use-cases/api-composition-and-integration',
			},
			{
				title: 'Generate SDKs for all your APIs',
				href: '/docs/use-cases/generate-sdks-for-all-your-apis',
			},
			{
				title:
					'Centralized Governance, Monitoring, Access Controls and Logging',
				href: '/docs/use-cases/centralized-governance-monitoring-access-controls-and-logging',
			},
		],
	},
	{
		title: 'Architecture',
		links: [
			{
				title: 'Overview',
				href: '/docs/architecture',
			},
			{
				title: 'Architecture Diagram',
				href: '/docs/architecture/architecture-diagram',
			},
			{
				title: 'WunderGraph Explained in one Sequence Diagram',
				href: '/docs/architecture/wundergraph-explained-in-one-sequence-diagram',
			},
		],
	},
	{
		title: 'Guides',
		links: [
			{
				title: 'Enable autocompletion in your IDE',
				href: '/docs/guides/enable-autocompletion-in-your-ide',
			},
			{
				title: 'Inject Short-Lived Token into Upstream Requests',
				href: '/docs/guides/inject-short-lived-token-into-upstream-requests',
			},
			{
				title: 'Expose a GraphQL API from WunderGraph',
				href: '/docs/guides/expose-a-graphql-api-from-wundergraph',
			},
			{
				title: 'Extend JSON fields with more specific types',
				href: '/docs/guides/extend-json-fields-with-more-specific-types',
			},
			{
				title: 'Signing Requests',
				href: '/docs/guides/signing-requests',
			},
		],
	},
	{
		title: 'Tutorials',
		links: [
			{
				title: 'Your first WunderGraph Application',
				href: '/docs/tutorials/your-first-wundergraph-application',
			},
			{
				title: 'NextJS Full-Stack Tutorial',
				href: '/docs/tutorials/nextjs-full-stack-tutorial',
			},
		],
	},
	{
		title: 'Examples',
		links: [
			{
				title: 'Hello World',
				href: '/docs/examples/hello-world',
			},
			{
				title: 'Cross API Joins',
				href: '/docs/examples/cross-api-joins',
			},
			{
				title: 'NextJS',
				href: '/docs/examples/nextjs',
			},
			{
				title: 'Hooks',
				href: '/docs/examples/hooks',
			},
			{
				title: 'Caching',
				href: '/docs/examples/caching',
			},
			{
				title: 'FauneDB NextJS',
				href: '/docs/examples/fauna-db-nextjs',
			},
			{
				title: 'Inject Bearer Token',
				href: '/docs/examples/inject-bearer-token',
			},
			{
				title: 'PostgreSQL',
				href: '/docs/examples/postgresql',
			},
			{
				title: 'PostgreSQL & Prisma',
				href: '/docs/examples/postgresql-prisma',
			},
			{
				title: 'Publish Install API using WunderHub',
				href: '/docs/examples/publish-install-api',
			},
			{
				title: 'Apollo Federation',
				href: '/docs/examples/apollo-federation',
			},
			{
				title: 'Auth0 OpenID Connect Authentication',
				href: '/docs/examples/auth0-openid-connect-authentication',
			},
		],
	},
	{
		title: 'Features',
		links: [
			{
				title: 'TypeScript hooks to customize the API Gateway Middleware',
				href: '/docs/features/type-script-hooks-to-customize-the-api-gateway-middleware',
			},
			{
				title: 'API Namespacing',
				href: '/docs/features/api-namespacing',
			},
			{
				title: 'Cross-API Joins to compose APIs',
				href: '/docs/features/cross-api-joins-to-compose-apis',
			},
			{
				title: 'TypeSafe Mocking',
				href: '/docs/features/type-safe-mocking',
			},
			{
				title: 'Local Development',
				href: '/docs/features/local-development',
			},
			{
				title: 'OpenID Connect based Authentication',
				href: '/docs/features/openid-connect-based-authentication',
			},
			{
				title: 'Authentication aware Data-Fetching',
				href: '/docs/features/authentication-aware-data-fetching',
			},
			{
				title: 'Authorization - Injecting Claims',
				href: '/docs/features/authorization-injecting-claims',
			},
			{
				title: 'Authorization - Role-Based Access Control',
				href: '/docs/features/authorization-role-based-access-control',
			},
			{
				title: 'Automatic CSRF Protection for Mutations',
				href: '/docs/features/automatic-csrf-protection-for-mutations',
			},
			{
				title: 'HTTP-Layer Caching',
				href: '/docs/features/http-layer-caching',
			},
			{
				title: 'GraphQL to JSON-RPC Compiler',
				href: '/docs/features/graphql-to-json-rpc-compiler',
			},
			{
				title: 'Automatic Content Revalidation with ETags',
				href: '/docs/features/automatic-content-revalidation-with-etags',
			},
			{
				title: 'Realtime Subscriptions',
				href: '/docs/features/realtime-subscriptions',
			},
			{
				title: 'Live Queries',
				href: '/docs/features/live-queries',
			},
			{
				title: 'Generated Clients / SDKs',
				href: '/docs/features/generated-clients-sdks',
			},
			{
				title: 'JSON-Schema Validation',
				href: '/docs/features/json-schema-validation',
			},
			{
				title: 'Autogenerated APIs for your Database',
				href: '/docs/features/auto-generated-apis-for-your-database',
			},
			{
				title: 'File-based Operations',
				href: '/docs/features/file-based-operations',
			},
			{
				title: 'Configuration as Code',
				href: '/docs/features/configuration-as-code',
			},
			{
				title: 'File uploads to S3 compatible File Storages',
				href: '/docs/features/file-uploads-to-s3-compatible-file-storages',
			},
		],
	},
	{
		title: 'Supported Data Sources',
		links: [
			{
				title: 'GraphQL',
				href: '/docs/supported-data-sources/graphql',
			},
			{
				title: 'Apollo Federation',
				href: '/docs/supported-data-sources/apollo-federation',
			},
			{
				title: 'REST / OpenAPI',
				href: '/docs/supported-data-sources/rest-openapi',
			},
			{
				title: 'PostgreSQL',
				href: '/docs/supported-data-sources/postgresql',
			},
			{
				title: 'MySQL',
				href: '/docs/supported-data-sources/mysql',
			},
			{
				title: 'SQLite',
				href: '/docs/supported-data-sources/sqlite',
			},
			{
				title: 'SQLServer',
				href: '/docs/supported-data-sources/sqlserver',
			},
			{
				title: 'MongoDB + Atlas',
				href: '/docs/supported-data-sources/mongodb-atlas',
			},
			{
				title: 'Planetscale',
				href: '/docs/supported-data-sources/planetscale',
			},
			{
				title: 'Yugabyte',
				href: '/docs/supported-data-sources/yugabyte',
			},
			{
				title: 'Oracle DB',
				href: '/docs/supported-data-sources/oracle-db',
			},
		],
	},
	{
		title: 'Supported Frontend Frameworks',
		links: [
			{
				title: 'React-JS',
				href: '/docs/supported-frontend-frameworks/react-js',
			},
			{
				title: 'React Native',
				href: '/docs/supported-frontend-frameworks/react-native',
			},
			{
				title: 'NextJS',
				href: '/docs/supported-frontend-frameworks/nextjs',
			},
			{
				title: 'iOS / Swift / Objective-C',
				href: '/docs/supported-frontend-frameworks/ios-swift-objective-c',
			},
			{
				title: 'Android / Kotlin / Java',
				href: '/docs/supported-frontend-frameworks/android-kotlin-java',
			},
			{
				title: 'Remix',
				href: '/docs/supported-frontend-frameworks/remix',
			},
			{
				title: 'Svelte',
				href: '/docs/supported-frontend-frameworks/svelte',
			},
			{
				title: 'Vue',
				href: '/docs/supported-frontend-frameworks/vue',
			},
			{
				title: 'SolidJS',
				href: '/docs/supported-frontend-frameworks/solidjs',
			},
		],
	},
	{
		title: 'Supported Backend Languages & Frameworks',
		links: [
			{
				title: 'NodeJS / TypeScript',
				href: '/docs/supported-backend-languages-frameworks/nodejs-typescript',
			},
			{
				title: 'Golang / Go',
				href: '/docs/supported-backend-languages-frameworks/golang-go',
			},
			{
				title: 'Python',
				href: '/docs/supported-backend-languages-frameworks/python',
			},
			{
				title: 'Java',
				href: '/docs/supported-backend-languages-frameworks/java',
			},
		],
	},
	{
		title: 'Core Concepts',
		links: [
			{
				title: 'API Namespacing',
				href: '/docs/core-concepts/api-namespacing',
			},
			{
				title: 'Virtual Graph',
				href: '/docs/core-concepts/virtual-graph',
			},
			{
				title: 'The `__join` field',
				href: '/docs/core-concepts/__join-field',
			},
		],
	},
	{
		title: 'Components of WunderGraph',
		links: [
			{
				title: 'wunderctl',
				href: '/docs/components-of-wundergraph/wunderctl',
			},
			{
				title: 'WunderGraph SDK',
				href: '/docs/components-of-wundergraph/wundergraph-sdk',
			},
			{
				title: 'WunderNode / WunderGraph Server',
				href: '/docs/components-of-wundergraph/wundernode-wundergraph-server',
			},
			{
				title: 'WunderGraph Client',
				href: '/docs/components-of-wundergraph/wundergraph-client',
			},
		],
	},
	{
		title: 'wunderctl Reference',
		links: [
			{
				title: 'wunderctl init',
				href: '/docs/wunderctl-reference/wunderctl-init',
			},
			{
				title: 'wunderctl up',
				href: '/docs/wunderctl-reference/wunderctl-up',
			},
			{
				title: 'wunderctl generate',
				href: '/docs/wunderctl-reference/wunderctl-generate',
			},
			{
				title: 'wunderctl login',
				href: '/docs/wunderctl-reference/wunderctl-login',
			},
			{
				title: 'wunderctl logout',
				href: '/docs/wunderctl-reference/wunderctl-logout',
			},
			{
				title: 'wunderctl version',
				href: '/docs/wunderctl-reference/wunderctl-version',
			},
			{
				title: 'wunderctl add',
				href: '/docs/wunderctl-reference/wunderctl-add',
			},
			{
				title: 'wunderctl remove',
				href: '/docs/wunderctl-reference/wunderctl-remove',
			},
		],
	},
	{
		title: 'WunderHub Reference',
		links: [
			{
				title: 'Publish an API to WunderHub',
				href: '/docs/wunderhub-reference/publish-api-to-wunderhub',
			},
			{
				title: 'Integrate an API from WunderHub',
				href: '/docs/wunderhub-reference/integrate-api-from-wunderhub',
			},
		],
	},
	{
		title: 'Directives Reference',
		links: [
			{
				title: '@fromClaim directive',
				href: '/docs/directives-reference/from-claim-directive',
			},
			{
				title: '@jsonSchema directive',
				href: '/docs/directives-reference/json-schema-directive',
			},
			{
				title: '@hooksVariable directive',
				href: '/docs/directives-reference/hooks-variable-directive',
			},
			{
				title: '@rbac directive',
				href: '/docs/directives-reference/rbac-directive',
			},
			{
				title: '@injectUUID directive',
				href: '/docs/directives-reference/inject-uuid-directive',
			},
			{
				title: '@injectCurrentDateTime directive',
				href: '/docs/directives-reference/inject-current-datetime-directive',
			},
			{
				title: '@injectEnvironmentVariable directive',
				href: '/docs/directives-reference/inject-environment-variable-directive',
			},
			{
				title: '@internalOperation directive',
				href: '/docs/directives-reference/internal-operation-directive',
			},
			{
				title: '@export directive',
				href: '/docs/directives-reference/export-directive',
			},
			{
				title: '@internal directive',
				href: '/docs/directives-reference/internal-directive',
			},
			{
				title: '@transform directive',
				href: '/docs/directives-reference/transform-directive',
			},
		],
	},
	{
		title: 'wundergraph.config.ts Reference',
		links: [
			{
				title: 'Overview',
				href: '/docs/wundergraph-config-ts-reference',
			},
		],
	},
	{
		title: 'wundergraph.server.ts Reference',
		links: [
			{
				title: 'Overview',
				href: '/docs/wundergraph-server-ts-reference',
			},
			{
				title: 'preResolve hook',
				href: '/docs/wundergraph-server-ts-reference/pre-resolve-hook',
			},
			{
				title: 'mutatingPreResolve hook',
				href: '/docs/wundergraph-server-ts-reference/mutating-pre-resolve-hook',
			},
			{
				title: 'postResolve hook',
				href: '/docs/wundergraph-server-ts-reference/post-resolve-hook',
			},
			{
				title: 'mutatingPostResolve hook',
				href: '/docs/wundergraph-server-ts-reference/mutating-post-resolve-hook',
			},
			{
				title: 'mockResolve hook',
				href: '/docs/wundergraph-server-ts-reference/mock-resolve-hook',
			},
			{
				title: 'customResolve hook',
				href: '/docs/wundergraph-server-ts-reference/custom-resolve-hook',
			},
			{
				title: 'onOriginRequest hook',
				href: '/docs/wundergraph-server-ts-reference/on-origin-request-hook',
			},
			{
				title: 'onOriginResponse hook',
				href: '/docs/wundergraph-server-ts-reference/on-origin-response-hook',
			},
			{
				title: 'postAuthentication hook',
				href: '/docs/wundergraph-server-ts-reference/post-authentication-hook',
			},
			{
				title: 'revalidate hook',
				href: '/docs/wundergraph-server-ts-reference/revalidate-hook',
			},
			{
				title: 'mutatingPostAuthentication hook',
				href: '/docs/wundergraph-server-ts-reference/mutating-post-authentication-hook',
			},
			{
				title: 'custom GraphQL Servers',
				href: '/docs/wundergraph-server-ts-reference/custom-graphql-servers',
			},
		],
	},
	{
		title: 'wundergraph.operations.ts Reference',
		links: [
			{
				title: 'Overview',
				href: '/docs/wundergraph-operations-ts-reference',
			},
			{
				title: 'configure Defaults',
				href: '/docs/wundergraph-operations-ts-reference/configure-defaults',
			},
			{
				title: 'configure Authentication',
				href: '/docs/wundergraph-operations-ts-reference/configure-authentication',
			},
			{
				title: 'configure Caching',
				href: '/docs/wundergraph-operations-ts-reference/configure-caching',
			},
			{
				title: 'configure Live Queries',
				href: '/docs/wundergraph-operations-ts-reference/configure-live-queries',
			},
			{
				title: 'custom Operations Configuration',
				href: '/docs/wundergraph-operations-ts-reference/custom-operations-configuration',
			},
		],
	},
	{
		title: 'wundergraph.manifest.json Reference',
		links: [
			{
				title: 'Overview',
				href: '/docs/wundergraph-manifest-json-reference',
			},
		],
	},
	{
		title: 'Frequently Asked Questions',
		links: [
			{
				title: 'Does WunderGraph support Postman Collections?',
				href: '/docs/frequently-asked-questions/does-wundergraph-support-postman-collections',
			},
			{
				title:
					'How is WunderGraph faster and more secure than other GraphQL solutions?',
				href: '/docs/frequently-asked-questions/how-is-wundergraph-faster-and-more-secure-than-other-graphql-solutions',
			},
			{
				title: 'How is the developer experience different from legacy GraphQL?',
				href: '/docs/frequently-asked-questions/how-is-the-developer-experience-different-from-legacy-graphql',
			},
			{
				title:
					'How is server-side only GraphQL different from client-side GraphQL?',
				href: '/docs/frequently-asked-questions/how-is-server-side-only-graphql-different-from-client-side-graphql',
			},
		],
	},
]

function GitHubIcon(props) {
	return (
		<svg aria-hidden="true" viewBox="0 0 16 16" {...props}>
			<path d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" />
		</svg>
	)
}

function Header({ navigation }) {
	let [isScrolled, setIsScrolled] = useState(false)

	useEffect(() => {
		function onScroll() {
			setIsScrolled(window.scrollY > 0)
		}

		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => {
			window.removeEventListener('scroll', onScroll, { passive: true })
		}
	}, [])

	return (
		<header
			className={clsx(
				'sticky top-0 z-50 flex flex-wrap items-center justify-between bg-white px-4 py-5 shadow-md shadow-slate-900/5 transition duration-500 dark:shadow-none sm:px-6 lg:px-8',
				isScrolled
					? 'dark:bg-slate-900/95 dark:backdrop-blur dark:[@supports(backdrop-filter:blur(0))]:bg-slate-900/75'
					: 'dark:bg-transparent'
			)}
		>
			<div className="mr-6 flex lg:hidden">
				<MobileNavigation navigation={navigation} />
			</div>
			<div className="relative flex flex-grow basis-0 items-center">
				<Link href="/" aria-label="Home page">
					<Logomark className="h-9 w-9 lg:hidden" />
					<Logo className="hidden h-9 w-auto fill-slate-700 dark:fill-sky-100 lg:block" />
				</Link>
			</div>
			<div className="-my-5 mr-6 sm:mr-8 md:mr-0">
				<Search />
			</div>
			<div className="relative flex basis-0 justify-end gap-6 sm:gap-8 md:flex-grow">
				<ThemeSelector className="relative z-10" />
				<Link href="https://github.com" className="group" aria-label="GitHub">
					<GitHubIcon className="h-6 w-6 fill-slate-400 group-hover:fill-slate-500 dark:group-hover:fill-slate-300" />
				</Link>
			</div>
		</header>
	)
}

function useTableOfContents(tableOfContents) {
	let [currentSection, setCurrentSection] = useState(tableOfContents[0]?.id)

	let getHeadings = useCallback((tableOfContents) => {
		return tableOfContents
			.flatMap((node) => [node.id, ...node.children.map((child) => child.id)])
			.map((id) => {
				let el = document.getElementById(id)
				if (!el) return

				let style = window.getComputedStyle(el)
				let scrollMt = parseFloat(style.scrollMarginTop)

				let top = window.scrollY + el.getBoundingClientRect().top - scrollMt
				return { id, top }
			})
	}, [])

	useEffect(() => {
		if (tableOfContents.length === 0) return
		let headings = getHeadings(tableOfContents)

		function onScroll() {
			let top = window.scrollY
			let current = headings[0].id
			for (let heading of headings) {
				if (top >= heading.top) {
					current = heading.id
				} else {
					break
				}
			}
			setCurrentSection(current)
		}

		window.addEventListener('scroll', onScroll, { passive: true })
		onScroll()
		return () => {
			window.removeEventListener('scroll', onScroll, { passive: true })
		}
	}, [getHeadings, tableOfContents])

	return currentSection
}

export function Layout({ children, title, tableOfContents }) {
	let router = useRouter()
	let isHomePage = router.pathname === '/'
	let allLinks = navigation.flatMap((section) => section.links)
	let linkIndex = allLinks.findIndex((link) => link.href === router.pathname)
	let previousPage = allLinks[linkIndex - 1]
	let nextPage = allLinks[linkIndex + 1]
	let section = navigation.find((section) =>
		section.links.find((link) => link.href === router.pathname)
	)
	let currentSection = useTableOfContents(tableOfContents)

	function isActive(section) {
		if (section.id === currentSection) {
			return true
		}
		if (!section.children) {
			return false
		}
		return section.children.findIndex(isActive) > -1
	}

	return (
		<>
			<Header navigation={navigation} />

			{isHomePage && <Hero />}

			<div className="relative mx-auto flex max-w-8xl justify-center sm:px-2 lg:px-8 xl:px-12">
				<div className="hidden lg:relative lg:block lg:flex-none">
					<div className="absolute inset-y-0 right-0 w-[50vw] bg-slate-50 dark:hidden" />
					<div className="sticky top-[4.5rem] -ml-0.5 h-[calc(100vh-4.5rem)] overflow-y-auto py-16 pl-0.5">
						<div className="absolute top-16 bottom-0 right-0 hidden h-12 w-px bg-gradient-to-t from-slate-800 dark:block" />
						<div className="absolute top-28 bottom-0 right-0 hidden w-px bg-slate-800 dark:block" />
						<Navigation
							navigation={navigation}
							className="w-64 pr-8 xl:w-72 xl:pr-16"
						/>
					</div>
				</div>
				<div className="min-w-0 max-w-2xl flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
					<article>
						{(title || section) && (
							<header className="mb-9 space-y-1">
								{section && (
									<p className="font-display text-sm font-medium text-sky-500">
										{section.title}
									</p>
								)}
								{title && (
									<h1 className="font-display text-3xl tracking-tight text-slate-900 dark:text-white">
										{title}
									</h1>
								)}
							</header>
						)}
						<Prose>{children}</Prose>
					</article>
					<dl className="mt-12 flex border-t border-slate-200 pt-6 dark:border-slate-800">
						{previousPage && (
							<div>
								<dt className="font-display text-sm font-medium text-slate-900 dark:text-white">
									Previous
								</dt>
								<dd className="mt-1">
									<Link
										href={previousPage.href}
										className="text-base font-semibold text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
									>
										<span aria-hidden="true">&larr;</span> {previousPage.title}
									</Link>
								</dd>
							</div>
						)}
						{nextPage && (
							<div className="ml-auto text-right">
								<dt className="font-display text-sm font-medium text-slate-900 dark:text-white">
									Next
								</dt>
								<dd className="mt-1">
									<Link
										href={nextPage.href}
										className="text-base font-semibold text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
									>
										{nextPage.title} <span aria-hidden="true">&rarr;</span>
									</Link>
								</dd>
							</div>
						)}
					</dl>
				</div>
				<div className="hidden xl:sticky xl:top-[4.5rem] xl:-mr-6 xl:block xl:h-[calc(100vh-4.5rem)] xl:flex-none xl:overflow-y-auto xl:py-16 xl:pr-6">
					<nav aria-labelledby="on-this-page-title" className="w-56">
						{tableOfContents.length > 0 && (
							<>
								<h2
									id="on-this-page-title"
									className="font-display text-sm font-medium text-slate-900 dark:text-white"
								>
									On this page
								</h2>
								<ol role="list" className="mt-4 space-y-3 text-sm">
									{tableOfContents.map((section) => (
										<li key={section.id}>
											<h3>
												<Link
													href={`#${section.id}`}
													className={clsx(
														isActive(section)
															? 'text-sky-500'
															: 'font-normal text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
													)}
												>
													{section.title}
												</Link>
											</h3>
											{section.children.length > 0 && (
												<ol
													role="list"
													className="mt-2 space-y-3 pl-5 text-slate-500 dark:text-slate-400"
												>
													{section.children.map((subSection) => (
														<li key={subSection.id}>
															<Link
																href={`#${subSection.id}`}
																className={
																	isActive(subSection)
																		? 'text-sky-500'
																		: 'hover:text-slate-600 dark:hover:text-slate-300'
																}
															>
																{subSection.title}
															</Link>
														</li>
													))}
												</ol>
											)}
										</li>
									))}
								</ol>
							</>
						)}
					</nav>
				</div>
			</div>
		</>
	)
}
