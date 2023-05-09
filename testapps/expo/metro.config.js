// Learn more https://docs.expo.io/guides/customizing-metro
const { wgMetroConfig } = require('@wundergraph/metro-config');
const { makeMetroConfig } = require('@rnx-kit/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../');
const projectRoot = __dirname;

const symlinkResolver = MetroSymlinksResolver();

module.exports = wgMetroConfig(
	makeMetroConfig({
		projectRoot,
		resolver: {
			nodeModulesPaths: [path.resolve(projectRoot, 'node_modules'), path.resolve(workspaceRoot, 'node_modules')],
			resolveRequest: (context, moduleName, platform) => {
				if (moduleName.startsWith('../../App')) {
					return context.resolveRequest(context, path.join(__dirname, 'App'), platform);
				}

				return symlinkResolver(context, moduleName, platform);
			},
		},
	})
);
