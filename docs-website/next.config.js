const withMarkdoc = require('@markdoc/next.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	pageExtensions: ['js', 'jsx', 'md'],
	experimental: {
		newNextLinkBehavior: true,
		images: {
			allowFutureImage: true,
		},
	},
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
		];
	},
};

const production = process.env.NODE_ENV === 'production';

module.exports = withMarkdoc({ mode: production ? 'static' : 'server' })(nextConfig);
