import { federationServiceSDL, isFederationService } from '../graphql/federation';
import { configuration } from '../graphql/configuration';
import {
	buildClientSchema,
	buildSchema,
	getIntrospectionQuery,
	GraphQLSchema,
	introspectionFromSchema,
	parse,
	print,
	printSchema,
} from 'graphql';
import { mergeApis } from './merge';
import * as fs from 'fs';
import { openApiSpecificationToRESTApiObject } from '../v2openapi';
import { renameTypeFields, renameTypes } from '../graphql/renametypes';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
	ArgumentSource,
	ConfigurationVariable,
	ConfigurationVariableKind,
	DataSourceKind,
	DirectiveConfiguration,
	FetchConfiguration,
	FieldConfiguration,
	HTTPHeader,
	HTTPMethod,
	MTLSConfiguration,
	SigningMethod,
	SingleTypeField,
	StatusCodeTypeMapping,
	TypeConfiguration,
	TypeField,
	UpstreamAuthentication,
	UpstreamAuthenticationKind,
} from '@wundergraph/protobuf';
import { cleanupSchema } from '../graphql/schema';
import path from 'path';
import { DatabaseSchema, introspectPrismaDatabaseWithRetries } from '../db/introspection';
import {
	applyNamespaceToDirectiveConfiguration,
	applyNameSpaceToFieldConfigurations,
	applyNameSpaceToGraphQLSchema,
	applyNameSpaceToTypeFields,
	generateTypeConfigurationsForNamespace,
} from './namespacing';
import { EnvironmentVariable, InputVariable, mapInputVariable, PlaceHolder, resolveVariable } from '../configure';
import { loadFile } from '../codegen/templates/typescript';
import { composeServices } from '@apollo/composition';
import { buildSubgraphSchema, ServiceDefinition } from '@apollo/federation';
import * as https from 'https';
import objectHash from 'object-hash';

export const DataSourcePollingModeEnabled = process.env['WG_DATA_SOURCE_POLLING_MODE'] === 'true';

export interface ApplicationConfig {
	name: string;
	apis: Promise<Api<any>>[];
}

export class Application {
	constructor(config: ApplicationConfig) {
		this.name = config.name;
		this.apis = config.apis;
	}

	name: string;
	apis: Promise<Api<any>>[];
}

export interface RenameType {
	from: string;
	to: string;
}

export interface RenameTypes {
	renameTypes: (rename: RenameType[]) => void;
}

export interface RenameTypeField {
	typeName: string;
	fromFieldName: string;
	toFieldName: string;
}

export interface RenameTypeFields {
	renameTypeFields: (rename: RenameTypeField[]) => void;
}

export class Api<T> implements RenameTypes, RenameTypeFields {
	constructor(
		schema: string,
		dataSources: DataSource<T>[],
		fields: FieldConfiguration[],
		types: TypeConfiguration[],
		interpolateVariableDefinitionAsJSON: string[]
	) {
		this.Schema = schema;
		this.DataSources = dataSources;
		this.Fields = fields;
		this.Types = types;
		this.interpolateVariableDefinitionAsJSON = interpolateVariableDefinitionAsJSON;
	}

	DefaultFlushInterval: number = 500;
	Schema: string;
	DataSources: DataSource<T>[];
	Fields: FieldConfiguration[];
	Types: TypeConfiguration[];
	interpolateVariableDefinitionAsJSON: string[];

	renameTypes(rename: RenameType[]): void {
		this.Schema = renameTypes(this.Schema, rename);
		this.DataSources = this.DataSources.map((d) => {
			return {
				...d,
				RootNodes: typeFieldsRenameType(d.RootNodes, rename),
				ChildNodes: typeFieldsRenameType(d.ChildNodes, rename),
			};
		});
		this.Fields = this.Fields.map((field) => {
			const re = rename.find((r) => r.from === field.typeName);
			return {
				...field,
				typeName: re !== undefined ? re.to : field.typeName,
			};
		});
	}

	renameTypeFields(rename: RenameTypeField[]): void {
		this.Schema = renameTypeFields(this.Schema, rename);
		this.DataSources = this.DataSources.map((d) => {
			return {
				...d,
				RootNodes: typeFieldsRenameTypeField(d.RootNodes, rename),
				ChildNodes: typeFieldsRenameTypeField(d.ChildNodes, rename),
			};
		});
		this.Fields = this.Fields.map((field) => {
			const re = rename.find((re) => re.typeName === field.typeName && re.fromFieldName === field.fieldName);
			if (re !== undefined) {
				return {
					...field,
					fieldName: re.toFieldName,
					path: field.path.map((item) => (item === field.fieldName ? re.toFieldName : item)),
				};
			}
			const sameTypeRenameFields = rename.filter((re) => re.typeName === field.typeName);
			return {
				...field,
				requiresFields: field.requiresFields.map((f) => {
					const re = sameTypeRenameFields.find((sameTypeField) => sameTypeField.fromFieldName === f);
					if (re !== undefined) {
						return re.toFieldName;
					}
					return f;
				}),
				argumentsConfiguration: field.argumentsConfiguration.map((arg) => {
					if (arg.sourceType === ArgumentSource.OBJECT_FIELD) {
						return {
							...arg,
							sourcePath: arg.sourcePath.map((item) => {
								const re = sameTypeRenameFields.find((sameTypeField) => sameTypeField.fromFieldName === item);
								if (re !== undefined) {
									return re.toFieldName;
								}
								return item;
							}),
						};
					}
					return arg;
				}),
			};
		});
	}
}

const typeFieldsRenameType = (fields: TypeField[], rename: RenameType[]): TypeField[] => {
	return fields.map((node) => {
		const re = rename.find((r) => r.from === node.typeName);
		return {
			...node,
			typeName: re !== undefined ? re.to : node.typeName,
		};
	});
};

const typeFieldsRenameTypeField = (fields: TypeField[], rename: RenameTypeField[]): TypeField[] => {
	return fields.map((node) => {
		return {
			...node,
			fieldNames: node.fieldNames.map((field) => {
				const re = rename.find((re) => re.typeName === node.typeName && re.fromFieldName === field);
				if (re !== undefined) {
					return re.toFieldName;
				}
				return field;
			}),
		};
	});
};

export const createMockApi = async (sdl: string, apiNamespace?: string): Promise<Api<any>> => {
	const schema = print(parse(sdl));
	return new GraphQLApi(applyNameSpaceToGraphQLSchema(schema, [], apiNamespace), [], [], [], []);
};

export class GraphQLApi extends Api<GraphQLApiCustom> {}

export class RESTApi extends Api<RESTApiCustom> {}

export class PostgresqlApi extends Api<DatabaseApiCustom> {}

export class MySQLApi extends Api<DatabaseApiCustom> {}

export class PlanetscaleApi extends Api<DatabaseApiCustom> {}

export class SQLiteApi extends Api<DatabaseApiCustom> {}

export class SQLServerApi extends Api<DatabaseApiCustom> {}

export class MongoDBApi extends Api<DatabaseApiCustom> {}

export interface DataSource<Custom = unknown> {
	Kind: DataSourceKind;
	RootNodes: TypeField[];
	ChildNodes: TypeField[];
	Custom: Custom;
	Directives: DirectiveConfiguration[];
}

interface GraphQLIntrospectionOptions {
	// loadSchemaFromString allows you to skip the introspection process and load the GraphQL Schema from a string instead
	// this way, you can import a GraphQL Schema file or load the Schema in more flexible ways than relying on sending a GraphQL Introspection Query
	loadSchemaFromString?: string | (() => string);
	customFloatScalars?: string[];
	customIntScalars?: string[];
	// switching internal to true will mark the origin as an internal GraphQL API
	// this will forward the original request and user info to the internal upstream
	// so that the request context can be enriched
	internal?: boolean;
	skipRenameRootFields?: string[];
}

export interface GraphQLIntrospection extends GraphQLUpstream, GraphQLIntrospectionOptions {
	isFederation?: boolean;
}

export interface GraphQLFederationUpstream extends Omit<Omit<GraphQLUpstream, 'introspection'>, 'apiNamespace'> {
	name?: string;
	loadSchemaFromString?: GraphQLIntrospectionOptions['loadSchemaFromString'];
}

export interface GraphQLFederationIntrospection extends IntrospectionConfiguration {
	upstreams: GraphQLFederationUpstream[];
	apiNamespace?: string;
}

export interface ResolvedReplaceJSONTypeFieldConfiguration {
	fields: SingleTypeField[];
	replaceWithNamedType: string;
}

export interface ReplaceJSONTypeFieldConfiguration {
	entityName: string;
	fieldName: string;
	inputTypeReplacement: string;
	responseTypeReplacement: string;
}

export interface DatabaseIntrospection extends IntrospectionConfiguration {
	databaseURL: InputVariable;
	apiNamespace?: string;
	// the schemaExtension field is used to extend the generated GraphQL schema with additional types and fields
	// this is useful for specifying type definitions for JSON objects
	schemaExtension?: string;
	replaceJSONTypeFields?: ReplaceJSONTypeFieldConfiguration[];
}

export interface IntrospectionConfiguration {
	introspection?: {
		disableCache?: boolean;
		pollingIntervalSeconds?: number;
	};
}

export interface HTTPUpstream extends IntrospectionConfiguration {
	apiNamespace?: string;
	headers?: (builder: IHeadersBuilder) => IHeadersBuilder;
	authentication?: HTTPUpstreamAuthentication;
	mTLS?: HTTPmTlsConfiguration;
}

export interface IHeadersBuilder {
	addStaticHeader: (key: string, value: InputVariable) => IHeadersBuilder;
	addClientRequestHeader: (key: string, requestHeaderName: string) => IHeadersBuilder;
}

export class HeadersBuilder {
	private headers: HeaderConfiguration[] = [];
	public addEnvironmentVariableHeader = (key: string, environmentVariableName: string) => {
		this.headers.push({
			key,
			value: environmentVariableName,
			valueSource: 'env',
		});
		return this;
	};
	public addStaticHeader = (key: string, value: InputVariable) => {
		if (value === undefined) {
			throw new Error(`Static header value cannot be undefined`);
		}
		if (typeof value === 'string') {
			this.headers.push({
				key,
				value,
				valueSource: 'static',
			});
			return this;
		}
		if ((value as PlaceHolder)._identifier === 'placeholder') {
			this.headers.push({
				key,
				value: (value as PlaceHolder).name,
				valueSource: 'placeholder',
			});
			return this;
		}
		this.headers.push({
			key,
			value: value.name,
			valueSource: 'env',
			defaultValue: (value as EnvironmentVariable).defaultValue,
		});
		return this;
	};
	public addClientRequestHeader = (key: string, requestHeaderName: string) => {
		this.headers.push({
			key,
			value: requestHeaderName,
			valueSource: 'clientRequest',
		});
		return this;
	};
	public build = (): HeaderConfiguration[] => {
		return this.headers;
	};
}

export type HTTPmTlsConfiguration = {
	/**
	 * 	Private-key or environment variable name that stores the key
	 */
	key: InputVariable;
	/**
	 * 	X.509 (TLS/HTTPS) or environment variable name that stores the certificate
	 */
	cert: InputVariable;
	/**
	 * InsecureSkipVerify controls whether a client verifies the server's certificate chain and host name
	 * If InsecureSkipVerify is true, crypto/tls accepts any certificate presented by the server and any host name in that certificate.
	 * In this mode, TLS is susceptible to machine-in-the-middle attacks unless custom verification is used.
	 * This should be used only for testing
	 */
	insecureSkipVerify: boolean;
};

export type HTTPUpstreamAuthentication = JWTAuthentication | JWTAuthenticationWithAccessTokenExchange;

export interface JWTAuthentication {
	kind: 'jwt';
	secret: InputVariable;
	signingMethod: JWTSigningMethod;
}

export interface JWTAuthenticationWithAccessTokenExchange {
	kind: 'jwt_with_access_token_exchange';
	secret: InputVariable;
	signingMethod: JWTSigningMethod;
	accessTokenExchangeEndpoint: InputVariable;
}

export type JWTSigningMethod = 'HS256';

export interface GraphQLUpstream extends HTTPUpstream {
	url: InputVariable;
	subscriptionsURL?: InputVariable;
}

export interface OpenAPIIntrospectionFile {
	kind: 'file';
	filePath: string;
}

export interface OpenAPIIntrospectionString {
	kind: 'string';
	openAPISpec: string;
}

export interface OpenAPIIntrospectionObject {
	kind: 'object';
	openAPIObject: {};
}

export type OpenAPIIntrospectionSource =
	| OpenAPIIntrospectionFile
	| OpenAPIIntrospectionString
	| OpenAPIIntrospectionObject;

export interface HeaderConfiguration {
	// key is the name of the Header that will be sent to the upstream, e.g. Authorization
	key: string;
	// valueSource defines where the value should come from
	// static means, use the static content of the field "value"
	// clientRequest means, the content of "value" defines a client request Header field
	// so, if the field value is "Authorization",
	// the client Header value for the key "Authorization" will be injected into the header
	// env means, use the value from the environment variable
	valueSource: 'static' | 'env' | 'clientRequest' | 'placeholder';
	value: string;
	defaultValue?: string;
}

export interface OpenAPIIntrospection extends HTTPUpstream {
	source: OpenAPIIntrospectionSource;
	// statusCodeUnions set to true will make all responses return a union type of all possible response objects,
	// mapped by status code
	// by default, only the status 200 response is mapped, which keeps the GraphQL API flat
	// by enabling statusCodeUnions, you have to unwrap the response union via fragments for each response
	statusCodeUnions?: boolean;
	baseURL?: InputVariable;
}

export interface StaticApiCustom {
	data: ConfigurationVariable;
}

export interface RESTApiCustom {
	Fetch: FetchConfiguration;
	Subscription: SubscriptionConfiguration;
	DefaultTypeName: string;
	StatusCodeTypeMappings: StatusCodeTypeMapping[];
}

export interface DatabaseApiCustom {
	prisma_schema: string;
	graphql_schema: string;
	databaseURL: ConfigurationVariable;
	jsonTypeFields: SingleTypeField[];
	jsonInputVariables: string[];
}

export interface SubscriptionConfiguration {
	Enabled: boolean;
	PollingIntervalMillis?: number;
	SkipPublishSameResponse?: boolean;
}

export interface GraphQLApiCustom {
	Federation: {
		Enabled: boolean;
		ServiceSDL: string;
	};
	Fetch: FetchConfiguration;
	Subscription: {
		Enabled: boolean;
		URL: ConfigurationVariable;
	};
	UpstreamSchema: string;
}

export interface GraphQLServerConfiguration extends Omit<GraphQLIntrospection, 'loadSchemaFromString'> {
	schema: GraphQLSchema | Promise<GraphQLSchema>;
}

const databaseSchemaToKind = (schema: DatabaseSchema): DataSourceKind => {
	switch (schema) {
		case 'planetscale':
			return DataSourceKind.MYSQL;
		case 'mysql':
			return DataSourceKind.MYSQL;
		case 'postgresql':
			return DataSourceKind.POSTGRESQL;
		case 'sqlite':
			return DataSourceKind.SQLITE;
		case 'sqlserver':
			return DataSourceKind.SQLSERVER;
		case 'mongodb':
			return DataSourceKind.MONGODB;
		default:
			throw new Error(`databaseSchemaToKind not implemented for: ${schema}`);
	}
};

const introspectDatabase = async (
	introspection: DatabaseIntrospection,
	databaseSchema: DatabaseSchema,
	maxRetries: number
) => {
	const {
		success,
		message,
		graphql_schema,
		prisma_schema,
		interpolateVariableDefinitionAsJSON,
		jsonTypeFields,
		jsonResponseFields,
	} = await introspectPrismaDatabaseWithRetries(introspection, databaseSchema, maxRetries);
	if (!success) {
		return Promise.reject(message);
	}
	const schemaDocumentNode = parse(graphql_schema);
	const schema = print(schemaDocumentNode);
	const { RootNodes, ChildNodes, Fields } = configuration(schemaDocumentNode);
	const jsonFields = [...jsonTypeFields, ...jsonResponseFields];
	jsonFields.forEach((field) => {
		const fieldConfig = Fields.find((f) => f.typeName == field.typeName && f.fieldName == field.fieldName);
		if (fieldConfig) {
			fieldConfig.unescapeResponseJson = true;
		} else {
			Fields.push({
				fieldName: field.fieldName,
				typeName: field.typeName,
				unescapeResponseJson: true,
				argumentsConfiguration: [],
				path: [],
				requiresFields: [],
				disableDefaultFieldMapping: false,
			});
		}
	});
	const graphQLSchema = buildSchema(schema);
	const dataSource: DataSource<DatabaseApiCustom> = {
		Kind: databaseSchemaToKind(databaseSchema),
		RootNodes: applyNameSpaceToTypeFields(RootNodes, graphQLSchema, introspection.apiNamespace),
		ChildNodes: applyNameSpaceToTypeFields(ChildNodes, graphQLSchema, introspection.apiNamespace),
		Custom: {
			prisma_schema: prisma_schema,
			databaseURL: mapInputVariable(introspection.databaseURL),
			graphql_schema: schema,
			jsonTypeFields: applyNameSpaceToSingleTypeFields(jsonTypeFields, introspection.apiNamespace),
			jsonInputVariables: applyNameSpaceToTypeNames(interpolateVariableDefinitionAsJSON, introspection.apiNamespace),
		},
		Directives: [],
	};
	const dataSources: DataSource<DatabaseApiCustom>[] = [];
	dataSource.RootNodes.forEach((rootNode) => {
		rootNode.fieldNames.forEach((field) => {
			dataSources.push({
				...Object.assign({}, dataSource),
				RootNodes: [
					{
						typeName: rootNode.typeName,
						fieldNames: [field],
					},
				],
			});
		});
	});
	return {
		schema: applyNameSpaceToGraphQLSchema(schema, [], introspection.apiNamespace),
		dataSources: dataSources,
		fields: applyNameSpaceToFieldConfigurations(Fields, graphQLSchema, [], introspection.apiNamespace),
		types: generateTypeConfigurationsForNamespace(schema, introspection.apiNamespace),
		interpolateVariableDefinitionAsJSON: applyNameSpaceToTypeNames(
			interpolateVariableDefinitionAsJSON,
			introspection.apiNamespace
		),
	};
};

const applyNameSpaceToSingleTypeFields = (typeFields: SingleTypeField[], namespace?: string): SingleTypeField[] => {
	if (!namespace) {
		return typeFields;
	}
	return typeFields.map((typeField) => ({
		...typeField,
		typeName: `${namespace}_${typeField.typeName}`,
	}));
};

const applyNameSpaceToTypeNames = (typeNames: string[], namespace?: string): string[] => {
	if (!namespace) {
		return typeNames;
	}
	return typeNames.map((typeName) => {
		return `${namespace}_${typeName}`;
	});
};

export const introspectGraphqlServer = async (introspection: GraphQLServerConfiguration): Promise<GraphQLApi> => {
	const { schema, ...rest } = introspection;
	const resolvedSchema = (await schema) as GraphQLSchema;

	return introspect.graphql({
		...rest,
		internal: true,
		loadSchemaFromString: () => printSchema(buildClientSchema(introspectionFromSchema(resolvedSchema))),
	});
};

const introspectWithCache = async <Introspection extends IntrospectionConfiguration, Api>(
	introspection: Introspection,
	generator: (introspection: Introspection) => Promise<Api>
): Promise<Api> => {
	if (
		DataSourcePollingModeEnabled &&
		introspection.introspection?.pollingIntervalSeconds !== undefined &&
		introspection.introspection?.pollingIntervalSeconds > 0
	) {
		introspectAfterTimeout(introspection, generator).catch((e) => console.error(e));
		return Promise.resolve({} as Api);
	}
	if (introspection.introspection?.disableCache === true) {
		return generator(introspection);
	}
	const cacheKey = objectHash(introspection);
	const cacheDirectory = path.join('generated', 'introspection', 'cache');
	if (!fs.existsSync(cacheDirectory)) {
		fs.mkdirSync(cacheDirectory, { recursive: true });
	}
	const cacheFile = path.join('generated', 'introspection', 'cache', `${cacheKey}.json`);
	if (fs.existsSync(cacheFile)) {
		return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
	}
	const result = await generator(introspection);
	fs.writeFileSync(cacheFile, JSON.stringify(result));
	return result;
};

const updateIntrospectionCache = async <Introspection extends IntrospectionConfiguration, Api>(
	introspection: Introspection,
	generator: (introspection: Introspection) => Promise<Api>
) => {
	console.log(`Updating introspection cache`);
	const cacheKey = objectHash(introspection);
	const cacheDirectory = path.join('generated', 'introspection', 'cache');
	if (!fs.existsSync(cacheDirectory)) {
		fs.mkdirSync(cacheDirectory, { recursive: true });
	}
	const cacheFile = path.join('generated', 'introspection', 'cache', `${cacheKey}.json`);
	const actual = JSON.stringify(await generator(introspection));
	if (fs.existsSync(cacheFile)) {
		const existing = fs.readFileSync(cacheFile, 'utf8');
		if (actual === existing) {
			console.log(`Updating introspection cache - no change`);
			return;
		}
	}
	console.log(`Updating introspection cache - writing new cache file`);
	fs.writeFileSync(cacheFile, actual);
};

const introspectAfterTimeout = async <Introspection extends IntrospectionConfiguration, Api>(
	introspection: Introspection,
	generator: (introspection: Introspection) => Promise<Api>
) => {
	setTimeout(async () => {
		try {
			await updateIntrospectionCache(introspection, generator);
		} catch (e) {
			console.error('Error during introspection cache update', e);
		}
		introspectAfterTimeout(introspection, generator).catch((e) => console.error('Error during polling', e));
	}, introspection.introspection!.pollingIntervalSeconds! * 1000);
};

export const introspect = {
	graphql: async (introspection: GraphQLIntrospection): Promise<GraphQLApi> => {
		return introspectWithCache(introspection, async (introspection: GraphQLIntrospection): Promise<GraphQLApi> => {
			const headers: { [key: string]: HTTPHeader } = {};
			introspection.headers !== undefined &&
				(introspection.headers(new HeadersBuilder()) as HeadersBuilder).build().forEach((config) => {
					const values: ConfigurationVariable[] = [];
					switch (config.valueSource) {
						case 'placeholder':
							values.push({
								kind: ConfigurationVariableKind.PLACEHOLDER_CONFIGURATION_VARIABLE,
								staticVariableContent: '',
								environmentVariableDefaultValue: '',
								environmentVariableName: '',
								placeholderVariableName: config.value,
							});
							break;
						case 'clientRequest':
							values.push({
								kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
								staticVariableContent: `{{ .request.headers.${config.value} }}`,
								environmentVariableName: '',
								environmentVariableDefaultValue: '',
								placeholderVariableName: '',
							});
							break;
						case 'static':
							values.push({
								kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
								staticVariableContent: config.value,
								environmentVariableDefaultValue: '',
								environmentVariableName: '',
								placeholderVariableName: '',
							});
							break;
						case 'env':
							values.push({
								kind: ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE,
								staticVariableContent: '',
								environmentVariableDefaultValue: config.defaultValue || '',
								environmentVariableName: config.value,
								placeholderVariableName: '',
							});
							break;
					}
					headers[config.key] = {
						values,
					};
				});
			const schema = await introspectGraphQLSchema(introspection, headers);
			const federationEnabled = isFederationService(schema);
			const schemaSDL = cleanupSchema(
				schema,
				introspection.customFloatScalars || [],
				introspection.customIntScalars || []
			);
			const serviceSDL = !federationEnabled
				? undefined
				: await federationServiceSDL(resolveVariable(introspection.url));
			const serviceDocumentNode = serviceSDL !== undefined ? parse(serviceSDL) : undefined;
			const schemaDocumentNode = parse(schemaSDL);
			const graphQLSchema = buildSchema(schemaSDL);
			const { RootNodes, ChildNodes, Fields } = configuration(schemaDocumentNode, serviceDocumentNode);
			const subscriptionsEnabled = hasSubscriptions(schema);
			if (introspection.internal === true) {
				headers['X-WG-Internal-GraphQL-API'] = {
					values: [
						{
							kind: ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE,
							staticVariableContent: 'true',
							environmentVariableName: '',
							environmentVariableDefaultValue: '',
							placeholderVariableName: '',
						},
					],
				};
			}
			return new GraphQLApi(
				applyNameSpaceToGraphQLSchema(schemaSDL, introspection.skipRenameRootFields || [], introspection.apiNamespace),
				[
					{
						Kind: DataSourceKind.GRAPHQL,
						RootNodes: applyNameSpaceToTypeFields(RootNodes, graphQLSchema, introspection.apiNamespace),
						ChildNodes: applyNameSpaceToTypeFields(ChildNodes, graphQLSchema, introspection.apiNamespace),
						Custom: {
							Fetch: {
								url: mapInputVariable(introspection.url),
								baseUrl: mapInputVariable(''),
								path: mapInputVariable(''),
								method: HTTPMethod.POST,
								body: mapInputVariable(''),
								header: headers,
								query: [],
								upstreamAuthentication: buildUpstreamAuthentication(introspection),
								mTLS: buildMTLSConfiguration(introspection),
								urlEncodeBody: false,
							},
							Subscription: {
								Enabled: subscriptionsEnabled,
								URL:
									introspection.subscriptionsURL !== undefined
										? mapInputVariable(introspection.subscriptionsURL)
										: typeof introspection.url === 'string'
										? mapInputVariable(subscriptionsURL(introspection.url))
										: mapInputVariable(''),
							},
							Federation: {
								Enabled: federationEnabled,
								ServiceSDL: serviceSDL || '',
							},
							UpstreamSchema: schemaSDL,
						},
						Directives: applyNamespaceToDirectiveConfiguration(schema, introspection.apiNamespace),
					},
				],
				applyNameSpaceToFieldConfigurations(
					Fields,
					graphQLSchema,
					introspection.skipRenameRootFields || [],
					introspection.apiNamespace
				),
				generateTypeConfigurationsForNamespace(schemaSDL, introspection.apiNamespace),
				[]
			);
		});
	},
	postgresql: async (introspection: DatabaseIntrospection): Promise<PostgresqlApi> =>
		introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<PostgresqlApi> => {
			const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
				introspection,
				'postgresql',
				5
			);
			return new PostgresqlApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
		}),
	mysql: async (introspection: DatabaseIntrospection): Promise<MySQLApi> =>
		introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<MySQLApi> => {
			const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
				introspection,
				'mysql',
				5
			);
			return new MySQLApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
		}),
	planetscale: async (introspection: DatabaseIntrospection): Promise<PlanetscaleApi> =>
		introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<PlanetscaleApi> => {
			const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
				introspection,
				'planetscale',
				5
			);
			return new PlanetscaleApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
		}),
	sqlite: async (introspection: DatabaseIntrospection): Promise<SQLiteApi> =>
		introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<SQLiteApi> => {
			const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
				introspection,
				'sqlite',
				5
			);
			return new SQLiteApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
		}),
	sqlserver: async (introspection: DatabaseIntrospection): Promise<SQLServerApi> =>
		introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<SQLServerApi> => {
			const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
				introspection,
				'sqlserver',
				5
			);
			return new SQLServerApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
		}),
	mongodb: async (introspection: DatabaseIntrospection): Promise<MongoDBApi> =>
		introspectWithCache(introspection, async (introspection: DatabaseIntrospection): Promise<MongoDBApi> => {
			const { schema, fields, types, dataSources, interpolateVariableDefinitionAsJSON } = await introspectDatabase(
				introspection,
				'mongodb',
				5
			);
			return new MongoDBApi(schema, dataSources, fields, types, interpolateVariableDefinitionAsJSON);
		}),
	federation: async (introspection: GraphQLFederationIntrospection): Promise<GraphQLApi> =>
		introspectWithCache(introspection, async (introspection: GraphQLFederationIntrospection): Promise<GraphQLApi> => {
			const upstreams = introspection.upstreams.map(async (upstream, i) => {
				let schema = upstream.loadSchemaFromString ? loadFile(upstream.loadSchemaFromString) : '';

				const name = upstream.name ?? i.toString();

				if (schema === '' && upstream.url) {
					schema = await federationServiceSDL(resolveVariable(upstream.url));
				}

				if (schema == '') {
					throw new Error(`Subgraph ${name} has not provided a schema`);
				}

				return {
					name,
					typeDefs: parse(schema),
				};
			});
			const serviceList: ServiceDefinition[] = await Promise.all(upstreams);
			const compositionResult = composeServices(serviceList);
			const errors = compositionResult.errors;

			if (errors && errors?.length > 0) {
				console.log(
					`\nService composition of federated subgraph failed:\n\n${errors[0]}\n\nMake sure all subgraphs can be composed to a supergaph.\n\n`
				);
				process.exit(1);
			}

			const graphQLIntrospections: GraphQLIntrospection[] = introspection.upstreams.map((upstream) => ({
				isFederation: true,
				url: upstream.url,
				headers: upstream.headers,
				apiNamespace: introspection.apiNamespace,
				loadSchemaFromString: upstream.loadSchemaFromString,
			}));

			const apis = await Promise.all(graphQLIntrospections.map((i) => introspect.graphql(i)));
			return mergeApis([], ...apis) as GraphQLApi;
		}),
	openApi: async (introspection: OpenAPIIntrospection): Promise<RESTApi> =>
		introspectWithCache(introspection, async (introspection: OpenAPIIntrospection): Promise<RESTApi> => {
			const spec = loadOpenApi(introspection);
			return await openApiSpecificationToRESTApiObject(spec, introspection);
		}),
};

const introspectGraphQLSchema = async (introspection: GraphQLIntrospection, headers: { [key: string]: HTTPHeader }) => {
	if (introspection.loadSchemaFromString) {
		try {
			if (introspection.isFederation) {
				return buildSubgraphSchema(parse(loadFile(introspection.loadSchemaFromString)));
			}
			return buildSchema(loadFile(introspection.loadSchemaFromString));
		} catch (e: any) {
			console.log(
				`\nLoading schema from string failed for apiNamespace ${introspection.apiNamespace}:\n\n${e}\n\nMake sure the schema is valid and try again.\n\n`
			);
			process.exit(1);
		}
	}
	try {
		return introspectGraphQLAPI(introspection, headers);
	} catch (e: any) {
		console.log(`\nIntrospecting GraphQL API failed for apiNamespace ${introspection.apiNamespace}:\n\n${e}\n\n`);
		process.exit(1);
	}
};

export const buildUpstreamAuthentication = (upstream: HTTPUpstream): UpstreamAuthentication | undefined => {
	if (upstream.authentication === undefined) {
		return undefined;
	}
	return {
		kind: upstreamAuthenticationKind(upstream.authentication.kind),
		jwtConfig:
			upstream.authentication.kind === 'jwt'
				? {
						secret: mapInputVariable(upstream.authentication.secret),
						signingMethod: upstreamAuthenticationSigningMethod(upstream.authentication.signingMethod),
				  }
				: undefined,
		jwtWithAccessTokenExchangeConfig:
			upstream.authentication.kind === 'jwt_with_access_token_exchange'
				? {
						accessTokenExchangeEndpoint: mapInputVariable(upstream.authentication.accessTokenExchangeEndpoint),
						secret: mapInputVariable(upstream.authentication.secret),
						signingMethod: upstreamAuthenticationSigningMethod(upstream.authentication.signingMethod),
				  }
				: undefined,
	};
};

export const buildMTLSConfiguration = (upstream: HTTPUpstream): MTLSConfiguration | undefined => {
	if (upstream.mTLS === undefined) {
		return undefined;
	}
	return {
		key: mapInputVariable(upstream.mTLS?.key || ''),
		cert: mapInputVariable(upstream.mTLS?.cert || ''),
		insecureSkipVerify: upstream.mTLS?.insecureSkipVerify || false,
	};
};

const upstreamAuthenticationSigningMethod = (signingMethod: JWTSigningMethod): SigningMethod => {
	switch (signingMethod) {
		case 'HS256':
			return SigningMethod.SigningMethodHS256;
		default:
			throw new Error(`JWT signing method unsupported: ${signingMethod}`);
	}
};

const upstreamAuthenticationKind = (kind: HTTPUpstreamAuthentication['kind']): UpstreamAuthenticationKind => {
	switch (kind) {
		case 'jwt':
			return UpstreamAuthenticationKind.UpstreamAuthenticationJWT;
		case 'jwt_with_access_token_exchange':
			return UpstreamAuthenticationKind.UpstreamAuthenticationJWTWithAccessTokenExchange;
		default:
			throw new Error(`upstreamAuthenticationKind, unsupported kind: ${kind}`);
	}
};

const introspectGraphQLAPI = async (
	introspection: GraphQLIntrospection,
	headers?: { [key: string]: HTTPHeader }
): Promise<GraphQLSchema> => {
	const data = JSON.stringify({
		query: getIntrospectionQuery(),
		operationName: 'IntrospectionQuery',
	});
	const baseHeaders: Record<string, string> = {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	};
	if (headers !== undefined) {
		Object.keys(headers).forEach((key) => {
			if (headers[key].values.length === 1) {
				switch (headers[key].values[0].kind) {
					case ConfigurationVariableKind.STATIC_CONFIGURATION_VARIABLE:
						baseHeaders[key] = headers[key].values[0].staticVariableContent;
						break;
					case ConfigurationVariableKind.ENV_CONFIGURATION_VARIABLE:
						if (process.env[headers[key].values[0].environmentVariableName] !== undefined) {
							baseHeaders[key] = process.env[headers[key].values[0].environmentVariableName]!;
						} else if (headers[key].values[0].environmentVariableDefaultValue !== undefined) {
							baseHeaders[key] = headers[key].values[0].environmentVariableDefaultValue;
						}
						break;
				}
			}
		});
	}

	const opts: AxiosRequestConfig = {
		headers: baseHeaders,
	};

	if (introspection.mTLS) {
		opts.httpsAgent = new https.Agent({
			key: resolveVariable(introspection.mTLS.key),
			cert: resolveVariable(introspection.mTLS.cert),
			rejectUnauthorized: !introspection.mTLS.insecureSkipVerify,
		});
	}

	// TODO single place where a HTTP client is configured for all data sources
	let res: AxiosResponse | undefined;
	try {
		res = await axios.post(resolveVariable(introspection.url), data, opts);
	} catch (e: any) {
		console.log(
			`introspection failed (url: ${introspection.url}, namespace: ${introspection.apiNamespace || ''}), error: ${
				e.message
			}`
		);
		process.exit(1);
	}
	if (res === undefined) {
		console.log(
			"introspection failed (url: ${introspection.url}, namespace: ${introspection.apiNamespace || ''}), no response"
		);
		process.exit(1);
	}
	if (res.status !== 200) {
		console.log(
			`introspection failed (url: ${introspection.url}, namespace: ${
				introspection.apiNamespace || ''
			}), response code: ${res.status}, message: ${res.statusText}`
		);
		process.exit(1);
	}
	return buildClientSchema(res.data.data);
};

const loadOpenApi = (introspection: OpenAPIIntrospection): string => {
	switch (introspection.source.kind) {
		case 'file':
			const filePath = path.resolve(process.cwd(), introspection.source.filePath);
			return fs.readFileSync(filePath).toString();
		case 'object':
			return JSON.stringify(introspection.source.openAPIObject);
		case 'string':
			return introspection.source.openAPISpec;
		default:
			return '';
	}
};

const hasSubscriptions = (schema: GraphQLSchema): boolean => {
	const subscriptionType = schema.getSubscriptionType();
	if (!subscriptionType) {
		return false;
	}
	const fields = subscriptionType.getFields();
	return Object.keys(fields).length !== 0;
};

const subscriptionsURL = (url: string) => url.replace('https://', 'wss://').replace('http://', 'ws://');
