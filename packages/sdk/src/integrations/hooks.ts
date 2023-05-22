import { AsyncApiIntrospector, CodeGen, WunderGraphConfigApplicationConfig } from '../configure';
import { AuthenticationHookRequest } from '../server';
import { AuthProviderConfig, AuthProviderTypes, UserConfig, WunderGraphConfig } from './types';

export const runHookConfigSetup = async ({ config }: { config: UserConfig }) => {
	let updatedConfig = { ...config };
	let wgConfig: WunderGraphConfigApplicationConfig = {
		apis: [],
		authentication: {
			tokenBased: {
				providers: [],
			},
			cookieBased: {
				providers: [],
			},
		},
	};

	for (const integration of updatedConfig.integrations) {
		if (integration.hooks?.['config:setup']) {
			const options = {
				addApi: (api: AsyncApiIntrospector<any>) => {
					wgConfig.apis.push(api);
				},
				addAuthProvider: <Type extends AuthProviderTypes>(
					type: AuthProviderTypes,
					authProvider: AuthProviderConfig[Type]
				) => {
					if (!wgConfig.authentication) {
						wgConfig.authentication = {
							tokenBased: {
								providers: [],
							},
							cookieBased: {
								providers: [],
							},
						};
					}
					wgConfig.authentication[type]?.providers?.push(authProvider);
				},
				addCodeGeneration: (codeGen: CodeGen) => {
					if (!wgConfig.generate) {
						wgConfig.generate = {
							codeGenerators: [],
						};
					} else if (!wgConfig.generate.codeGenerators) {
						wgConfig.generate.codeGenerators = [];
					}
					wgConfig.generate.codeGenerators?.push(codeGen);
				},
			};
			await integration.hooks['config:setup'](options);
		}
	}

	return wgConfig;
};

export const runHookConfigGenerated = async ({ config }: { config: WunderGraphConfig }) => {
	for (const integration of config.integrations) {
		if (integration.hooks?.['config:generated']) {
			await integration.hooks['config:generated'](config);
		}
	}
};

interface HookContext extends AuthenticationHookRequest {
	operationName: string;
	input: any;
}

export const runHookQueriesPreResolve = async ({
	config,
	context,
}: {
	config: WunderGraphConfig;
	context: HookContext;
}) => {
	for (const integration of config.integrations) {
		if (integration.hooks?.['hooks:queries:preResolve']) {
			await integration.hooks['hooks:queries:preResolve'](config);
		}
	}
};
