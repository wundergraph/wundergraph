import type { AsyncApiIntrospector, CodeGen, S3UploadConfiguration } from '../configure';
import type {
	AuthProviderConfig,
	AuthProviderTypes,
	WunderGraphConfig,
	WunderGraphAppConfig,
	InternalIntegration,
	AuthenticationHookContext,
	HttpHookContext,
	WunderGraphIntegrationHooks,
} from './types';
import logger from '../logger';
import type { FastifyHooksOptions } from '../server/plugins/hooks';
import type { OperationsConfiguration } from '../configure/operations';
import merge from 'lodash/merge';

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

const prepareConfig = (config: WunderGraphConfig): WunderGraphAppConfig => {
	const { operations = {}, authentication, ...rest } = config;
	const { redirectUris = [] } = authentication || {};

	return {
		...rest,
		operations: {
			defaultConfig: merge(
				{
					authentication: {
						required: false,
					},
				},
				operations.defaultConfig || {}
			),
			queries: (config) =>
				merge(
					{
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
					},
					operations.queries || {}
				),
			mutations: (config) =>
				merge(
					{
						...config,
					},
					operations.mutations || {}
				),
			subscriptions: (config) =>
				merge(
					{
						...config,
					},
					operations.subscriptions || {}
				),
			custom: Object.entries(operations.custom || {}).reduce<OperationsConfiguration['custom']>((acc, [key, value]) => {
				if (!acc) {
					acc = {};
				}
				acc[key] = (config: any) => merge(config, value);
				return acc;
			}, {}),
		},
		apis: [],
		authentication: {
			tokenBased: {
				providers: [],
			},
			cookieBased: {
				providers: [],
				authorizedRedirectUriRegexes: redirectUris,
			},
		},
	};
};

export const runHookConfigSetup = async ({ config }: { config: WunderGraphConfig }) => {
	let wgConfig = prepareConfig(config);

	const integrations = config.datasources
		.concat(config.integrations || [])
		.concat(config.authentication?.providers || []);

	for (const integration of integrations) {
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
					wgConfig.authentication[type]?.providers?.push(authProvider as any);
				},
				addS3Provider: (s3Provider: S3UploadConfiguration) => {
					if (!wgConfig.s3UploadProvider) {
						wgConfig.s3UploadProvider = [];
					}
					wgConfig.s3UploadProvider?.push(s3Provider);
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

export const runHookConfigGenerated = async ({
	config,
	appConfig,
}: {
	config: WunderGraphConfig;
	appConfig: WunderGraphAppConfig;
}) => {
	const configWithAppConfig = {
		...config,
		appConfig,
	};

	const integrations = config.integrations || [];
	for (const integration of integrations) {
		if (integration.hooks?.['config:generated']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['config:generated'](configWithAppConfig),
			});
		}
	}
};

export const runHookHttpOriginTransport = async ({
	config,
	context,
}: {
	config: FastifyHooksOptions;
	context: HttpHookContext;
}) => {
	for (const integration of config.integrations as InternalIntegration[]) {
		if (integration.hooks?.['http:transport']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['http:transport'](context),
			});
		}
	}
};

export const runHookPostAuthentication = async ({
	config,
	context,
}: {
	config: FastifyHooksOptions;
	context: AuthenticationHookContext;
}) => {
	for (const integration of config.integrations as InternalIntegration[]) {
		if (integration.hooks?.['authentication:postAuthentication']) {
			await withTakingALongTimeMsg({
				name: integration.name,
				hookResult: integration.hooks['authentication:postAuthentication'](context),
			});
		}
	}
};

export const hasIntegrationHooks = (integrations: InternalIntegration[], hook: keyof WunderGraphIntegrationHooks) => {
	return integrations?.some((integration) => typeof integration.hooks?.[hook] === 'function');
};
