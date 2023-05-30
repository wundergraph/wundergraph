/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: true,
	},
	compiler: {
		relay: {
			src: './',
			language: 'typescript',
			artifactDirectory: 'src/__relay__generated__',
		},
	},
};

module.exports = nextConfig;
