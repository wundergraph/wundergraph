import fs from 'fs';
import path from 'path';
import process from 'node:process';
import _ from 'lodash';
import {
	buildSchema,
	FieldDefinitionNode,
	InputValueDefinitionNode,
	Kind,
	parse,
	parseType,
	print,
	visit,
} from 'graphql';
import { ZodType } from 'zod';
import {
	Api,
	DatabaseApiCustom,
	DataSource,
	GraphQLApiCustom,
	introspectGraphqlServer,
	RESTApiCustom,
	StaticApiCustom,
	WG_DATA_SOURCE_POLLING_MODE,
} from '../definition';
import { mergeApis } from '../definition/merge';
import {
	GraphQLOperation,
	loadOperations,
	LoadOperationsOutput,
	ParsedOperations,
	parseGraphQLOperations,
	removeHookVariables,
} from '../graphql/operations';
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
	OperationExecutionEngine,
	OperationType,
	PostResolveTransformationKind,
	S3UploadProfile as _S3UploadProfile,
	TypeConfiguration,
	WebhookConfiguration,
	WunderGraphConfiguration,
} from '@wundergraph/protobuf';
import { SDK_VERSION } from '../version';
import { AuthenticationProvider } from './authentication';
import { FieldInfo, LinkConfiguration, LinkDefinition, queryTypeFields } from '../linkbuilder';
import { PostmanBuilder } from '../postman/builder';
import { CustomizeMutation, CustomizeQuery, CustomizeSubscription, OperationsConfiguration } from './operations';
import { HooksConfiguration, ResolvedServerOptions, WunderGraphHooksAndServerConfig } from '../server/types';
import { getWebhooks } from '../webhooks';
import { NodeOptions, ResolvedNodeOptions, resolveNodeOptions } from './options';
import { EnvironmentVariable, InputVariable, mapInputVariable, resolveConfigurationVariable } from './variables';
import logger, { Logger } from '../logger';
import { resolveServerOptions, serverOptionsWithDefaults } from '../server/util';
import { loadNodeJsOperationDefaultModule, NodeJSOperation } from '../operations/operations';
import zodToJsonSchema from 'zod-to-json-schema';

export interface WunderGraphCorsConfiguration {
	allowedOrigins: InputVariable[];
	allowedMethods?: string[];
	allowedHeaders?: string[];
	exposedHeaders?: string[];
	maxAge?: number;
	allowCredentials?: boolean;
}

export interface WunderGraphConfigApplicationConfig {
	apis: Promise<Api<any>>[];
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
	security?: SecurityConfig;

	/** @deprecated: Not used anymore */
	dotGraphQLConfig?: any;
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
	EnableSingleFlight: boolean;
	EngineConfiguration: Api<any>;
	Operations: GraphQLOperation[];
	InvalidOperationNames: string[];
	CorsConfiguration: CorsConfiguration;
	S3UploadProvider: ResolvedS3UploadConfiguration[];
}

interface ResolvedDeployment {
	api: {
		id: string;
	};
	environment: {
		id: string;
		baseUrl: string;
	};
}

export interface S3UploadProfile {
	/** JSON schema for metadata */
	meta?: ZodType | object;
	/**
	 * Maximum file size, in bytes
	 *
	 * @default 10 * 1024 * 1024 (10MB)
	 */
	maxAllowedUploadSizeBytes?: number;
	/**
	 * Maximum number of files
	 *
	 * @default unlimited
	 */
	maxAllowedFiles?: number;
	/**
	 * List of mime-types allowed to be uploaded, case insensitive
	 *
	 * @default Any type
	 */
	allowedMimeTypes?: string[];
	/**
	 * Allowed file extensions, case insensitive
	 *
	 * @default Any extension
	 */
	allowedFileExtensions?: string[];
}

export type S3UploadProfiles = Record<string, S3UploadProfile>;

interface S3UploadConfiguration {
	name: string;
	endpoint: InputVariable;
	accessKeyID: InputVariable;
	secretAccessKey: InputVariable;
	bucketName: InputVariable;
	bucketLocation: InputVariable;
	useSSL: boolean;
	uploadProfiles?: S3UploadProfiles;
}

export interface ResolvedS3UploadProfile extends Omit<Required<S3UploadProfile>, 'meta'> {
	meta: ZodType | object | null;
	preUploadHook: boolean;
	postUploadHook: boolean;
}

interface ResolvedS3UploadConfiguration extends Omit<S3UploadConfiguration, 'uploadProfiles'> {
	uploadProfiles: Record<string, ResolvedS3UploadProfile>;
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

export interface CodeGenerationConfig {
	config: ResolvedWunderGraphConfig;
	outPath: string;
	wunderGraphDir: string;
}

const resolveConfig = async (config: WunderGraphConfigApplicationConfig): Promise<ResolvedWunderGraphConfig> => {
	const api = {
		id: '',
	};

	const resolvedNodeOptions = resolveNodeOptions(config.options);
	const serverOptions = serverOptionsWithDefaults(config.server?.options);
	const resolvedServerOptions = resolveServerOptions(serverOptions);

	const publicNodeUrl = trimTrailingSlash(resolveConfigurationVariable(resolvedNodeOptions.publicNodeUrl));

	const environment = {
		id: '',
		baseUrl: publicNodeUrl,
	};

	const deploymentConfiguration: ResolvedDeployment = {
		api,
		environment,
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
		return introspectGraphqlServer({
			skipRenameRootFields: gs.skipRenameRootFields,
			url: '',
			baseUrl: serverOptions.serverUrl,
			path: gs.routeUrl,
			apiNamespace: gs.apiNamespace,
			schema: gs.schema,
		});
	});

	if (graphqlApis) {
		config.apis.push(...graphqlApis);
	}

	const roles = config.authorization?.roles || ['admin', 'user'];

	const resolved = await resolveApplication(roles, config.apis, cors, config.s3UploadProvider || []);

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

const resolveUploadConfiguration = (
	configuration: S3UploadConfiguration,
	hooks?: HooksConfiguration
): ResolvedS3UploadConfiguration => {
	let uploadProfiles: Record<string, ResolvedS3UploadProfile> = {};
	if (configuration?.uploadProfiles) {
		const configurationHooks = hooks?.uploads ? hooks.uploads[configuration.name] : undefined;
		for (const key in configuration.uploadProfiles) {
			const profile = configuration.uploadProfiles[key];
			const profileHooks = configurationHooks ? configurationHooks[key] : undefined;

			uploadProfiles[key] = {
				maxAllowedUploadSizeBytes: profile.maxAllowedUploadSizeBytes ?? -1,
				maxAllowedFiles: profile.maxAllowedFiles ?? -1,
				allowedMimeTypes: profile.allowedMimeTypes ?? [],
				allowedFileExtensions: profile.allowedFileExtensions ?? [],
				meta: profile.meta ?? null,
				preUploadHook: profileHooks?.preUpload !== undefined,
				postUploadHook: profileHooks?.postUpload !== undefined,
			};
		}
	}
	return {
		...configuration,
		uploadProfiles,
	};
};

const resolveApplication = async (
	roles: string[],
	apis: Promise<Api<any>>[],
	cors: CorsConfiguration,
	s3?: S3Provider,
	hooks?: HooksConfiguration
): Promise<ResolvedApplication> => {
	const resolvedApis = await Promise.all(apis);
	const merged = mergeApis(roles, ...resolvedApis);
	const s3Configurations = s3?.map((config) => resolveUploadConfiguration(config, hooks)) || [];
	return {
		EngineConfiguration: merged,
		EnableSingleFlight: true,
		Operations: [],
		InvalidOperationNames: [],
		CorsConfiguration: cors,
		S3UploadProvider: s3Configurations,
	};
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
		Promise.all(config.apis).catch();
		return;
	}

	resolveConfig(config)
		.then(async (resolved) => {
			const app = resolved.application;

			const schemaFileName = `wundergraph.schema.graphql`;

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

			const loadedOperations = loadOperations(schemaFileName);
			const operations = await resolveOperationsConfigurations(
				resolved,
				loadedOperations,
				app.EngineConfiguration.CustomJsonScalars || []
			);
			app.Operations = operations.operations;
			app.InvalidOperationNames = loadedOperations.invalid || [];
			if (app.Operations && config.operations !== undefined) {
				const ops = app.Operations.map(async (op) => {
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
							return loadAndApplyNodeJsOperationOverrides({
								...op,
								AuthenticationConfig: {
									...op.AuthenticationConfig,
									required: op.AuthenticationConfig.required || mutationConfig.authentication.required,
								},
							});
						case OperationType.QUERY:
							let queryConfig = cfg.queries(base);
							if (customize as CustomizeQuery) {
								queryConfig = customize(queryConfig);
							}
							return loadAndApplyNodeJsOperationOverrides({
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
								LiveQuery: queryConfig.liveQuery,
							});
						case OperationType.SUBSCRIPTION:
							let subscriptionConfig = cfg.subscriptions(base);
							if (customize as CustomizeSubscription) {
								subscriptionConfig = customize(subscriptionConfig);
							}
							return loadAndApplyNodeJsOperationOverrides({
								...op,
								AuthenticationConfig: {
									...op.AuthenticationConfig,
									required: op.AuthenticationConfig.required || subscriptionConfig.authentication.required,
								},
							});
						default:
							return op;
					}
				});

				app.Operations = await Promise.all(ops);
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

			const postman = PostmanBuilder(app.Operations, {
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
			//throw e;
			Logger.fatal(`Couldn't configure your WunderNode: ${e.stack}`);
			process.exit(1);
		});
};

const total = 4;
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
		path: op.PathName,
		responseSchema: JSON.stringify(op.ResponseSchema),
		variablesSchema: JSON.stringify(op.VariablesSchema),
		interpolationVariablesSchema: JSON.stringify(op.InterpolationVariablesSchema),
		operationType: op.OperationType,
		engine: op.ExecutionEngine,
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
		apiId: config.deployment.api.id,
		environmentIds: [config.deployment.environment.id],
		api: {
			enableGraphqlEndpoint: false,
			operations: operations,
			invalidOperationNames: config.application.InvalidOperationNames,
			engineConfiguration: {
				defaultFlushInterval: config.application.EngineConfiguration.DefaultFlushInterval,
				graphqlSchema: config.application.EngineConfiguration.Schema,
				datasourceConfigurations: dataSources,
				fieldConfigurations: fields,
				typeConfigurations: types,
			},
			s3UploadConfiguration: config.application.S3UploadProvider.map((provider) => {
				let uploadProfiles: { [key: string]: _S3UploadProfile } = {};
				if (provider.uploadProfiles) {
					for (const key in provider.uploadProfiles) {
						const resolved = provider.uploadProfiles[key];
						let metadataJSONSchema: string;
						try {
							metadataJSONSchema = resolved.meta ? JSON.stringify(resolved.meta) : '';
						} catch (e) {
							throw new Error(`error serializing JSON schema for upload profile ${provider.name}/${key}: ${e}`);
						}
						uploadProfiles[key] = {
							maxAllowedUploadSizeBytes: resolved.maxAllowedUploadSizeBytes,
							maxAllowedFiles: resolved.maxAllowedFiles,
							allowedMimeTypes: resolved.allowedMimeTypes,
							allowedFileExtensions: resolved.allowedFileExtensions,
							metadataJSONSchema: metadataJSONSchema,
							hooks: {
								preUpload: resolved.preUploadHook,
								postUpload: resolved.postUploadHook,
							},
						};
					}
				}
				return {
					name: provider.name,
					accessKeyID: mapInputVariable(provider.accessKeyID),
					bucketLocation: mapInputVariable(provider.bucketLocation),
					bucketName: mapInputVariable(provider.bucketName),
					endpoint: mapInputVariable(provider.endpoint),
					secretAccessKey: mapInputVariable(provider.secretAccessKey),
					useSSL: provider.useSSL,
					uploadProfiles: uploadProfiles,
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
				customScalarTypeFields: graphql.CustomScalarTypeFields,
			};
			break;
		case DataSourceKind.POSTGRESQL:
		case DataSourceKind.MYSQL:
		case DataSourceKind.MONGODB:
		case DataSourceKind.SQLSERVER:
		case DataSourceKind.SQLITE:
		case DataSourceKind.PRISMA:
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

const trimTrailingSlash = (url: string): string => {
	return url.endsWith('/') ? url.slice(0, -1) : url;
};

const resolveOperationsConfigurations = async (
	config: ResolvedWunderGraphConfig,
	loadedOperations: LoadOperationsOutput,
	customJsonScalars: string[]
): Promise<ParsedOperations> => {
	const graphQLOperations = parseGraphQLOperations(config.application.EngineConfiguration.Schema, loadedOperations, {
		keepFromClaimVariables: false,
		interpolateVariableDefinitionAsJSON: config.interpolateVariableDefinitionAsJSON,
		customJsonScalars,
	});
	const nodeJSOperations: GraphQLOperation[] = [];
	if (loadedOperations.typescript_operation_files)
		for (const file of loadedOperations.typescript_operation_files) {
			try {
				const filePath = path.join(process.env.WG_DIR_ABS!, file.module_path);
				const implementation = await loadNodeJsOperationDefaultModule(filePath);
				const operation: GraphQLOperation = {
					Name: file.operation_name,
					PathName: file.api_mount_path,
					Content: '',
					OperationType:
						implementation.type === 'query'
							? OperationType.QUERY
							: implementation.type === 'mutation'
							? OperationType.MUTATION
							: OperationType.SUBSCRIPTION,
					ExecutionEngine: OperationExecutionEngine.ENGINE_NODEJS,
					VariablesSchema: { type: 'object', properties: {} },
					InterpolationVariablesSchema: { type: 'object', properties: {} },
					InternalVariablesSchema: { type: 'object', properties: {} },
					InjectedVariablesSchema: { type: 'object', properties: {} },
					ResponseSchema: { type: 'object', properties: { data: {} } },
					TypeScriptOperationImport: `function_${file.operation_name}`,
					AuthenticationConfig: {
						required: implementation.requireAuthentication || false,
					},
					LiveQuery: {
						enable: true,
						pollingIntervalSeconds: 5,
					},
					AuthorizationConfig: {
						claims: [],
						roleConfig: {
							requireMatchAll: [],
							requireMatchAny: [],
							denyMatchAll: [],
							denyMatchAny: [],
						},
					},
					HooksConfiguration: {
						preResolve: false,
						postResolve: false,
						mutatingPreResolve: false,
						mutatingPostResolve: false,
						mockResolve: {
							enable: false,
							subscriptionPollingIntervalMillis: 0,
						},
						httpTransportOnResponse: false,
						httpTransportOnRequest: false,
						customResolve: false,
					},
					VariablesConfiguration: {
						injectVariables: [],
					},
					Internal: implementation.internal ? implementation.internal : false,
					PostResolveTransformations: undefined,
				};
				nodeJSOperations.push(applyNodeJsOperationOverrides(operation, implementation));
			} catch (e: any) {
				logger.info(`Skipping operation ${file.file_path} due to error: ${e.message}`);
			}
		}
	return {
		operations: [...graphQLOperations.operations, ...nodeJSOperations],
	};
};

const loadAndApplyNodeJsOperationOverrides = async (operation: GraphQLOperation): Promise<GraphQLOperation> => {
	if (operation.ExecutionEngine !== OperationExecutionEngine.ENGINE_NODEJS) {
		return operation;
	}
	const filePath = path.join(process.env.WG_DIR_ABS!, 'generated', 'bundle', 'operations', operation.PathName + '.js');
	const implementation = await loadNodeJsOperationDefaultModule(filePath);
	return applyNodeJsOperationOverrides(operation, implementation);
};

const applyNodeJsOperationOverrides = (
	operation: GraphQLOperation,
	overrides: NodeJSOperation<any, any, any, any, any, any, any, any>
): GraphQLOperation => {
	if (overrides.inputSchema) {
		const schema = zodToJsonSchema(overrides.inputSchema) as any;
		operation.VariablesSchema = schema;
		operation.InternalVariablesSchema = schema;
	}
	if (overrides.liveQuery) {
		operation.LiveQuery = {
			enable: overrides.liveQuery.enable,
			pollingIntervalSeconds: overrides.liveQuery.pollingIntervalSeconds,
		};
	}
	if (overrides.requireAuthentication) {
		operation.AuthenticationConfig = {
			required: overrides.requireAuthentication,
		};
	}
	if (overrides.rbac) {
		operation.AuthorizationConfig = {
			claims: [],
			roleConfig: {
				requireMatchAll: overrides.rbac.requireMatchAll,
				requireMatchAny: overrides.rbac.requireMatchAny,
				denyMatchAll: overrides.rbac.denyMatchAll,
				denyMatchAny: overrides.rbac.denyMatchAny,
			},
		};
	}
	return operation;
};
