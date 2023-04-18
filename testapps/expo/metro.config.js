// Learn more https://docs.expo.io/guides/customizing-metro
const { withWunderGraphConfig } = require('@wundergraph/expo');
const { makeMetroConfig } = require('@rnx-kit/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');
const path = require('path');

module.exports = withWunderGraphConfig(
	makeMetroConfig({
		resolver: {
			resolveRequest: (context, moduleName, platform) => {
				// React Native doesn't support exports field in package.json, so we resolve it manually.
				// console.log(path.join(__dirname, 'App'), moduleName);
				// if (moduleName.startsWith('../../App')) {
				// 	console.log(path.join(__dirname, 'App'), moduleName);
				// 	return context.resolveRequest(context, path.join(__dirname, 'App'), platform);
				// }

				return new MetroSymlinksResolver(path);
			},
		},
		transformer: {
			getTransformOptions: async () => ({
				transform: {
					experimentalImportSupport: false,
					inlineRequires: true,
				},
			}),
		},
	})
);
