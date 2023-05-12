const withMarkdoc = require('@markdoc/next.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md'],
	async redirects() {
		return [
			{
				source: '/docs',
				destination: '/',
				permanent: true,
			},
			{
				source: '/docs/pre-1-0-changes',
				destination: '/docs/upgrade-guides',
				permanent: true,
			},
			{
				source: '/docs/pre-1-0-changes/:path*',
				destination: '/docs/upgrade-guides/:path*',
				permanent: true,
			},
			{
				source: '/docs/pre-1-0-changes',
				destination: '/docs/upgrade-guides',
				permanent: true,
			},
			{
				source: '/docs/deployment/flyio',
				destination: '/docs/self-hosted/flyio',
				permanent: true,
			},
			{
				source: '/docs/wundergraph-config-ts-reference/configure-wundergraph-application',
				destination: '/docs/wundergraph-config-ts-reference',
				permanent: true,
			},
			{
				source: '/getting-started',
				destination: '/docs/getting-started',
				permanent: true,
			},
			{
				source: '/docs/guides/publish-generated-client-to-npm',
				destination: '/docs/guides/bundle-generated-client-for-distribution',
				permanent: true,
			},
			{
				source: '/docs/tutorials/your-first-wundergraph-application',
				destination: '/docs/getting-started/quickstart',
				permanent: true,
			},
		];
	},
};

const production = process.env.NODE_ENV === 'production';

module.exports = withMarkdoc({ mode: production ? 'static' : 'server' })(nextConfig);
