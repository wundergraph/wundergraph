const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	webpack: (config, options) => {
		if (options.isServer) {
			config.externals = ['@tanstack/react-query', ...config.externals];
		}

		const reactQuery = path.resolve(require.resolve('@tanstack/react-query'));

		config.resolve.alias['@tanstack/react-query'] = reactQuery;
		return config;
	},
};

module.exports = nextConfig;
