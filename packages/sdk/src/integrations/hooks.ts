import { AsyncApiIntrospector, CodeGen } from '../configure';
import { AuthenticationHookRequest } from '../server';
import { AuthProviderConfig, AuthProviderTypes, WunderGraphConfig, WunderGraphAppConfig } from './types';
import logger from '../logger';
import { FastifyHooksOptions } from '../server/plugins/hooks';

async function withTakingALongTimeMsg<T>({
	name,
	hookResult,
	timeoutMs = 3000,
}: {
	name: string;
	hookResult: T | Promise<T>;
	timeoutMs?: number;
}): Promise<T> {
	const timeout = setTimeout(() => {
		logger.info(`Waiting for the ${name} integration...`);
	}, timeoutMs);
	const result = await hookResult;
	clearTimeout(timeout);
	return result;
}

export const runHookConfigSetup = async ({ config }: { config: WunderGraphConfig }) => {
	let wgConfig: WunderGraphAppConfig = {
		...config,
		operations: {
			// @todo these defaults and having to set them here is ugly and not intuitive
			defaultConfig: {
				authentication: {
					required: false,
				},
			},
			queries: (config) => ({
				...config,
				caching: {
					enable: false,
					staleWhileRevalidate: 60,
					maxAge: 60,
					public: true,
				},
				liveQuery: {
					enable: true,
					pollingIntervalSeconds: 1,
				},
			}),
			mutations: (config) => ({
				...config,
			}),
			subscriptions: (config) => ({
				...config,
			}),
			custom: {},
			...config.operations,
		},
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

	for (const integration of config.integrations) {
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
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['config:setup'](options),
			});
		}
	}

	return wgConfig;
};

export const runHookConfigGenerated = async ({ config }: { config: WunderGraphConfig }) => {
	for (const integration of config.integrations) {
		if (integration.hooks?.['config:generated']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['config:generated'](config),
			});
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
	config: FastifyHooksOptions;
	context: HookContext;
}) => {
	for (const integration of config.integrations) {
		if (integration.hooks?.['hooks:queries:preResolve']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['hooks:queries:preResolve'](context),
			});
		}
	}
};
