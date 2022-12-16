const path = require('path');
const webpack = require('webpack');
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	webpack: (config) => {
		config.plugins = config.plugins.concat([
			new webpack.NormalModuleReplacementPlugin(/\@tanstack\/react-query$/, (resource) => {
				resource.dependencyType = 'commonjs';
			}),
		]);

		return config;
	},
};

module.exports = nextConfig;
