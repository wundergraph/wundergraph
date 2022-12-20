// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
	...config,
	resolver: {
		...config.resolver,
		resolveRequest: (context, moduleName, platform) => {
			// React Native doesn't support exports field in package.json, so we resolve it manually.
			if (moduleName.startsWith('@wundergraph/sdk/client')) {
				return context.resolveRequest(context, '@wundergraph/sdk/dist/client', platform);
			}

			if (moduleName.startsWith('@wundergraph/sdk/internal')) {
				return context.resolveRequest(context, '@wundergraph/sdk/dist/internal', platform);
			}

			return context.resolveRequest(context, moduleName, platform);
		},
	},
};
