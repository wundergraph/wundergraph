import {
	AcademicCapIcon,
	ArrowUpCircleIcon,
	BoltIcon,
	BookOpenIcon,
	CircleStackIcon,
	CloudIcon,
	CogIcon,
	CommandLineIcon,
	ComputerDesktopIcon,
	CubeIcon,
	HomeIcon,
	LightBulbIcon,
	ListBulletIcon,
	LockClosedIcon,
	QuestionMarkCircleIcon,
	ServerIcon,
	ShareIcon,
	WrenchIcon,
} from '@heroicons/react/24/solid';

const navigation = [
	{
		title: 'Home',
		href: '/',
		icon: <HomeIcon />,
	},
	{
		title: 'Getting started',
		href: '/docs/getting-started',
		paths: ['/docs/tutorials', '/docs/examples'],
		icon: <BoltIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'Getting started',
				href: '/docs/getting-started',
			},
			{
				title: 'Quickstart',
				href: '/docs/getting-started/quickstart',
			},
			{
				title: 'Framework Quickstarts',
				links: [
					{
						title: 'Next.js',
						href: '/docs/getting-started/nextjs-quickstart',
					},
					{
						title: 'Vite',
						href: '/docs/getting-started/vite-quickstart',
					},
					{
						title: 'Remix',
						href: '/docs/getting-started/remix-quickstart',
					},
					{
						title: 'Relay',
						href: '/docs/getting-started/relay-quickstart',
					},
					{
						title: 'SvelteKit',
						href: '/docs/getting-started/sveltekit-quickstart',
					},
					{
						title: 'Nuxt',
						href: '/docs/getting-started/nuxt-quickstart',
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
						title: 'Next.js',
						href: '/docs/examples/nextjs',
					},
					{
						title: 'Next.js TypeScript Operations',
						href: '/docs/examples/nextjs-typescript-operations',
					},
					{
						title: 'Next.js + React Query',
						href: '/docs/examples/nextjs-react-query',
					},
					{
						title: 'Next.js + Relay',
						href: '/docs/examples/nextjs-relay',
					},
					{
						title: 'SvelteKit + SSR with TanStack Query',
						href: '/docs/examples/sveltekit',
					},
					{
						title: 'Next.js + Clerk',
						href: '/docs/examples/nextjs-clerk',
					},
					{
						title: 'Vite + SWR',
						href: '/docs/examples/vite-swr',
					},
					{
						title: 'Vite + Solid.js',
						href: '/docs/examples/vite-solidjs',
					},
					{
						title: 'Vite + React Relay',
						href: '/docs/examples/vite-react-relay',
					},
					{
						title: 'Vite + Svelte',
						href: '/docs/examples/vite-svelte',
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
						title: 'Expo + SWR',
						href: '/docs/examples/expo-swr',
					},
					{
						title: 'FaunaDB Next.js',
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
						title: 'Next.js & PostgreSQL & Prisma',
						href: '/docs/examples/nextjs-postgresql-prisma',
					},
					{
						title: 'Apollo Federation',
						href: '/docs/examples/apollo-federation',
					},
					{
						title: 'Auth0 OpenID Connect Authentication',
						href: '/docs/examples/auth0-openid-connect-authentication',
					},
					{
						title: 'GraphQL Fragments',
						href: '/docs/examples/fragments',
					},
					{
						title: 'Keycloak OpenID Connect Authentication',
						href: '/docs/examples/keycloak-openid-connect-authentication',
					},
					{
						title: 'GraphQL Apollo subscriptions',
						href: '/docs/examples/graphql-apollo-subscriptions',
					},
					{
						title: 'GraphQL Yoga subscriptions',
						href: '/docs/examples/graphql-yoga-subscriptions',
					},
					{
						title: 'GraphQL SSE subscriptions',
						href: '/docs/examples/graphql-sse-subscriptions',
					},
					{
						title: 'GraphQL WS subscriptions',
						href: '/docs/examples/graphql-ws-subscriptions',
					},
					{
						title: 'GraphQL Hasura WS subscriptions',
						href: '/docs/examples/graphql-hasura-subscriptions',
					},
					{
						title: 'GraphQL subscriptions hooks',
						href: '/docs/examples/graphql-subscriptions-hooks',
					},
					{
						title: 'WunderGraph schema extension',
						href: '/docs/examples/schema-extension',
					},
					{
						title: 'Next.js Todos',
						href: '/docs/examples/nextjs-todos',
					},
					{
						title: 'Nuxt + Vue Query',
						href: '/docs/examples/nuxt',
					},
				],
			},
		],
	},
	{
		title: 'Learn WunderGraph',
		href: '/learn',
		icon: <AcademicCapIcon />,
		links: [
			{
				title: 'Introduction',
				href: '/learn',
			},
			{
				title: 'Hello World',
				href: '/learn/hello_world',
			},
			{
				title: 'Thinking in API Dependencies',
				href: '/learn/thinking_in_api_dependencies',
			},
			{
				title: 'Joining data across APIs',
				href: '/learn/joining_data_across_apis',
			},
			{
				title: 'TypeScript Operations',
				href: '/learn/typescript_operations',
			},
		],
	},
	{
		title: 'Guides',
		href: '/docs/guides',
		icon: <BookOpenIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'Guides',
				href: '/docs/guides',
			},
			{
				title: 'Writing operations',
				links: [
					{
						title: 'TypeSafe API Integrations with TypeScript Operations & GraphQL',
						href: '/docs/guides/typesafe_api_integrations_with_typescript_operations_and_graphql',
					},
				],
			},
			// {
			// 	title: 'Configuring WunderGraph',
			// 	links: [],
			// },
			{
				title: 'IDE',
				links: [
					{
						title: 'Enable autocompletion in your IDE',
						href: '/docs/guides/enable-autocompletion-in-your-ide',
					},
					{
						title: 'Debugging WunderGraph applications',
						href: '/docs/guides/debugging',
					},
				],
			},
			{
				title: 'Testing',
				links: [
					{
						title: 'Integration tests',
						href: '/docs/guides/testing',
					},
					{
						title: 'End to end testing',
						href: '/docs/guides/end-to-end-testing',
					},
				],
			},
			{
				title: 'Security',
				links: [
					{
						title: 'Token Based Authentication with Next Auth',
						href: '/docs/guides/token-based-authentication-with-next-auth',
					},
				],
			},
			{
				title: 'Advanced',
				links: [
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
						title: 'Signing Origin Requests',
						href: '/docs/guides/signing-origin-requests',
					},
				],
			},
		],
	},
	{ type: 'divider' },
	{
		title: 'APIs',
		href: '/docs/apis',
		icon: <ShareIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'APIs',
				href: '/docs/apis',
			},
			{
				title: 'GraphQL',
				href: '/docs/apis/graphql',
			},
			{
				title: 'Apollo Federation',
				href: '/docs/apis/apollo-federation',
			},
			{
				title: 'REST / OpenAPI',
				href: '/docs/apis/rest-openapi',
			},
		],
	},
	{
		title: 'Authentication',
		href: '/docs/auth',
		icon: <LockClosedIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'Authentication',
				href: '/docs/auth',
			},
			{
				title: 'Cookie-based Auth',
				links: [
					{
						title: 'OpenID Connect',
						href: '/docs/auth/cookie-based-auth/openid-connect',
					},
					{
						title: 'Auth0',
						href: '/docs/auth/cookie-based-auth/auth0',
					},
					{
						title: 'Keycloak',
						href: '/docs/auth/cookie-based-auth/keycloak',
					},
					{
						title: 'GitHub',
						href: '/docs/auth/cookie-based-auth/github',
					},
					{
						title: 'Google',
						href: '/docs/auth/cookie-based-auth/google',
					},
				],
			},
			{
				title: 'Token-based Auth',
				links: [
					{
						title: 'OpenID Connect JWKS',
						href: '/docs/auth/token-based-auth/openid-connect',
					},
					{
						title: 'Auth.js (NextAuth)',
						href: '/docs/auth/token-based-auth/auth-js',
					},
					{
						title: 'Clerk.com',
						href: '/docs/auth/token-based-auth/clerk',
					},
				],
			},
		],
	},
	{
		title: 'Databases',
		href: '/docs/databases',
		icon: <CircleStackIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'Databases',
				href: '/docs/databases',
			},
			{
				title: 'Prisma Datasource',
				href: '/docs/databases/prisma',
			},
			{
				title: 'FaunaDB',
				href: '/docs/databases/faunadb',
			},
		],
	},
	// {
	// 	title: 'Realtime',
	// 	href: '/docs/realtime',
	// 	icon: <CursorArrowRaysIcon />,
	// 	links: [
	// 		{
	// 			title: 'Overview',
	// 			href: '/docs/realtime',
	// 		},
	// 		{
	// 			title: 'Live queries',
	// 			href: '/docs/realtime/live-queries',
	// 		},
	// 		{
	// 			title: 'Graphql subscriptions',
	// 			href: '/docs/realtime/subscriptions',
	// 		},
	// 		{
	// 			title: 'Typescript subscriptions',
	// 			href: '/docs/realtime/typescript',
	// 		},
	// 	],
	// },
	{
		title: 'Storage',
		href: '/docs/storage',
		icon: <ServerIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'Storage',
				href: '/docs/storage',
			},
			{
				title: 'Supported Providers',
				links: [
					{
						title: 'AWS S3',
						href: '/docs/storage/aws-s3',
					},
					{
						title: 'Minio',
						href: '/docs/storage/minio',
					},
				],
			},
		],
	},
	{ type: 'divider' },
	{
		title: 'Platform',
		href: '/docs/architecture',
		paths: [
			'/docs/architecture',
			'/docs/components-of-wundergraph',
			'/docs/supported-data-sources',
			'/docs/supported-frontend-frameworks',
			'/docs/supported-backend-languages-frameworks',
			'/docs/core-concepts',
		],
		icon: <CubeIcon />,
		links: [
			{
				title: 'Architecture',
				links: [
					{
						title: 'Overview',
						navTitle: 'Architecture',
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
					{
						title: 'WunderGraph RPC Protocol explained',
						href: '/docs/architecture/wundergraph-rpc-protocol-explained',
					},
					{
						title: 'WunderGraph Conventions',
						href: '/docs/architecture/wundergraph-conventions',
					},
					{
						title: 'Manage API Dependencies explicitly',
						href: '/docs/architecture/manage-api-dependencies-explicitly',
					},
				],
			},
			{
				title: 'Components of WunderGraph',
				links: [
					{
						title: 'Overview',
						navTitle: 'Components of WunderGraph',
						href: '/docs/components-of-wundergraph',
					},
					{
						title: 'create-wundergraph-app',
						href: '/docs/components-of-wundergraph/create-wundergraph-app',
					},
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
					{
						title: 'WunderHub',
						href: '/docs/components-of-wundergraph/wunderhub',
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
						title: 'The `_join` field',
						href: '/docs/core-concepts/_join-field',
					},
				],
			},
			{
				title: 'Supported Data Sources',
				links: [
					{
						title: 'Overview',
						navTitle: 'Supported Data Sources',
						href: '/docs/supported-data-sources',
					},
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
						title: 'gRPC',
						href: '/docs/supported-data-sources/grpc',
					},
					{
						title: 'SOAP',
						href: '/docs/supported-data-sources/soap',
					},
					{
						title: 'OData',
						href: '/docs/supported-data-sources/odata',
					},
					{
						title: 'Apache Thrift',
						href: '/docs/supported-data-sources/apache-thrift',
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
						title: 'FaunaDB',
						href: '/docs/supported-data-sources/faunadb',
					},
					{
						title: 'Neo4j',
						href: '/docs/supported-data-sources/neo4j',
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
						title: 'React',
						href: '/docs/supported-frontend-frameworks/react-js',
					},
					{
						title: 'React Native',
						href: '/docs/supported-frontend-frameworks/react-native',
					},
					{
						title: 'Next.js',
						href: '/docs/supported-frontend-frameworks/nextjs',
					},
					{
						title: 'ViteJS',
						href: '/docs/supported-frontend-frameworks/vite-js',
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
						title: 'SvelteKit',
						href: '/docs/supported-frontend-frameworks/sveltekit',
					},
					{
						title: 'Vue',
						href: '/docs/supported-frontend-frameworks/vue',
					},
					{
						title: 'Nuxt',
						href: '/docs/supported-frontend-frameworks/nuxt',
					},
					{
						title: 'SolidJS',
						href: '/docs/supported-frontend-frameworks/solidjs',
					},
				],
			},
			{
				title: 'Supported Backend Languages',
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
						title: 'Java / Kotlin',
						href: '/docs/supported-backend-languages-frameworks/java-kotlin',
					},
				],
			},
		],
	},
	{
		title: 'Use Cases',
		href: '/docs/use-cases',
		icon: <LightBulbIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'Use Cases',
				href: '/docs/use-cases',
			},
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
				title: 'Versionless APIs: Easily build backwards compatible APIs',
				href: '/docs/use-cases/versionless-apis-easily-build-backwards-compatible-apis',
			},
			{
				title: 'Multi Database, multi schema ORM',
				href: '/docs/use-cases/multi-database-multi-schema-orm',
			},
			{
				title: 'Generate SDKs for all your APIs',
				href: '/docs/use-cases/generate-sdks-for-all-your-apis',
			},
			{
				title: 'Centralized Governance, Monitoring, Access Controls and Logging across your APIs',
				href: '/docs/use-cases/centralized-governance-monitoring-access-controls-and-logging-across-your-apis',
			},
			{
				title: 'Enabling your Organization to become API first',
				href: '/docs/use-cases/enabling-your-organization-to-become-api-first',
			},
		],
	},
	{
		title: 'Features',
		href: '/docs/features',
		icon: <ListBulletIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'Features',
				href: '/docs/features',
			},
			{
				title: 'TypeScript hooks to customize the API Gateway Middleware',
				href: '/docs/features/type-script-hooks-to-customize-the-api-gateway-middleware',
			},
			{
				title: 'TypeScript webhooks to integrate third party applications',
				href: '/docs/features/type-script-webhooks-to-integrate-third-party-applications',
			},
			{
				title: 'TypeScript Operations',
				href: '/docs/features/typescript-operations',
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
				href: '/docs/features/authorization-role-based-access-control-rbac',
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
				href: '/docs/features/generated-clients-and-sdks',
			},
			{
				title: 'JSON-Schema Validation',
				href: '/docs/features/json-schema-validation',
			},
			{
				title: 'Generated APIs for any Database',
				href: '/docs/features/generated-apis-for-any-database',
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
			{
				title: 'Custom GraphQL Resolvers',
				href: '/docs/features/custom-graphql-resolvers',
			},
			{
				title: 'Generate OpenAPI specs and Postman collections',
				href: '/docs/features/openapi-postman',
			},
		],
	},
	{
		title: 'Cloud',
		href: '/docs/cloud',
		icon: <CloudIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'Cloud',
				href: '/docs/cloud',
			},
			{
				title: 'Workspace Configuration (wg.toml)',
				href: '/docs/cloud/configuration',
			},
			{
				title: 'Errors',
				href: '/docs/cloud/errors',
			},
			{
				title: 'Deployments',
				links: [
					{
						title: 'Deploy to WunderGraph Cloud',
						href: '/docs/cloud/deployments',
					},
					{
						title: 'Add custom domains to your deployment',
						href: '/docs/cloud/custom-domains',
					},
				],
			},
			{
				title: 'Integrations',
				links: [
					{
						title: 'Deploy button',
						href: '/docs/cloud/deploy-button',
					},
					{
						title: 'Vercel',
						href: '/docs/cloud/integrations/vercel',
					},
					{
						title: 'Neon',
						href: '/docs/cloud/integrations/neon',
					},
				],
			},
		],
	},
	{
		title: 'Self-hosted',
		href: '/docs/self-hosted',
		icon: <ServerIcon />,
		links: [
			{ title: 'Overview', href: '/docs/self-hosted', navTitle: 'Self-hosted' },
			{
				title: 'Fly.io',
				href: '/docs/self-hosted/flyio',
			},
			{
				title: 'Docker',
				href: '/docs/self-hosted/docker',
			},
			{
				title: 'Security',
				href: '/docs/self-hosted/security',
			},
		],
	},
	{ type: 'divider' },
	{
		title: 'Clients reference',
		href: '/docs/clients-reference',
		icon: <ComputerDesktopIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'Clients reference',
				href: '/docs/clients-reference',
			},
			{
				title: 'TypeScript Client',
				href: '/docs/clients-reference/typescript-client',
			},
			{
				title: 'SWR',
				href: '/docs/clients-reference/swr',
			},
			{
				title: 'React Query',
				href: '/docs/clients-reference/react-query',
			},
			{
				title: 'React Relay',
				href: '/docs/clients-reference/react-relay',
			},
			{
				title: 'Solid Query',
				href: '/docs/clients-reference/solid-query',
			},
			{
				title: 'Next.js',
				href: '/docs/clients-reference/nextjs',
			},
			{
				title: 'Svelte Query',
				href: '/docs/clients-reference/svelte-query',
			},
		],
	},
	{
		title: 'WunderGraph reference',
		href: '/docs/wundergraph-reference',
		paths: [
			'/docs/wundergraph-config-ts-reference',
			'/docs/wundergraph-operations-ts-reference',
			'/docs/wundergraph-server-ts-reference',
			'/docs/wundergraph-manifest-json-reference',
		],
		icon: <WrenchIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'WunderGraph reference',
				href: '/docs/wundergraph-reference',
			},
			{
				title: 'wundergraph.config.ts',
				links: [
					{
						title: 'Overview',
						navTitle: 'wundergraph.config.ts',
						href: '/docs/wundergraph-config-ts-reference',
					},
					{
						title: 'Data Sources',
						href: '/docs/wundergraph-config-ts-reference/configure-data-sources',
						links: [
							{
								title: 'GraphQL Data Source',
								href: '/docs/wundergraph-config-ts-reference/configure-graphql-data-source',
							},
							{
								title: 'PostgreSQL Data Source',
								href: '/docs/wundergraph-config-ts-reference/configure-postgresql-data-source',
							},
							{
								title: 'MySQL Data Source',
								href: '/docs/wundergraph-config-ts-reference/configure-mysql-data-source',
							},
							{
								title: 'Planetscale Data Source',
								href: '/docs/wundergraph-config-ts-reference/configure-planetscale-data-source',
							},
							{
								title: 'SQLite Data Source',
								href: '/docs/wundergraph-config-ts-reference/configure-sqlite-data-source',
							},
							{
								title: 'SQLServer Data Source',
								href: '/docs/wundergraph-config-ts-reference/configure-sqlserver-data-source',
							},
							{
								title: 'MongoDB / Atlas Data Source',
								href: '/docs/wundergraph-config-ts-reference/configure-mongodb-atlas-data-source',
							},
							{
								title: 'Apollo Federation Data Source',
								href: '/docs/wundergraph-config-ts-reference/configure-apollo-federation-data-source',
							},
							{
								title: 'OpenAPI / REST Data Source',
								href: '/docs/wundergraph-config-ts-reference/configure-openapi-rest-data-source',
							},
							{
								title: 'gRPC Data Source',
								href: '/docs/wundergraph-config-ts-reference/configure-grpc-data-source',
							},
						],
					},
					{
						title: 'Introspection',
						href: '/docs/wundergraph-config-ts-reference/configure-introspection',
					},
					{
						title: 'Code Generation',
						href: '/docs/wundergraph-config-ts-reference/configure-code-generation',
					},
					{
						title: 'CORS',
						href: '/docs/wundergraph-config-ts-reference/configure-cors',
					},
					{
						title: 'Cookie-based Authentication',
						href: '/docs/wundergraph-config-ts-reference/configure-cookie-based-authentication',
					},
					{
						title: 'Token-based Authentication',
						href: '/docs/wundergraph-config-ts-reference/configure-token-based-authentication',
					},
					{
						title: 'Custom Claims',
						href: '/docs/wundergraph-config-ts-reference/configure-custom-claims',
					},
					{
						title: 'Authorization / RBAC',
						href: '/docs/wundergraph-config-ts-reference/configure-authorization',
					},
					{
						title: 'S3 file upload providers',
						href: '/docs/wundergraph-config-ts-reference/configure-s3-file-upload-providers',
					},
					{
						title: 'Advanced Security',
						href: '/docs/wundergraph-config-ts-reference/configure-advanced-security',
					},
					{
						title: 'Headers for HTTP-based Data Sources',
						href: '/docs/wundergraph-config-ts-reference/configure-headers-for-http-based-data-sources',
					},
					{
						title: 'mTLS for HTTP-based Data Sources',
						href: '/docs/wundergraph-config-ts-reference/configure-mtls-for-http-based-data-sources',
					},
					{
						title: 'Schema extension',
						href: '/docs/wundergraph-config-ts-reference/configure-schema-extension',
					},
					{
						title: 'WunderNode Options',
						href: '/docs/wundergraph-config-ts-reference/configure-wundernode-options',
					},
				],
			},
			{
				title: 'wundergraph.operations.ts',
				links: [
					{
						title: 'Overview',
						navTitle: 'wundergraph.operations.ts',
						href: '/docs/wundergraph-operations-ts-reference',
					},
					{
						title: 'Defaults',
						href: '/docs/wundergraph-operations-ts-reference/configure-defaults',
					},
					{
						title: 'Authentication',
						href: '/docs/wundergraph-operations-ts-reference/configure-authentication',
					},
					{
						title: 'Caching',
						href: '/docs/wundergraph-operations-ts-reference/configure-caching',
					},
					{
						title: 'Live Queries',
						href: '/docs/wundergraph-operations-ts-reference/configure-live-queries',
					},
					{
						title: 'Custom Operations Configuration',
						href: '/docs/wundergraph-operations-ts-reference/custom-operations-configuration',
					},
				],
			},
			{
				title: 'wundergraph.server.ts',
				links: [
					{
						title: 'Overview',
						navTitle: 'wundergraph.server.ts',
						href: '/docs/wundergraph-server-ts-reference',
					},
					{
						title: 'WunderGraph Server Options',
						href: '/docs/wundergraph-server-ts-reference/configure-wundergraph-server-options',
					},
					{
						title: 'Webhooks',
						href: '/docs/wundergraph-server-ts-reference/webhooks',
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
						title: 'onConnectionInit hook',
						href: '/docs/wundergraph-server-ts-reference/ws-transport-connection-init-hook',
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
						title: 'postLogout hook',
						href: '/docs/wundergraph-server-ts-reference/post-logout-hook',
					},
					{
						title: 'Custom GraphQL Servers',
						href: '/docs/wundergraph-server-ts-reference/custom-graphql-servers',
					},
				],
			},
		],
	},
	{
		title: 'Operations reference',
		href: '/docs/operations-reference',
		icon: <CogIcon />,
		paths: ['/docs/typescript-operations-reference', '/docs/directives-reference'],
		links: [
			{
				title: 'Overview',
				navTitle: 'Operations reference',
				href: '/docs/operations-reference',
			},
			{
				title: 'GraphQL Operations',
				links: [
					{
						title: 'Overview',
						navTitle: 'GraphQL Operations',
						href: '/docs/directives-reference',
					},
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
						title: '@injectGeneratedUUID directive',
						href: '/docs/directives-reference/inject-generated-uuid-directive',
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
				title: 'TypeScript Operations',
				links: [
					{
						title: 'Overview',
						navTitle: 'TypeScript Operations',
						href: '/docs/typescript-operations-reference',
					},
					{
						title: 'Queries (READ)',
						href: '/docs/typescript-operations-reference/queries',
					},
					{
						title: 'Mutations (WRITE)',
						href: '/docs/typescript-operations-reference/mutations',
					},
					{
						title: 'Subscriptions (STREAM)',
						href: '/docs/typescript-operations-reference/subscriptions',
					},
					{
						title: 'Authentication & Authorization',
						href: '/docs/typescript-operations-reference/authentication-authorization',
					},
					{
						title: 'Calling Operations from clients',
						href: '/docs/typescript-operations-reference/calling-operations-from-clients',
					},
					{
						title: 'Calling Operations from Operations',
						href: '/docs/typescript-operations-reference/calling-operations-from-operations',
					},
					{
						title: 'Security',
						href: '/docs/typescript-operations-reference/security',
					},
				],
			},
		],
	},
	{
		title: 'CLI Reference',
		href: '/docs/cli-reference',
		icon: <CommandLineIcon />,
		paths: ['/docs/wunderctl-reference'],
		links: [
			{
				title: 'Overview',
				navTitle: 'CLI Reference',
				href: '/docs/cli-reference',
			},
			{
				title: 'create-wundergraph-app',
				links: [
					{
						title: 'create-wundergraph-app',
						href: '/docs/cli-reference/create-wundergraph-app',
					},
				],
			},
			{
				title: 'wunderctl reference',
				links: [
					{
						title: 'Overview',
						navTitle: 'wunderctl reference',
						href: '/docs/wunderctl-reference',
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
						title: 'wunderctl version',
						href: '/docs/wunderctl-reference/wunderctl-version',
					},
					{
						title: 'wunderctl start',
						href: '/docs/wunderctl-reference/wunderctl-start',
					},
					{
						title: 'wunderctl node start',
						href: '/docs/wunderctl-reference/wunderctl-node-start',
					},
					{
						title: 'wunderctl server start',
						href: '/docs/wunderctl-reference/wunderctl-server-start',
					},
				],
			},
		],
	},
	{ type: 'divider' },
	{
		title: 'About WunderGraph',
		href: '/manifesto',
		icon: <QuestionMarkCircleIcon />,
		links: [
			{
				title: 'Manifesto',
				href: '/manifesto',
			},
			{
				title: 'Usage Information',
				href: '/usage-information',
			},
			{
				title: 'Frequently Asked Questions',
				links: [
					{
						title: 'How is WunderGraph faster and more secure than other GraphQL solutions?',
						href: '/docs/frequently-asked-questions/how-is-wundergraph-faster-and-more-secure-than-other-graphql-solutions',
					},
					{
						title: 'How is the developer experience different from legacy GraphQL?',
						href: '/docs/frequently-asked-questions/how-is-the-developer-experience-different-from-legacy-graphql',
					},
					{
						title: 'How is server-side only GraphQL different from client-side GraphQL?',
						href: '/docs/frequently-asked-questions/how-is-server-side-only-graphql-different-from-client-side-graphql',
					},
				],
			},
		],
	},
	// {
	// 	title: 'Troubleshooting',
	// 	href: '/docs/troubleshooting',
	// 	icon: <BugAntIcon />,
	// },
	{
		title: 'Upgrade guides',
		href: '/docs/upgrade-guides',
		icon: <ArrowUpCircleIcon />,
		links: [
			{
				title: 'Overview',
				navTitle: 'Upgrade guides',
				href: '/docs/upgrade-guides',
			},
			{
				title: 'Pre 1.0 changes',
				links: [
					{
						title: 'Simplified URL structure',
						href: '/docs/upgrade-guides/simplifying-the-wundergraph-url-structure',
					},
				],
			},
		],
	},
];

export default navigation;
