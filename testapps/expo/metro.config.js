// Learn more https://docs.expo.io/guides/customizing-metro
const { withWunderGraphConfig } = require('@wundergraph/react-native');
const { makeMetroConfig } = require('@rnx-kit/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../');
const projectRoot = __dirname;

const symlinkResolver = MetroSymlinksResolver();

module.exports = withWunderGraphConfig(
	makeMetroConfig({
		projectRoot,
		resolver: {
			nodeModulesPaths: [path.resolve(projectRoot, 'node_modules'), path.resolve(workspaceRoot, 'node_modules')],
			resolveRequest: (context, moduleName, platform) => {
				if (moduleName.startsWith('@wundergraph/react-native')) {
					return context.resolveRequest(context, moduleName, platform);
				}
				if (moduleName.startsWith('../../App')) {
					return context.resolveRequest(context, path.join(__dirname, 'App'), platform);
				}

				return symlinkResolver(context, moduleName, platform);
			},
		},
		// transformer: {
		// 	getTransformOptions: async () => ({
		// 		transform: {
		// 			experimentalImportSupport: true,
		// 			inlineRequires: true,
		// 		},
		// 	}),
		// },
	})
);
