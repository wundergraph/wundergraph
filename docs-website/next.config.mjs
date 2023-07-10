import withMarkdoc from '@markdoc/next.js';
import { SearchPlugin } from './searchPlugin.mjs';

const production = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md'],
	async redirects() {
		return [
			{
				source: '/manifesto',
				destination: '/introduction-to-wundergraph',
				permanent: false,
			},
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
	webpack: (config, options) => {
		if (options.nextRuntime !== 'edge' && options.isServer) {
			config.plugins ||= [];
			config.plugins.push(new SearchPlugin());
		}
		return config;
	},
};

export default withMarkdoc({ mode: production ? 'static' : 'server' })(nextConfig);
