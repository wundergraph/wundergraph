import fs from 'fs';
import path from 'path';
import os from 'os';
import process from 'node:process';
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
import { JSONSchema7 as JSONSchema } from 'json-schema';
import objectHash from 'object-hash';
import { camelCase } from 'lodash';
import { buildGenerator, getProgramFromFiles, JsonSchemaGenerator, programFromConfig } from 'typescript-json-schema';
import { ZodType } from 'zod';
import {
	Api,
	DatabaseApiCustom,
	DataSource,
	GraphQLApiCustom,
	introspectGraphqlServer,
	ApiIntrospectionOptions,
	RESTApiCustom,
	StaticApiCustom,
	WG_DATA_SOURCE_POLLING_MODE,
} from '../definition';
import { mergeApis } from '../definition/merge';
import {
	GraphQLOperation,
	GraphQLOperationFile,
	isInternalOperationByAPIMountPath,
	isWellKnownClaim,
	loadOperations,
	LoadOperationsOutput,
	ParsedOperations,
	parseGraphQLOperations,
	removeHookVariables,
	TypeScriptOperation,
	TypeScriptOperationFile,
	WellKnownClaim,
} from '../graphql/operations';
import { GenerateCode, Template } from '../codegen';
import {
	ArgumentRenderConfiguration,
	ArgumentSource,
	AuthProvider,
	BuildInfo,
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
	ValueType,
	WebhookConfiguration,
	WunderGraphConfiguration,
} from '@wundergraph/protobuf';
import { SDK_VERSION } from '../version';
import { AuthenticationProvider } from './authentication';
import { findUp } from './findup';
import { FieldInfo, LinkConfiguration, LinkDefinition, queryTypeFields } from '../linkbuilder';
import { LocalCache } from '../localcache';
import { OpenApiBuilder } from '../openapibuilder';
import { PostmanBuilder } from '../postman/builder';
import { CustomizeMutation, CustomizeQuery, CustomizeSubscription, OperationsConfiguration } from './operations';
import { HooksConfiguration, ResolvedServerOptions, WunderGraphHooksAndServerConfig } from '../server/types';
import { getWebhooks } from '../webhooks';
import { NodeOptions, ResolvedNodeOptions, resolveNodeOptions } from './options';
import { EnvironmentVariable, InputVariable, mapInputVariable, resolveConfigurationVariable } from './variables';
import logger, { FatalLogger, Logger } from '../logger';
import { resolveServerOptions, serverOptionsWithDefaults } from '../server/util';
import { loadNodeJsOperationDefaultModule, NodeJSOperation } from '../operations/operations';
import zodToJsonSchema from 'zod-to-json-schema';
import { GenerateConfig, OperationsGenerationConfig } from './codegeneration';
import { generateOperations } from '../codegen/generateoperations';

const utf8 = 'utf8';
const generated = 'generated';
const jsonExtension = 'json';
const unknown = 'unknown';

export interface WunderGraphCorsConfiguration {
	allowedOrigins: InputVariable[];
	allowedMethods?: string[];
	allowedHeaders?: string[];
	exposedHeaders?: string[];
	maxAge?: number;
	allowCredentials?: boolean;
}

/**
 * ApiIntrospector<T> is a function type which the API generators must conform to.
 * Given an ApiIntrospectionOptions, they should return a Promise that resolves
 * to an Api<T>
 */
export type ApiIntrospector<T> = (options: ApiIntrospectionOptions) => Promise<Api<T>>;
/**
 * AsyncApiIntrospector<T> is the type returned by all functions that generate something
 * "introspectable" (e.g. an API). These get awaited in parallel while resolving the
 * application configuration.
 */
export type AsyncApiIntrospector<T> = Promise<ApiIntrospector<T>>;

export interface WunderGraphConfigApplicationConfig<
	TCustomClaim extends string = string,
	TPublicClaim extends TCustomClaim | WellKnownClaim = TCustomClaim | WellKnownClaim
> {
	apis: AsyncApiIntrospector<any>[];
	/**
	 * @deprecated use `generate` instead
	 */
	codeGenerators?: CodeGen[];
	generate?: GenerateConfig;
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
			// e.g. if an authorized URI is "http://localhost:3000", the URI "http://localhost:3000/" would also match
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
		/**
		 * Custom claims defined by the application. Each key represents its shorthand name
		 * (used in User attributes or references to custom claims) while each value is
		 * a CustomClaim object.
		 *
		 * @default none
		 *
		 * @see CustomClaim
		 */
		customClaims?: Record<TCustomClaim, CustomClaim>;
		/**
		 * Claims to be publicly available (i.e. served by the API to the frontend), referenced by
		 * their shorthand name for custom claims (i.e. keys in the customClaims attribute) or by their
		 * enum value for well known ones. If the list is empty, all claims are made public.
		 *
		 * @default empty
		 *
		 * @see WellKnownClaim
		 * @see WunderGraphConfigApplicationConfig.customClaims
		 */
		publicClaims?: TPublicClaim[];
	};
	links?: LinkConfiguration;
	security?: SecurityConfig;

	/**
	 * OpenAPI generator configuration
	 */
	openApi?: {
		title?: string;
		apiVersion?: string;
	};

	/** @deprecated: Not used anymore */
	dotGraphQLConfig?: any;
}

export interface TokenAuthProvider {
	jwksJSON?: InputVariable;
	jwksURL?: InputVariable;
	userInfoEndpoint?: InputVariable;
	userInfoCacheTtlSeconds?: number;
}

export interface CustomClaim {
	/**
	 * Path to the object inside the user payload to retrieve this claim
	 */
	jsonPath: string;

	/** Value type
	 *
	 * @default 'string'
	 */
	type?: 'string' | 'int' | 'float' | 'boolean' | 'any';

	/** If required is true, users without this claim will
	 * fail to authenticate
	 *
	 * @default true
	 */
	required?: boolean;
}

export interface SecurityConfig {
	enableGraphQLEndpoint?: boolean;
	// allowedHosts defines allowed hosts
	// e.g. when running WunderGraph on localhost:9991, but your external host pointing to the internal IP is example.com,
	// you have to add "example.com" to the allowedHosts so that the WunderGraph router allows the hostname.
	allowedHosts?: InputVariable[];
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
	/** Whether authentication is required to upload to this profile
	 *
	 * @default true
	 */
	requireAuthentication?: boolean;
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
	 * List of mime-types allowed to be uploaded, case-insensitive
	 *
	 * @default Any type
	 */
	allowedMimeTypes?: string[];
	/**
	 * Allowed file extensions, case-insensitive
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
	// XXX: ResolvedWunderGraphConfig is hashed by several templates.
	// DO NOT INCLUDE UNSTABLE DATA (paths, times, etc...) in it.
	application: ResolvedApplication;
	deployment: ResolvedDeployment;
	sdkVersion: string;
	authentication: {
		roles: string[];
		cookieBased: AuthProvider[];
		tokenBased: TokenAuthProvider[];
		customClaims: Record<string, CustomClaim>;
		publicClaims: string[];
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
	// Keep ResolvedWunderGraphConfig in a separate field, so it can be
	// hashed without using any unstable data as the hash input (e.g.
	// paths like outPath or wunderGraphDir).
	config: ResolvedWunderGraphConfig;
	outPath: string;
	wunderGraphDir: string;
}

const resolvePublicClaims = (config: WunderGraphConfigApplicationConfig) => {
	const publicClaims: string[] = [];
	for (const claim of config.authentication?.publicClaims ?? []) {
		const customClaim = config.authentication?.customClaims?.[claim];
		if (customClaim) {
			publicClaims.push(customClaim.jsonPath);
		} else {
			if (!isWellKnownClaim(claim)) {
				throw new Error(`invalid public claim ${claim}: not a custom nor a well known claim`);
			}
			publicClaims.push(claim);
		}
	}
	return publicClaims;
};

const resolveConfig = async (
	config: WunderGraphConfigApplicationConfig
): Promise<{ config: ResolvedWunderGraphConfig; apis: Api<any>[] }> => {
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
	const customClaims = Object.keys(config.authentication?.customClaims ?? {});

	const apiIntrospectionOptions: ApiIntrospectionOptions = {
		httpProxyUrl:
			resolvedNodeOptions.defaultHttpProxyUrl !== undefined
				? resolveConfigurationVariable(resolvedNodeOptions.defaultHttpProxyUrl)
				: undefined,
	};

	// Generate the promises first, then await them all at once
	// to run them in parallel
	const generators = await Promise.all(config.apis);
	const resolvedApis = await Promise.all(generators.map((generator) => generator(apiIntrospectionOptions)));

	const resolved = await resolveApplication(
		roles,
		customClaims,
		resolvedApis,
		apiIntrospectionOptions,
		cors,
		config.s3UploadProvider || [],
		config.server?.hooks
	);

	const cookieBasedAuthProviders: AuthProvider[] =
		(config.authentication !== undefined &&
			config.authentication.cookieBased !== undefined &&
			config.authentication.cookieBased.providers
				.map((provider) => provider.resolve())
				.map((provider) => ({
					...provider,
					id: camelCase(provider.id),
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
			customClaims: config.authentication?.customClaims || {},
			publicClaims: resolvePublicClaims(config),
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

	const appConfig = config.links ? addLinks(resolvedConfig, config.links) : resolvedConfig;
	return { config: appConfig, apis: resolvedApis };
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
				renameTypeTo: '',
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
				requireAuthentication: profile.requireAuthentication ?? true,
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
	customClaims: string[],
	resolvedApis: Api<any>[],
	apiIntrospectionOptions: ApiIntrospectionOptions,
	cors: CorsConfiguration,
	s3?: S3Provider,
	hooks?: HooksConfiguration
): Promise<ResolvedApplication> => {
	const merged = mergeApis(roles, customClaims, ...resolvedApis);
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

const logLoadedOperations = (files: GraphQLOperationFile[] | TypeScriptOperationFile[] | undefined, suffix: string) => {
	if (files) {
		Logger.info(`found ${files.length ?? 0} ${suffix} operations`);
		Logger.debug(files.map((op) => op.operation_name).join(', '));
	}
};

// configureWunderGraphApplication generates the file "generated/wundergraph.config.json" and runs the configured code generators
// the wundergraph.config.json file will be picked up by "wunderctl up" to configure your development environment
export const configureWunderGraphApplication = <
	TCustomClaim extends string,
	TPublicClaim extends TCustomClaim | WellKnownClaim
>(
	config: WunderGraphConfigApplicationConfig<TCustomClaim, TPublicClaim>
) => {
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

	const wgDirAbs = process.env.WG_DIR_ABS;
	if (!wgDirAbs) {
		throw new Error('environment variable WG_DIR_ABS is empty');
	}

	let buildError: any = null;
	const buildInfo: BuildInfo = {
		success: false,
		sdk: {
			version: SDK_VERSION ?? unknown,
		},
		wunderctl: {
			version: process.env.WUNDERCTL_VERSION ?? unknown,
		},
		node: {
			version: process.version,
		},
		os: {
			type: os.type(),
			platform: os.platform(),
			arch: os.arch(),
			version: os.version(),
			release: os.release(),
		},
		stats: {
			// This must be read before passing the config to the resolveConfig function
			totalApis: config.apis?.length ?? 0,
			hasUploadProvider: !!config?.s3UploadProvider?.find((provider) => !!provider.name),
			totalOperations: 0,
			totalWebhooks: 0,
			hasAuthenticationProvider:
				!!config?.authentication?.tokenBased?.providers?.length ||
				!!config?.authentication?.cookieBased?.providers?.length,
		},
	};

	resolveConfig(config)
		.then(async ({ config: resolved, apis }) => {
			Logger.info({ sdk: buildInfo.sdk?.version, wunderctl: buildInfo.wunderctl?.version }, 'Building ...');

			const app = resolved.application;
			const schemaFileName = `wundergraph.schema.graphql`;
			const schemaContent = '# Code generated by "wunderctl"; DO NOT EDIT.\n\n' + app.EngineConfiguration.Schema;

			writeWunderGraphFileSync('schema', schemaContent, 'graphql');

			/**
			 * Webhooks
			 */

			const webhooksDir = path.join('webhooks');
			if (fs.existsSync(webhooksDir)) {
				const webhooks = await getWebhooks(path.join('webhooks'));
				resolved.webhooks = webhooks.map((webhook) => {
					const webhookConfig: WebhookConfiguration = {
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

			// Count total webhooks
			if (buildInfo.stats) {
				buildInfo.stats.totalWebhooks = resolved.webhooks?.length ?? 0;
			}

			if (config.generate?.operationsGenerator) {
				const operationGenerationConfig = new OperationsGenerationConfig({ resolved, app: config, apis });
				config.generate.operationsGenerator(operationGenerationConfig);
				await generateOperations({
					wgDirAbs,
					operationGenerationConfig,
					resolved,
					app,
					basePath: operationGenerationConfig.getBasePath(),
					fields: operationGenerationConfig.getRootFields(),
				});
			}

			const loadedOperations = await loadOperations(schemaFileName);

			logLoadedOperations(loadedOperations.graphql_operation_files, 'GraphQL');
			logLoadedOperations(loadedOperations.typescript_operation_files, 'TypeScript');

			const operations = await resolveOperationsConfigurations(
				wgDirAbs,
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
							if (customize) {
								mutationConfig = (customize as CustomizeMutation)(mutationConfig);
							}
							return loadAndApplyNodeJsOperationOverrides(wgDirAbs, {
								...op,
								AuthenticationConfig: {
									...op.AuthenticationConfig,
									required: op.AuthenticationConfig.required || mutationConfig.authentication.required,
								},
							});
						case OperationType.QUERY:
							let queryConfig = cfg.queries(base);
							if (customize) {
								queryConfig = (customize as CustomizeQuery)(queryConfig);
							}
							return loadAndApplyNodeJsOperationOverrides(wgDirAbs, {
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
							if (customize) {
								subscriptionConfig = (customize as CustomizeSubscription)(subscriptionConfig);
							}
							return loadAndApplyNodeJsOperationOverrides(wgDirAbs, {
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

			// Count total operations
			if (buildInfo.stats) {
				buildInfo.stats.totalOperations = app.Operations.length;
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
					op.HooksConfiguration.mutatingPreResolve =
						'mutatingPreResolve' in hooks && hooks.mutatingPreResolve !== undefined;
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
					op.HooksConfiguration.mutatingPreResolve =
						'mutatingPreResolve' in hooks && hooks.mutatingPreResolve !== undefined;
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
					op.HooksConfiguration.mutatingPreResolve =
						'mutatingPreResolve' in hooks && hooks.mutatingPreResolve !== undefined;
					op.HooksConfiguration.mutatingPostResolve = hooks.mutatingPostResolve !== undefined;
				}
			}

			const combined = [...(config.generate?.codeGenerators || []), ...(config.codeGenerators || [])];
			for (let i = 0; i < combined.length; i++) {
				const gen = combined[i];
				await GenerateCode({
					wunderGraphConfig: resolved,
					templates: gen.templates,
					basePath: gen.path || generated,
				});
			}

			// Update response types for TS operations. Do this only after code generation completes,
			// since TS operations need some of the generated files
			const tsOperations: TypeScriptOperation[] = app.Operations.filter(
				(operation) => operation.ExecutionEngine == OperationExecutionEngine.ENGINE_NODEJS
			);
			await updateTypeScriptOperationsResponseSchemas(wgDirAbs, tsOperations);

			const configJsonPath = path.join(generated, 'wundergraph.config.json');
			const configJSON = ResolvedWunderGraphConfigToJSON(resolved);
			// config json exists
			if (fs.existsSync(configJsonPath)) {
				const existing = fs.readFileSync(configJsonPath, utf8);
				if (configJSON !== existing) {
					writeWunderGraphFileSync('config', configJSON);
				}
			} else {
				writeWunderGraphFileSync('config', configJSON);
			}

			const publicNodeUrl = trimTrailingSlash(resolveConfigurationVariable(resolved.nodeOptions.publicNodeUrl));

			const postman = PostmanBuilder(app.Operations, {
				baseURL: publicNodeUrl,
			});

			writeWunderGraphFileSync('postman', postman.toJSON());

			const openApiBuilder = new OpenApiBuilder({
				title: config.openApi?.title || 'WunderGraph Application',
				version: config.openApi?.apiVersion || '0',
				baseURL: publicNodeUrl,
			});

			const openApiSpec = openApiBuilder.build(app.Operations);

			writeWunderGraphFileSync('openapi', openApiSpec);

			Logger.info('Build completed.');
		})
		.then(() => {
			buildInfo.success = true;
		})
		.catch((e: any) => {
			buildError = e;
		})
		.finally(() => {
			// Ensure that the build info is written even if the build fails
			writeWunderGraphFileSync('build_info', buildInfo);

			if (buildError) {
				FatalLogger.fatal(buildError);
				process.exit(1);
			} else {
				process.exit(0);
			}
		});
};

const mapRecordValues = <TKey extends string | number | symbol, TValue, TOutputValue>(
	record: Record<TKey, TValue>,
	fn: (key: TKey, value: TValue) => TOutputValue
): Record<TKey, TOutputValue> => {
	let output: Record<TKey, TOutputValue> = {} as any;
	for (const key in record) {
		output[key] = fn(key, record[key]);
	}
	return output;
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
							requireAuthentication: resolved.requireAuthentication,
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
				publicClaims: config.authentication.publicClaims,
			},
			allowedHostNames: config.security.allowedHostNames,
			webhooks: config.webhooks,
			nodeOptions: config.nodeOptions,
			serverOptions: config.serverOptions,
		},
		dangerouslyEnableGraphQLEndpoint: config.enableGraphQLEndpoint,
	};

	return JSON.stringify(out, null, 2);
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

// typeScriptOperationsResponseSchemas generates the response schemas for all TypeScript
// operations at once, since it's several times faster than generating them one by one
const typeScriptOperationsResponseSchemas = async (wgDirAbs: string, operations: GraphQLOperation[]) => {
	const functionTypeName = (op: GraphQLOperation) => `function_${op.Name}`;
	const responseTypeName = (op: GraphQLOperation) => `${functionTypeName(op)}_Response`;

	const programFile = 'typescript_schema_generator.ts';

	const contents: string[] = ['import type { ExtractResponse } from "@wundergraph/sdk/operations";'];
	const operationHashes: string[] = [];

	for (const op of operations) {
		const relativePath = `../operations/${op.PathName}`;
		const name = functionTypeName(op);
		contents.push(`import type ${name} from "${relativePath}";`);
		contents.push(`export type ${responseTypeName(op)} = ExtractResponse<typeof ${name}>`);
		const implementationFilePath = operationFilePath(wgDirAbs, op);
		const implementationContents = fs.readFileSync(implementationFilePath, { encoding: 'utf8' });
		operationHashes.push(objectHash(implementationContents));
	}

	const cache = new LocalCache().bucket('operationTypes');
	const cacheKey = `ts.operationTypes.${objectHash([contents, operationHashes])}`;
	const cachedData = await cache.getJSON(cacheKey);
	if (cachedData) {
		return cachedData as Record<string, JSONSchema>;
	}

	const basePath = path.join(wgDirAbs, generated);
	const programPath = path.join(basePath, programFile);

	fs.writeFileSync(programPath, contents.join('\n'), { encoding: utf8 });

	const settings = {
		required: true,
		ignoreErrors: true,
	};

	// XXX: There's no way to silence warnings from TJS, override console.warn
	const originalWarn = console.warn;
	console.warn = (_message?: any, ..._optionalParams: any[]) => {};
	// If we can find a tsconfig.json, use it
	const tsConfigPath = await findUp('tsconfig.json', wgDirAbs);
	let generator: JsonSchemaGenerator | null = null;
	if (tsConfigPath) {
		const tsConfigProgram = programFromConfig(tsConfigPath, [programPath]);
		if (tsConfigProgram) {
			generator = buildGenerator(tsConfigProgram, settings);
		}
	} else {
		// Otherwise, use the default configuration feeding the TS files
		const compilerOptions = {
			strictNullChecks: true,
			noEmit: true,
			ignoreErrors: true,
		};
		const program = getProgramFromFiles([programPath], compilerOptions, basePath);
		generator = buildGenerator(program, settings);
	}
	// generator can be null if the program can't be compiled
	if (!generator) {
		console.warn = originalWarn;
		throw new Error('could not parse .ts operation files');
	}
	const schemas: Record<string, JSONSchema> = {};
	for (const op of operations) {
		try {
			const schema = generator.getSchemaForSymbol(responseTypeName(op));
			delete schema.$schema;
			schemas[op.Name] = schema as JSONSchema;
		} catch (e: any) {
			Logger.warn(`could not generate response schema for ${op.Name}: ${e}`);
		}
	}
	console.warn = originalWarn;

	await cache.setJSON(cacheKey, schemas);
	return schemas;
};

const updateTypeScriptOperationsResponseSchemas = async (wgDirAbs: string, operations: GraphQLOperation[]) => {
	const schemas = await typeScriptOperationsResponseSchemas(wgDirAbs, operations);
	for (const op of operations) {
		const schema = schemas[op.Name];
		if (schema) {
			op.ResponseSchema = schema;
		} else {
			// For functions that don't return anything, we return an empty JSON object
			op.ResponseSchema = {
				type: 'object',
				additionalProperties: false,
				properties: {},
			};
		}
	}
};

const loadNodeJsOperation = async (wgDirAbs: string, file: TypeScriptOperationFile) => {
	const filePath = path.join(wgDirAbs, file.module_path);
	const implementation = await loadNodeJsOperationDefaultModule(filePath);

	if (implementation.internal) {
		Logger.warn(
			'Use of the internal prop is deprecated. ' +
				'More details here: https://docs.wundergraph.com/docs/typescript-operations-reference/security#internal-operations'
		);
	}
	const isInternal = implementation.internal || isInternalOperationByAPIMountPath(file.api_mount_path);

	const operation: TypeScriptOperation = {
		Name: file.operation_name,
		PathName: file.api_mount_path,
		Content: '',
		Errors: implementation.errors?.map((E) => new E()) || [],
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
		// Use an empty default for now, we'll fill that later because we
		// need some generated files to be ready
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
		Internal: isInternal,
		PostResolveTransformations: undefined,
	};
	return { operation, implementation };
};

const resolveOperationsConfigurations = async (
	wgDirAbs: string,
	config: ResolvedWunderGraphConfig,
	loadedOperations: LoadOperationsOutput,
	customJsonScalars: string[]
): Promise<ParsedOperations> => {
	const customClaims = mapRecordValues(config.authentication.customClaims ?? {}, (key, claim) => {
		let claimType: ValueType;
		switch (claim.type) {
			case 'string':
				claimType = ValueType.STRING;
				break;
			case 'int':
				claimType = ValueType.INT;
				break;
			case 'float':
				claimType = ValueType.FLOAT;
				break;
			case 'boolean':
				claimType = ValueType.FLOAT;
				break;
			case 'any':
				claimType = ValueType.ANY;
				break;
			case undefined:
				claimType = ValueType.STRING;
				break;
			default:
				throw new Error(`customClaim ${key} has invalid type ${claim.type}`);
		}
		const jsonPathComponents: string[] = claim.jsonPath.split('.');
		if (jsonPathComponents.length === 0) {
			throw new Error(`empty jsonPath in customClaim ${key}`);
		}
		return {
			name: key,
			jsonPathComponents,
			type: claimType,
			required: claim.required ?? true,
		};
	});
	const graphQLOperations = parseGraphQLOperations(config.application.EngineConfiguration.Schema, loadedOperations, {
		keepFromClaimVariables: false,
		interpolateVariableDefinitionAsJSON: config.interpolateVariableDefinitionAsJSON,
		customJsonScalars,
		customClaims,
	});
	const nodeJSOperations: TypeScriptOperation[] = [];
	if (loadedOperations.typescript_operation_files) {
		for (const file of loadedOperations.typescript_operation_files) {
			try {
				const { operation, implementation } = await loadNodeJsOperation(wgDirAbs, file);
				nodeJSOperations.push(applyNodeJsOperationOverrides(operation, implementation));
			} catch (e: any) {
				logger.info(`Skipping operation ${file.file_path} due to error: ${e.message}`);
			}
		}
	}
	return {
		operations: [...graphQLOperations.operations, ...nodeJSOperations],
	};
};

// operationFilePath returns the absolute path for the implementation file of an operation
const operationFilePath = (wgDirAbs: string, operation: GraphQLOperation) => {
	let extension: string;
	switch (operation.ExecutionEngine) {
		case OperationExecutionEngine.ENGINE_GRAPHQL:
			extension = '.graphql';
			break;
		case OperationExecutionEngine.ENGINE_NODEJS:
			extension = '.ts';
			break;
	}
	return path.join(wgDirAbs, 'operations', `${operation.PathName}${extension}`);
};

// loadAndApplyNodeJsOperationOverrides loads the implementation file from the given operation and
// then calls applyNodeJsOperationOverrides with the implementation. If the operation doesn't use
// the NODEJS engine, it returns the operation unchanged.
const loadAndApplyNodeJsOperationOverrides = async (
	wgDirAbs: string,
	operation: TypeScriptOperation
): Promise<TypeScriptOperation> => {
	if (operation.ExecutionEngine !== OperationExecutionEngine.ENGINE_NODEJS) {
		return operation;
	}
	const filePath = path.join(wgDirAbs, generated, 'bundle', 'operations', operation.PathName + '.cjs');
	const implementation = await loadNodeJsOperationDefaultModule(filePath);
	return applyNodeJsOperationOverrides(operation, implementation);
};

// applyNodeJsOperationOverrides takes a GraphQLOperation using the NODEJS engine as well as the operation implementation
// and sets the input schema, authorization and authentication configuration for the operation based on what the implementation
// does. Notice that, for performance reasons, the response schema is set by updateTypeScriptOperationsResponseSchemas instead of
// this function.
const applyNodeJsOperationOverrides = (
	operation: TypeScriptOperation,
	overrides: NodeJSOperation<any, any, any, any, any, any, any, any>
): TypeScriptOperation => {
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
	if (overrides.errors) {
		operation.Errors = overrides.errors.map((E) => new E());
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

const writeWunderGraphFileSync = (fileName: string, contents: object | string, extension = jsonExtension) => {
	if (typeof contents !== 'string') {
		contents = JSON.stringify(contents, null, 2);
	}

	fs.writeFileSync(path.join(generated, `wundergraph.${fileName}.${extension}`), contents, { encoding: utf8 });
};
