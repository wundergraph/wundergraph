import fs from 'fs';
import {
	Api,
	Application,
	DatabaseApiCustom,
	DataSource,
	GraphQLApiCustom,
	introspectGraphqlServer,
	RESTApiCustom,
	StaticApiCustom,
	WG_DATA_SOURCE_POLLING_MODE,
} from '../definition';
import { mergeApis, removeBaseSchema } from '../definition/merge';
import { generateDotGraphQLConfig } from '../dotgraphqlconfig';
import { GraphQLOperation, loadOperations, parseOperations, removeHookVariables } from '../graphql/operations';
import { GenerateCode, Template } from '../codegen';
import {
	ArgumentRenderConfiguration,
	ArgumentSource,
	AuthProvider,
	ConfigurationVariable,
	ConfigurationVariableKind,
	CorsConfiguration,
	DataSourceConfiguration,
	DataSourceKind,
	FieldConfiguration,
	Operation,
	OperationType,
	PostResolveTransformationKind,
	TypeConfiguration,
	WebhookConfiguration,
	WunderGraphConfiguration,
} from '@wundergraph/protobuf';
import { SDK_VERSION } from '../version';
import { AuthenticationProvider } from './authentication';
import { FieldInfo, LinkConfiguration, LinkDefinition, queryTypeFields } from '../linkbuilder';
import {
	buildSchema,
	FieldDefinitionNode,
	InputValueDefinitionNode,
	Kind,
	parse,
	parseType,
	print,
	stripIgnoredCharacters,
	visit,
} from 'graphql';
import { PostmanBuilder } from '../postman/builder';
import path from 'path';
import { applyNamespaceToApi } from '../definition/namespacing';
import _ from 'lodash';
import { wunderctlExec } from '../wunderctlexec';
import colors from 'colors';
import { CustomizeMutation, CustomizeQuery, CustomizeSubscription, OperationsConfiguration } from './operations';
import {
	AuthenticationHookRequest,
	AuthenticationResponse,
	WunderGraphHooksAndServerConfig,
	WunderGraphUser,
} from '../middleware/types';
import { getWebhooks } from '../webhooks';
import process from 'node:process';
import {
	NodeOptions,
	ResolvedNodeOptions,
	ResolvedServerOptions,
	resolveNodeOptions,
	resolveServerOptions,
	serverOptionsWithDefaults,
} from './options';
import { EnvironmentVariable, InputVariable, mapInputVariable, resolveConfigurationVariable } from './variables';
import { InternalClient } from '../middleware/internal-client';
import { Logger } from '../logger';

export interface WunderGraphCorsConfiguration {
	allowedOrigins: InputVariable[];
	allowedMethods?: string[];
	allowedHeaders?: string[];
	exposedHeaders?: string[];
	maxAge?: number;
	allowCredentials?: boolean;
}

export interface WunderGraphConfigApplicationConfig {
	application: Application;
	codeGenerators?: CodeGen[];
	options?: NodeOptions;
	server?: WunderGraphHooksAndServerConfig;
	cors?: WunderGraphCorsConfiguration;
	s3UploadProvider?: S3Provider;
	operations?: OperationsConfiguration;
	authorization?: {
		roles?: string[];
	};
	authentication?: {
		cookieBased?: {
			providers: AuthenticationProvider[];
			// authorizedRedirectUris is a whitelist of allowed URIs to redirect to after a successful login
			// the values are used as exact string matches
			// URIs always match, independent of a trailing slash or not
			// e.g. if a authorized URI is "http://localhost:3000", the URI "http://localhost:3000/" would also match
			// or if the authorized URI is "http://localhost:3000/auth", the URI "http://localhost:3000/auth/" would also match
			// if you need more flexibility, use authorizedRedirectUriRegexes instead
			authorizedRedirectUris?: InputVariable[];
			// authorizedRedirectUriRegexes is a whitelist of allowed URIs to redirect to after a successful login using regexes
			// make sure to set boundaries properly, e.g:
			// "^http://localhost:3000$"
			// without boundaries, all URIs would match, e.g:
			// "http://localhost:3000" would match if the URI was "http://localhost:3000/anything" because of the missing boundary
			authorizedRedirectUriRegexes?: InputVariable[];
			// secureCookieHashKey is used to encrypt user cookies, should be 11 bytes
			secureCookieHashKey?: InputVariable;
			// secureCookieBlockKey is used to encrypt user cookies, should be 32 bytes
			secureCookieBlockKey?: InputVariable;
			// csrfTokenSecret is the secret to enable the csrf middleware, should be 32 bytes
			csrfTokenSecret?: InputVariable;
		};
		tokenBased?: {
			providers: TokenAuthProvider[];
		};
	};
	links?: LinkConfiguration;
	dotGraphQLConfig?: DotGraphQLConfig;
	security?: SecurityConfig;
}

export interface TokenAuthProvider {
	jwksJSON?: InputVariable;
	jwksURL?: InputVariable;
	userInfoEndpoint?: InputVariable;
	userInfoCacheTtlSeconds?: number;
}

export interface SecurityConfig {
	enableGraphQLEndpoint?: boolean;
	// allowedHosts defines allowed hosts
	// e.g. when running WunderGraph on localhost:9991, but your external host pointing to the internal IP is example.com,
	// you have to add "example.com" to the allowedHosts so that the WunderGraph router allows the hostname.
	allowedHosts?: InputVariable[];
}

export interface DotGraphQLConfig {
	// hasDotWunderGraphDirectory should be set to true if the project has a ".wundergraph" directory as the WunderGraph root
	// the default is true so this config doesn't have to be touched usually
	// only set it to false if you don't have a ".wundergraph" directory in your project
	hasDotWunderGraphDirectory?: boolean;
}

export enum HooksConfigurationOperationType {
	Queries = 'queries',
	Mutations = 'mutations',
	Subscriptions = 'subscriptions',
}

export interface OperationHookFunction {
	(...args: any[]): Promise<any>;
}

export interface OperationHooksConfiguration<AsyncFn = OperationHookFunction> {
	mockResolve?: AsyncFn;
	preResolve?: AsyncFn;
	postResolve?: AsyncFn;
	mutatingPreResolve?: AsyncFn;
	mutatingPostResolve?: AsyncFn;
	customResolve?: AsyncFn;
}

// Any is used here because the exact type of the hooks is not known at compile time
// We could work with an index signature + base type, but that would allow to add arbitrary data to the hooks
export type OperationHooks = Record<string, any>;

export interface HooksConfiguration<
	Queries extends OperationHooks = OperationHooks,
	Mutations extends OperationHooks = OperationHooks,
	Subscriptions extends OperationHooks = OperationHooks,
	User extends WunderGraphUser = WunderGraphUser,
	// Any is used here because the exact type of the base client is not known at compile time
	// We could work with an index signature + base type, but that would allow to add arbitrary data to the client
	IC extends InternalClient = InternalClient<any, any>
> {
	global?: {
		httpTransport?: {
			onOriginRequest?: {
				hook: OperationHookFunction;
				enableForOperations?: string[];
				enableForAllOperations?: boolean;
			};
			onOriginResponse?: {
				hook: OperationHookFunction;
				enableForOperations?: string[];
				enableForAllOperations?: boolean;
			};
		};
		wsTransport?: {
			onConnectionInit?: {
				hook: OperationHookFunction;
				enableForDataSources: string[];
			};
		};
	};
	authentication?: {
		postAuthentication?: (hook: AuthenticationHookRequest<User, IC>) => Promise<void>;
		mutatingPostAuthentication?: (hook: AuthenticationHookRequest<User, IC>) => Promise<AuthenticationResponse<User>>;
		revalidate?: (hook: AuthenticationHookRequest<User, IC>) => Promise<AuthenticationResponse<User>>;
		postLogout?: (hook: AuthenticationHookRequest<User, IC>) => Promise<void>;
	};
	[HooksConfigurationOperationType.Queries]?: Queries;
	[HooksConfigurationOperationType.Mutations]?: Mutations;
	[HooksConfigurationOperationType.Subscriptions]?: Subscriptions;
}
export interface DeploymentAPI {
	apiConfig: () => {
		id: string;
		name: string;
	};
}

export interface DeploymentEnvironment {
	environmentConfig: () => {
		id: string;
		name: string;
	};
}

export interface CodeGen {
	path?: string;
	templates: Template[];
}

export type S3Provider = S3UploadConfiguration[];

export interface ResolvedApplication {
	Name: string;
	EnableSingleFlight: boolean;
	EngineConfiguration: Api<any>;
	Operations: GraphQLOperation[];
	CorsConfiguration: CorsConfiguration;
	S3UploadProvider: S3Provider;
}

interface ResolvedDeployment {
	name: string;
	api: {
		id: string;
		name: string;
	};
	environment: {
		id: string;
		name: string;
		baseUrl: string;
	};
	path: string;
}

interface S3UploadConfiguration {
	name: string;
	endpoint: InputVariable;
	accessKeyID: InputVariable;
	secretAccessKey: InputVariable;
	bucketName: InputVariable;
	bucketLocation: InputVariable;
	useSSL: boolean;
}

export interface ResolvedWunderGraphConfig {
	application: ResolvedApplication;
	deployment: ResolvedDeployment;
	sdkVersion: string;
	authentication: {
		roles: string[];
		cookieBased: AuthProvider[];
		tokenBased: TokenAuthProvider[];
		authorizedRedirectUris: ConfigurationVariable[];
		authorizedRedirectUriRegexes: ConfigurationVariable[];
		hooks: {
			postAuthentication: boolean;
			mutatingPostAuthentication: boolean;
			revalidateAuthentication: boolean;
			postLogout: boolean;
		};
		cookieSecurity: {
			secureCookieHashKey: ConfigurationVariable;
			secureCookieBlockKey: ConfigurationVariable;
			csrfTokenSecret: ConfigurationVariable;
		};
	};
	enableGraphQLEndpoint: boolean;
	security: {
		allowedHostNames: ConfigurationVariable[];
	};
	interpolateVariableDefinitionAsJSON: string[];
	webhooks: WebhookConfiguration[];
	nodeOptions: ResolvedNodeOptions;
	serverOptions?: ResolvedServerOptions;
}

const resolveConfig = async (config: WunderGraphConfigApplicationConfig): Promise<ResolvedWunderGraphConfig> => {
	const api = {
		id: '',
		name: config.application.name,
	};

	const resolvedNodeOptions = resolveNodeOptions(config.options);
	const serverOptions = serverOptionsWithDefaults(config.server?.options);
	const resolvedServerOptions = resolveServerOptions(serverOptions);

	const name = 'main';
	const publicNodeUrl = trimTrailingSlash(resolveConfigurationVariable(resolvedNodeOptions.publicNodeUrl));

	const environment = {
		id: '',
		name: name,
		baseUrl: publicNodeUrl,
	};

	const deploymentConfiguration: ResolvedDeployment = {
		api,
		environment,
		name,
		path: api.name + '/' + name,
	};

	const cors: CorsConfiguration = {
		maxAge: config.cors?.maxAge || 60,
		allowedHeaders: config.cors?.allowedHeaders || [],
		allowedMethods: config.cors?.allowedMethods || [],
		exposedHeaders: config.cors?.exposedHeaders || [],
		allowCredentials: config.cors?.allowCredentials || false,
		allowedOrigins: (config.cors?.allowedOrigins || [new EnvironmentVariable('WG_ALLOWED_ORIGIN', '*')])
			.map((origin) =>
				typeof origin === 'string' && origin.endsWith('/') ? origin.substring(0, origin.length - 1) : origin
			)
			.map(mapInputVariable),
	};

	const graphqlApis = config.server?.graphqlServers?.map((gs) => {
		const serverPath = customGqlServerMountPath(gs.serverName);

		return introspectGraphqlServer({
			skipRenameRootFields: gs.skipRenameRootFields,
			url: '',
			baseUrl: serverOptions.serverUrl,
			path: serverPath,
			apiNamespace: gs.apiNamespace,
			schema: gs.schema,
		});
	});

	if (graphqlApis) {
		config.application.apis.push(...graphqlApis);
	}

	const apps = [config.application];
	const roles = config.authorization?.roles || ['admin', 'user'];

	const resolved = (await resolveApplications(roles, apps, cors, config.s3UploadProvider || []))[0];

	const cookieBasedAuthProviders: AuthProvider[] =
		(config.authentication !== undefined &&
			config.authentication.cookieBased !== undefined &&
			config.authentication.cookieBased.providers
				.map((provider) => provider.resolve())
				.map((provider) => ({
					...provider,
					id: _.camelCase(provider.id),
				}))) ||
		[];

	const resolvedConfig: ResolvedWunderGraphConfig = {
		application: resolved,
		deployment: deploymentConfiguration,
		sdkVersion: SDK_VERSION,
		authentication: {
			roles,
			cookieBased: cookieBasedAuthProviders,
			tokenBased: config.authentication?.tokenBased?.providers || [],
			authorizedRedirectUris:
				config.authentication?.cookieBased?.authorizedRedirectUris?.map((stringOrEnvironmentVariable) => {
					if (typeof stringOrEnvironmentVariable === 'string') {
						const configVariable: ConfigurationVariable = {
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							environmentVariableDefaultValue: '',
							environmentVariableName: '',
							placeholderVariableName: '',
							staticVariableContent: stringOrEnvironmentVariable,
						};
						return configVariable;
					}
					const environmentVariable = stringOrEnvironmentVariable as EnvironmentVariable;
					const variable: ConfigurationVariable = {
						kind: ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE,
						staticVariableContent: '',
						placeholderVariableName: '',
						environmentVariableDefaultValue: environmentVariable.defaultValue || '',
						environmentVariableName: environmentVariable.name,
					};
					return variable;
				}) || [],
			authorizedRedirectUriRegexes:
				config.authentication?.cookieBased?.authorizedRedirectUriRegexes?.map(mapInputVariable) || [],
			hooks: {
				postAuthentication: config.server?.hooks?.authentication?.postAuthentication !== undefined,
				mutatingPostAuthentication: config.server?.hooks?.authentication?.mutatingPostAuthentication !== undefined,
				revalidateAuthentication: config.server?.hooks?.authentication?.revalidate !== undefined,
				postLogout: config.server?.hooks?.authentication?.postLogout !== undefined,
			},
			cookieSecurity: {
				secureCookieHashKey: mapInputVariable(config.authentication?.cookieBased?.secureCookieHashKey || ''),
				secureCookieBlockKey: mapInputVariable(config.authentication?.cookieBased?.secureCookieBlockKey || ''),
				csrfTokenSecret: mapInputVariable(config.authentication?.cookieBased?.csrfTokenSecret || ''),
			},
		},
		enableGraphQLEndpoint: config.security?.enableGraphQLEndpoint === true,
		security: {
			allowedHostNames: config.security?.allowedHosts?.map(mapInputVariable) || [],
		},
		interpolateVariableDefinitionAsJSON: resolved.EngineConfiguration.interpolateVariableDefinitionAsJSON,
		webhooks: [],
		nodeOptions: resolvedNodeOptions,
		serverOptions: resolvedServerOptions,
	};

	if (config.links) {
		return addLinks(resolvedConfig, config.links);
	}

	return resolvedConfig;
};

const addLinks = (config: ResolvedWunderGraphConfig, links: LinkDefinition[]): ResolvedWunderGraphConfig => {
	const schema = buildSchema(config.application.EngineConfiguration.Schema);
	const queryTypeName = (schema.getQueryType() || { name: '' }).name;
	const fields = queryTypeFields(schema);
	links.forEach((link) => {
		config = addLink(config, link, fields, queryTypeName);
	});
	return config;
};

const addLink = (
	config: ResolvedWunderGraphConfig,
	link: LinkDefinition,
	fields: FieldInfo[],
	queryTypeName: string
): ResolvedWunderGraphConfig => {
	const schema = parse(config.application.EngineConfiguration.Schema);
	let fieldInfo: FieldInfo | undefined;
	config.application.EngineConfiguration.Schema = print(
		visit(schema, {
			ObjectTypeDefinition: (node) => {
				if (node.name.value !== link.targetType) {
					return;
				}
				if ((node.fields || []).find((field) => field.name.value === link.targetFieldName)) {
					return;
				}

				fieldInfo = fields.find((field) => field.typeName === queryTypeName && field.fieldName === link.sourceField);
				if (fieldInfo === undefined) {
					return;
				}

				fieldInfo.arguments.forEach((expected) => {
					const exists = link.argumentSources.find((actual) => actual.name === expected.name) !== undefined;
					if (!exists) {
						Logger.error(
							`configuration missing for argument: ${expected.name} on targetField: ${link.targetFieldName} on targetType: ${link.targetType}`
						);
						Logger.info(
							'please add \'.argument("towerIds", ...)\' to the linkBuilder or the resolver will not be configured properly'
						);
					}
				});

				const args: InputValueDefinitionNode[] = link.argumentSources
					.filter((arg) => arg.type === 'fieldArgument')
					.map((arg) => {
						const argumentDefinition = fieldInfo!.arguments.find((definition) => definition.name === arg.name);
						if (argumentDefinition === undefined) {
							throw Error(
								`argument with name ${arg.name} doesn't exist on source field: ${fieldInfo!.fieldName}@${
									fieldInfo!.typeName
								}`
							);
						}
						return {
							kind: Kind.INPUT_VALUE_DEFINITION,
							name: {
								kind: Kind.NAME,
								value: arg.name,
							},
							type: parseType(argumentDefinition.type),
						};
					});
				const field: FieldDefinitionNode = {
					kind: Kind.FIELD_DEFINITION,
					name: {
						kind: Kind.NAME,
						value: link.targetFieldName,
					},
					type: parseType(fieldInfo.fieldType),
					arguments: args.length !== 0 ? args : undefined,
				};
				return {
					...node,
					fields: [...(node.fields || []), field],
				};
			},
		})
	);
	if (fieldInfo !== undefined) {
		const fieldConfiguration = config.application.EngineConfiguration.Fields.find(
			(field) => field.typeName === fieldInfo!.typeName && field.fieldName === fieldInfo!.fieldName
		);
		if (fieldConfiguration === undefined) {
			throw new Error(`fieldConfiguration not found for type: ${fieldInfo.typeName}, field: ${fieldInfo.fieldName}`);
		}
		const copy: FieldConfiguration = Object.assign({}, fieldConfiguration, {
			fieldName: link.targetFieldName,
			typeName: link.targetType,
			argumentsConfiguration: [],
		});
		link.argumentSources.forEach((arg) => {
			copy.argumentsConfiguration.push({
				name: arg.name,
				sourceType: arg.type === 'objectField' ? ArgumentSource.OBJECT_FIELD : ArgumentSource.FIELD_ARGUMENT,
				sourcePath: arg.path,
				renderConfiguration: ArgumentRenderConfiguration.RENDER_ARGUMENT_AS_GRAPHQL_VALUE,
			});
		});
		config.application.EngineConfiguration.Fields.push(copy);

		const dataSource = config.application.EngineConfiguration.DataSources.find(
			(ds) =>
				ds.RootNodes.find(
					(node) => node.typeName === queryTypeName && node.fieldNames.find((field) => field === link.sourceField)
				) !== undefined
		);
		if (dataSource === undefined) {
			throw new Error(`dataSource not found for type: ${fieldInfo.typeName}, field: ${fieldInfo.fieldName}`);
		}
		const ds: DataSource = Object.assign({}, dataSource);
		ds.RootNodes = ds.RootNodes.map((node) => {
			if (node.typeName === queryTypeName) {
				return {
					typeName: link.targetType,
					fieldNames: [...node.fieldNames.filter((field) => field !== link.sourceField), link.targetFieldName],
				};
			} else {
				return node;
			}
		});
		ds.ChildNodes = ds.ChildNodes.map((node) => {
			if (node.typeName === queryTypeName) {
				return {
					typeName: link.targetType,
					fieldNames: [...node.fieldNames.filter((field) => field !== link.sourceField), link.targetFieldName],
				};
			} else {
				return node;
			}
		});
		const withUpdatedArguments = updateArguments(ds, fieldInfo, link);
		config.application.EngineConfiguration.DataSources.push(withUpdatedArguments);
	}
	return config;
};

const updateArguments = (dataSource: DataSource, fieldInfo: FieldInfo, link: LinkDefinition): DataSource => {
	let json: string = JSON.stringify(dataSource);
	fieldInfo.arguments.forEach((arg) => {
		const source = link.argumentSources.find((source) => source.name === arg.name);
		if (source === undefined) {
			return;
		}
		const search = `.arguments.${arg.name}`;
		const path = source.path.join('.');
		const replace = source.type === 'objectField' ? `.object.${path}` : `.arguments.${path}`;
		json = json.replace(search, replace);
	});
	return JSON.parse(json);
};

const resolveApplications = async (
	roles: string[],
	applications: Application[],
	cors: CorsConfiguration,
	s3: S3Provider
): Promise<ResolvedApplication[]> => {
	const out: ResolvedApplication[] = [];
	for (let i = 0; i < applications.length; i++) {
		const resolvedApis = await Promise.all(applications[i].apis);
		const merged = mergeApis(roles, ...resolvedApis);
		out.push({
			Name: applications[i].name,
			EngineConfiguration: merged,
			EnableSingleFlight: true,
			Operations: [],
			CorsConfiguration: cors,
			S3UploadProvider: s3,
		});
	}
	return out;
};

// configureWunderGraphApplication generates the file "generated/wundergraph.config.json" and runs the configured code generators
// the wundergraph.config.json file will be picked up by "wunderctl up" to configure your development environment
export const configureWunderGraphApplication = (config: WunderGraphConfigApplicationConfig) => {
	if (WG_DATA_SOURCE_POLLING_MODE) {
		// if the DataSourcePolling environment variable is set to 'true',
		// we don't run the regular config build process which would generate the whole config
		// instead, we only resolve all Promises of the API Introspection
		// This will keep polling the (configured) DataSources until `wunderctl up` stops the polling process
		// If a change is detected in the DataSource, the cache is updated,
		// which will trigger a re-run of the config build process
		Promise.all(config.application.apis).catch();
		return;
	}

	resolveConfig(config)
		.then(async (resolved) => {
			const app = resolved.application;

			const schemaFileName = `wundergraph.${app.Name}.schema.graphql`;

			const schemaContent = '# Code generated by "wunderctl"; DO NOT EDIT.\n\n' + app.EngineConfiguration.Schema;

			fs.writeFileSync(path.join('generated', schemaFileName), schemaContent, { encoding: 'utf8' });
			done();
			Logger.info(`${schemaFileName} updated`);

			/**
			 * Webhooks
			 */

			const webhooksDir = path.join('webhooks');
			if (fs.existsSync(webhooksDir)) {
				const webhooks = await getWebhooks(path.join('webhooks'));
				resolved.webhooks = webhooks.map((webhook) => {
					let webhookConfig: WebhookConfiguration = {
						name: webhook.name,
						filePath: webhook.filePath,
						verifier: undefined,
					};

					if (config.server?.webhooks) {
						for (const [key, value] of Object.entries(config.server.webhooks)) {
							if (key === webhook.name) {
								webhookConfig.verifier = {
									kind: value.verifier.kind,
									signatureHeader: value.verifier.signatureHeader,
									signatureHeaderPrefix: value.verifier.signatureHeaderPrefix,
									secret: {
										kind: ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE,
										staticVariableContent: '',
										placeholderVariableName: '',
										environmentVariableDefaultValue: value.verifier.secret.defaultValue || '',
										environmentVariableName: value.verifier.secret.name,
									},
								};
								break;
							}
						}
					}
					return webhookConfig;
				});
			}

			const operationsContent = loadOperations(schemaFileName);
			const operations = parseOperations(app.EngineConfiguration.Schema, operationsContent.toString(), {
				keepFromClaimVariables: false,
				interpolateVariableDefinitionAsJSON: resolved.interpolateVariableDefinitionAsJSON,
			});
			app.Operations = operations.operations;
			if (app.Operations && config.operations !== undefined) {
				app.Operations = app.Operations.map((op) => {
					const cfg = config.operations!;
					const base = Object.assign({}, cfg.defaultConfig);
					const customize =
						cfg.custom !== undefined && cfg.custom[op.Name] !== undefined ? cfg.custom[op.Name] : undefined;
					switch (op.OperationType) {
						case OperationType.MUTATION:
							let mutationConfig = cfg.mutations(base);
							if (customize as CustomizeMutation) {
								mutationConfig = customize(mutationConfig);
							}
							return {
								...op,
								AuthenticationConfig: {
									...op.AuthenticationConfig,
									required: op.AuthenticationConfig.required || mutationConfig.authentication.required,
								},
							};
						case OperationType.QUERY:
							let queryConfig = cfg.queries(base);
							if (customize as CustomizeQuery) {
								queryConfig = customize(queryConfig);
							}
							return {
								...op,
								CacheConfig: {
									enable: queryConfig.caching.enable,
									maxAge: queryConfig.caching.maxAge,
									public: queryConfig.caching.public,
									staleWhileRevalidate: queryConfig.caching.staleWhileRevalidate,
								},
								AuthenticationConfig: {
									...op.AuthenticationConfig,
									required: op.AuthenticationConfig.required || queryConfig.authentication.required,
								},
								LiveQuery: {
									enable: queryConfig.liveQuery.enable,
									pollingIntervalSeconds: queryConfig.liveQuery.pollingIntervalSeconds,
								},
							};
						case OperationType.SUBSCRIPTION:
							let subscriptionConfig = cfg.subscriptions(base);
							if (customize as CustomizeSubscription) {
								subscriptionConfig = customize(subscriptionConfig);
							}
							return {
								...op,
								AuthenticationConfig: {
									...op.AuthenticationConfig,
									required: op.AuthenticationConfig.required || subscriptionConfig.authentication.required,
								},
							};
						default:
							return op;
					}
				});
			}

			if (config.server?.hooks?.global?.httpTransport?.onOriginRequest) {
				const enableForAllOperations =
					config.server?.hooks?.global?.httpTransport?.onOriginRequest.enableForAllOperations;
				if (enableForAllOperations === true) {
					app.Operations = app.Operations.map((op) => ({
						...op,
						HooksConfiguration: { ...op.HooksConfiguration, httpTransportOnRequest: true },
					}));
				} else {
					const enableForOperations = config.server?.hooks?.global?.httpTransport?.onOriginRequest.enableForOperations;
					if (enableForOperations) {
						app.Operations = app.Operations.map((op) => {
							if (enableForOperations.includes(op.Name)) {
								return { ...op, HooksConfiguration: { ...op.HooksConfiguration, httpTransportOnRequest: true } };
							}
							return op;
						});
					}
				}
			}

			if (config.server?.hooks?.global?.httpTransport?.onOriginResponse) {
				const enableForAllOperations =
					config.server?.hooks?.global?.httpTransport?.onOriginResponse.enableForAllOperations;
				if (enableForAllOperations === true) {
					app.Operations = app.Operations.map((op) => ({
						...op,
						HooksConfiguration: { ...op.HooksConfiguration, httpTransportOnResponse: true },
					}));
				} else {
					const enableForOperations = config.server?.hooks?.global?.httpTransport?.onOriginResponse.enableForOperations;
					if (enableForOperations) {
						app.Operations = app.Operations.map((op) => {
							if (enableForOperations.includes(op.Name)) {
								return {
									...op,
									HooksConfiguration: { ...op.HooksConfiguration, httpTransportOnResponse: true },
								};
							}
							return op;
						});
					}
				}
			}

			if (config.server?.hooks?.global?.wsTransport?.onConnectionInit) {
				const enableForDataSources = config.server?.hooks?.global?.wsTransport?.onConnectionInit.enableForDataSources;
				app.EngineConfiguration.DataSources = app.EngineConfiguration.DataSources.map((ds) => {
					if (ds.Id !== undefined && ds.Id !== '' && ds.Kind === DataSourceKind.GRAPHQL) {
						if (enableForDataSources.includes(ds.Id)) {
							let Custom: GraphQLApiCustom = ds.Custom as GraphQLApiCustom;

							Custom = {
								...Custom,
								HooksConfiguration: { onWSTransportConnectionInit: true },
							};

							return {
								...ds,
								Custom,
							};
						}
					}
					return ds;
				});
			}

			for (const operationName in config.server?.hooks?.queries) {
				const hooks = config.server?.hooks!.queries[operationName];
				const op = app.Operations.find((op) => op.OperationType === OperationType.QUERY && op.Name === operationName);
				if (op !== undefined && hooks !== undefined) {
					op.HooksConfiguration.preResolve = hooks.preResolve !== undefined;
					op.HooksConfiguration.mockResolve = {
						enable: hooks.mockResolve !== undefined,
						subscriptionPollingIntervalMillis: 0,
					};
					op.HooksConfiguration.postResolve = hooks.postResolve !== undefined;
					op.HooksConfiguration.mutatingPreResolve = hooks.mutatingPreResolve !== undefined;
					op.HooksConfiguration.mutatingPostResolve = hooks.mutatingPostResolve !== undefined;
					op.HooksConfiguration.customResolve = hooks.customResolve !== undefined;
				}
			}

			for (const operationName in config.server?.hooks?.mutations) {
				const hooks = config.server?.hooks!.mutations[operationName];
				const op = app.Operations.find(
					(op) => op.OperationType === OperationType.MUTATION && op.Name === operationName
				);
				if (op !== undefined && hooks !== undefined) {
					op.HooksConfiguration.preResolve = hooks.preResolve !== undefined;
					op.HooksConfiguration.mockResolve = {
						enable: hooks.mockResolve !== undefined,
						subscriptionPollingIntervalMillis: 0,
					};
					op.HooksConfiguration.postResolve = hooks.postResolve !== undefined;
					op.HooksConfiguration.mutatingPreResolve = hooks.mutatingPreResolve !== undefined;
					op.HooksConfiguration.mutatingPostResolve = hooks.mutatingPostResolve !== undefined;
					op.HooksConfiguration.customResolve = hooks.customResolve !== undefined;
				}
			}

			for (const operationName in config.server?.hooks?.subscriptions) {
				const hooks = config.server?.hooks!.subscriptions[operationName];
				const op = app.Operations.find(
					(op) => op.OperationType === OperationType.SUBSCRIPTION && op.Name === operationName
				);
				if (op !== undefined && hooks !== undefined) {
					op.HooksConfiguration.preResolve = hooks.preResolve !== undefined;
					op.HooksConfiguration.postResolve = hooks.postResolve !== undefined;
					op.HooksConfiguration.mutatingPreResolve = hooks.mutatingPreResolve !== undefined;
					op.HooksConfiguration.mutatingPostResolve = hooks.mutatingPostResolve !== undefined;
				}
			}

			if (config.codeGenerators) {
				for (let i = 0; i < config.codeGenerators.length; i++) {
					const gen = config.codeGenerators[i];
					await GenerateCode({
						wunderGraphConfig: resolved,
						templates: gen.templates,
						basePath: gen.path || 'generated',
					});
				}
				done();
				Logger.info(`Code generation completed.`);
			}

			const configJsonPath = path.join('generated', 'wundergraph.config.json');
			const configJSON = ResolvedWunderGraphConfigToJSON(resolved);
			// config json exists
			if (fs.existsSync(configJsonPath)) {
				const existing = fs.readFileSync(configJsonPath, 'utf8');
				if (configJSON !== existing) {
					fs.writeFileSync(configJsonPath, configJSON, { encoding: 'utf8' });
					Logger.info(`wundergraph.config.json updated`);
				}
			} else {
				fs.writeFileSync(configJsonPath, configJSON, { encoding: 'utf8' });
				Logger.info(`wundergraph.config.json created`);
			}

			done();

			let publicNodeUrl = trimTrailingSlash(resolveConfigurationVariable(resolved.nodeOptions.publicNodeUrl));

			const dotGraphQLNested =
				config.dotGraphQLConfig?.hasDotWunderGraphDirectory !== undefined
					? config.dotGraphQLConfig?.hasDotWunderGraphDirectory === true
					: true;

			const dotGraphQLConfig = generateDotGraphQLConfig(config, {
				baseURL: publicNodeUrl,
				nested: dotGraphQLNested,
			});

			const dotGraphQLConfigPath = path.join(dotGraphQLNested ? '..' + path.sep : '', '.graphqlconfig');
			let shouldUpdateDotGraphQLConfig = true;
			const dotGraphQLContent = JSON.stringify(dotGraphQLConfig, null, '  ');
			if (fs.existsSync(dotGraphQLConfigPath)) {
				const existingDotGraphQLContent = fs.readFileSync(dotGraphQLConfigPath, { encoding: 'utf8' });
				if (dotGraphQLContent === existingDotGraphQLContent) {
					shouldUpdateDotGraphQLConfig = false;
				}
			}

			if (shouldUpdateDotGraphQLConfig) {
				fs.writeFileSync(dotGraphQLConfigPath, dotGraphQLContent, { encoding: 'utf8' });
				Logger.info(`.graphqlconfig updated`);
			}

			done();

			const postman = PostmanBuilder(app.Operations, {
				applicationPath: resolved.deployment.path,
				baseURL: publicNodeUrl,
			});
			fs.writeFileSync(
				path.join('generated', 'wundergraph.postman.json'),
				JSON.stringify(postman.toJSON(), null, '  '),
				{
					encoding: 'utf8',
				}
			);
			Logger.info(`wundergraph.postman.json updated`);

			done();
		})
		.catch((e: any) => {
			Logger.fatal(`Couldn't configure your WunderNode: ${e}`);
			process.exit(1);
		});
};

const total = 5;
let doneCount = 0;

const done = () => {
	doneCount++;
	Logger.info(`${doneCount}/${total} done`);
	if (doneCount === 3) {
		setTimeout(() => {
			Logger.info(`code generation completed`);
			process.exit(0);
		}, 10);
	}
};

const ResolvedWunderGraphConfigToJSON = (config: ResolvedWunderGraphConfig): string => {
	const operations: Operation[] = config.application.Operations.map((op) => ({
		content: removeHookVariables(op.Content),
		name: op.Name,
		responseSchema: JSON.stringify(op.ResponseSchema),
		variablesSchema: JSON.stringify(op.VariablesSchema),
		interpolationVariablesSchema: JSON.stringify(op.InterpolationVariablesSchema),
		operationType: op.OperationType,
		cacheConfig: op.CacheConfig || {
			enable: false,
			maxAge: 0,
			public: false,
			staleWhileRevalidate: 0,
		},
		authenticationConfig: {
			authRequired: op.AuthenticationConfig.required,
		},
		authorizationConfig: op.AuthorizationConfig,
		liveQueryConfig: op.LiveQuery,
		hooksConfiguration: op.HooksConfiguration,
		variablesConfiguration: op.VariablesConfiguration,
		internal: op.Internal,
		postResolveTransformations:
			op.PostResolveTransformations?.map((t) => {
				switch (t.kind) {
					case 'get':
						return {
							kind: PostResolveTransformationKind.GET_POST_RESOLVE_TRANSFORMATION,
							depth: t.depth,
							get: t.get,
						};
				}
			}) || [],
	}));
	const dataSources: DataSourceConfiguration[] = config.application.EngineConfiguration.DataSources.map(mapDataSource);
	const fields: FieldConfiguration[] = config.application.EngineConfiguration.Fields;
	const types: TypeConfiguration[] = config.application.EngineConfiguration.Types;

	const out: WunderGraphConfiguration = {
		apiName: config.deployment.api.name,
		apiId: config.deployment.api.id,
		deploymentName: config.deployment.name,
		environmentIds: [config.deployment.environment.id],
		api: {
			enableGraphqlEndpoint: false,
			operations: operations,
			engineConfiguration: {
				defaultFlushInterval: config.application.EngineConfiguration.DefaultFlushInterval,
				graphqlSchema: config.application.EngineConfiguration.Schema,
				datasourceConfigurations: dataSources,
				fieldConfigurations: fields,
				typeConfigurations: types,
			},
			s3UploadConfiguration: config.application.S3UploadProvider.map((provider) => {
				return {
					name: provider.name,
					accessKeyID: mapInputVariable(provider.accessKeyID),
					bucketLocation: mapInputVariable(provider.bucketLocation),
					bucketName: mapInputVariable(provider.bucketName),
					endpoint: mapInputVariable(provider.endpoint),
					secretAccessKey: mapInputVariable(provider.secretAccessKey),
					useSSL: provider.useSSL,
				};
			}),
			corsConfiguration: config.application.CorsConfiguration,
			authenticationConfig: {
				cookieBased: {
					providers: config.authentication.cookieBased,
					authorizedRedirectUris: config.authentication.authorizedRedirectUris,
					authorizedRedirectUriRegexes: config.authentication.authorizedRedirectUriRegexes,
					blockKey: config.authentication.cookieSecurity.secureCookieBlockKey,
					hashKey: config.authentication.cookieSecurity.secureCookieHashKey,
					csrfSecret: config.authentication.cookieSecurity.csrfTokenSecret,
				},
				hooks: config.authentication.hooks,
				jwksBased: {
					providers: config.authentication.tokenBased.map((provider) => ({
						jwksJson: mapInputVariable(provider.jwksJSON || ''),
						jwksUrl: mapInputVariable(provider.jwksURL || ''),
						userInfoEndpoint: mapInputVariable(provider.userInfoEndpoint || ''),
						userInfoCacheTtlSeconds: provider.userInfoCacheTtlSeconds || 60 * 60,
					})),
				},
			},
			allowedHostNames: config.security.allowedHostNames,
			webhooks: config.webhooks,
			nodeOptions: config.nodeOptions,
			serverOptions: config.serverOptions,
		},
		dangerouslyEnableGraphQLEndpoint: config.enableGraphQLEndpoint,
	};

	return JSON.stringify(out, null, '  ');
};

const mapDataSource = (source: DataSource): DataSourceConfiguration => {
	const out: DataSourceConfiguration = {
		id: source.Id || '',
		kind: source.Kind,
		customGraphql: undefined,
		rootNodes: source.RootNodes,
		childNodes: source.ChildNodes,
		customRest: undefined,
		customStatic: undefined,
		overrideFieldPathFromAlias: source.Kind === DataSourceKind.GRAPHQL,
		customDatabase: undefined,
		directives: source.Directives,
		requestTimeoutSeconds: source.RequestTimeoutSeconds,
	};
	switch (source.Kind) {
		case DataSourceKind.REST:
			const rest = source.Custom as RESTApiCustom;
			out.customRest = {
				fetch: rest.Fetch,
				subscription: {
					enabled: rest.Subscription.Enabled,
					pollingIntervalMillis: rest.Subscription.PollingIntervalMillis || 500,
					skipPublishSameResponse: rest.Subscription.SkipPublishSameResponse || false,
				},
				defaultTypeName: rest.DefaultTypeName,
				statusCodeTypeMappings: rest.StatusCodeTypeMappings,
			};
			break;
		case DataSourceKind.STATIC:
			const customStatic = source.Custom as StaticApiCustom;
			out.customStatic = {
				data: customStatic.data,
			};
			break;
		case DataSourceKind.GRAPHQL:
			const graphql = source.Custom as GraphQLApiCustom;
			out.customGraphql = {
				fetch: graphql.Fetch,
				federation: {
					enabled: graphql.Federation.Enabled,
					serviceSdl: graphql.Federation.ServiceSDL,
				},
				subscription: {
					enabled: graphql.Subscription.Enabled,
					url: graphql.Subscription.URL,
					useSSE: graphql.Subscription.UseSSE,
				},
				upstreamSchema: graphql.UpstreamSchema,
				hooksConfiguration: graphql.HooksConfiguration,
			};
			break;
		case DataSourceKind.POSTGRESQL:
		case DataSourceKind.MYSQL:
		case DataSourceKind.MONGODB:
		case DataSourceKind.SQLSERVER:
		case DataSourceKind.SQLITE:
			const database = source.Custom as DatabaseApiCustom;
			out.customDatabase = {
				databaseURL: database.databaseURL,
				prismaSchema: database.prisma_schema,
				graphqlSchema: database.graphql_schema,
				closeTimeoutSeconds: 30,
				jsonTypeFields: database.jsonTypeFields,
				jsonInputVariables: database.jsonInputVariables,
			};
	}

	return out;
};

export interface PublishConfiguration {
	organization: string;
	name: string;
	apis: Promise<Api<any>>[];
	isPublic: boolean;
	repositoryUrl?: string;
	shortDescription: string;
	markdownDescriptionFile?: string;
	keywords: string[];
}

export interface PublishResult {
	organization: string;
	name: string;
	shortDescription: string;
	markdownDescription: string;
	isPublic: boolean;
	keywords: string[];
	definition: Api<any>;
	repositoryUrl: string;
	sdkVersion: string;
	placeholders: PublishConfigurationPlaceholder[];
}

interface PublishConfigurationPlaceholder {
	name: string;
	optional: boolean;
}

export const configurePublishWunderGraphAPI = (configuration: PublishConfiguration) => {
	const outFile = path.join('generated', `${configuration.organization}.${configuration.name}.api.json`);
	_configurePublishWunderGraphAPI(configuration, outFile)
		.then(() => {
			Logger.info(
				colors.blue(`${configuration.organization}/${configuration.name} API configuration written to ${outFile}`)
			);
			if (process.env.WUNDERGRAPH_PUBLISH_API === 'true') {
				try {
					const result = wunderctlExec({
						cmd: ['publish', configuration.organization + '/' + configuration.name],
						timeout: 1000 * 5,
					});
					if (result?.failed) {
						Logger.error(colors.red(`Failed to publish ${configuration.organization}/${configuration.name}`));
					}
				} catch (e) {
					Logger.error(colors.red(`Failed to publish ${configuration.organization}/${configuration.name}`));
				}
			} else {
				Logger.info(colors.blue(`You can now publish the API using the following command:`));
				Logger.info(colors.green(`wunderctl publish ${configuration.organization}/${configuration.name}`));
			}
		})
		.catch((err) => {
			Logger.error(`Failed to create publish configuration for ${configuration.organization}/${configuration.name}`);
			Logger.error(err);
		});
};

const _configurePublishWunderGraphAPI = async (configuration: PublishConfiguration, outFile: string) => {
	const resolvedApis = await Promise.all(configuration.apis);
	const merged = mergeApis([], ...resolvedApis);
	const markdownDescription = configuration.markdownDescriptionFile
		? fs.readFileSync(configuration.markdownDescriptionFile, 'utf-8')
		: '';
	const out: PublishResult = {
		organization: configuration.organization,
		name: configuration.name,
		keywords: configuration.keywords,
		shortDescription: configuration.shortDescription || '',
		markdownDescription,
		isPublic: configuration.isPublic,
		repositoryUrl: configuration.repositoryUrl || '',
		sdkVersion: SDK_VERSION,
		definition: merged,
		placeholders: [],
	};
	merged.Schema = removeBaseSchema(merged.Schema);
	merged.Schema = stripIgnoredCharacters(merged.Schema);
	merged.DataSources = merged.DataSources.filter(
		(ds) =>
			!(
				ds.Kind === DataSourceKind.STATIC &&
				ds.RootNodes.length === 1 &&
				ds.RootNodes[0].fieldNames.length === 1 &&
				ds.RootNodes[0].fieldNames[0] === '_join'
			)
	);
	merged.Fields = merged.Fields.filter((field) => !(field.fieldName === '_join'));
	const printed = JSON.stringify(out, (key, value) => {
		if (
			value !== undefined &&
			(value as ConfigurationVariable).kind === ConfigurationVariableKind.PLACEHOLDER_CONFIGURATION_VARIABLE &&
			(value as ConfigurationVariable).placeholderVariableName !== undefined
		) {
			out.placeholders.push({
				name: (value as ConfigurationVariable).placeholderVariableName,
				optional: false,
			});
		}
		if (
			value !== undefined &&
			(value as ConfigurationVariable).kind === ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE &&
			(value as ConfigurationVariable).environmentVariableName !== undefined
		) {
			out.placeholders.push({
				name: (value as ConfigurationVariable).environmentVariableName,
				optional: true,
			});
		}
		return value;
	});
	fs.writeFileSync(outFile, printed);
};

export const parsePublishResultWithVariables = (raw: string, variables: { [key: string]: string }): PublishResult => {
	return JSON.parse(raw, (key, value) => {
		if (
			value !== undefined &&
			(value as ConfigurationVariable).kind === ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE &&
			(value as ConfigurationVariable).environmentVariableName !== undefined
		) {
			if (variables[(value as ConfigurationVariable).environmentVariableName] !== undefined) {
				return mapInputVariable(variables[(value as ConfigurationVariable).environmentVariableName]);
			}
		}
		if (
			value !== undefined &&
			(value as ConfigurationVariable).kind === ConfigurationVariableKind.PLACEHOLDER_CONFIGURATION_VARIABLE &&
			(value as ConfigurationVariable).placeholderVariableName !== undefined
		) {
			if (variables[(value as ConfigurationVariable).placeholderVariableName] !== undefined) {
				return mapInputVariable(variables[(value as ConfigurationVariable).placeholderVariableName]);
			}
		}
		return value;
	});
};

export const resolveIntegration = (
	rawApi: string,
	variables: { [key: string]: string },
	apiNamespace?: string
): Promise<Api<any>> => {
	let published: PublishResult = parsePublishResultWithVariables(rawApi, variables);
	if (apiNamespace) {
		return Promise.resolve(applyNamespaceToApi(published.definition, apiNamespace, []));
	}
	return Promise.resolve(published.definition);
};

export const customGqlServerMountPath = (name: string): string => {
	return `/gqls/${name}/graphql`;
};

const trimTrailingSlash = (url: string): string => {
	return url.endsWith('/') ? url.slice(0, -1) : url;
};
