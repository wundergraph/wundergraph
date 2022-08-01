const withMarkdoc = require('@markdoc/next.js')

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
		]
	},
}

const production = process.env.NODE_ENV === 'production'

module.exports = withMarkdoc({ mode: production ? 'static' : 'server' })(
	nextConfig
)
