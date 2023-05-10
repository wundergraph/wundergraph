import { buildClientSchema, GraphQLSchema, introspectionFromSchema, parse, print, printSchema } from 'graphql';
import { renameTypeFields, renameTypes } from '../graphql/renametypes';
import {
	ArgumentSource,
	ConfigurationVariable,
	DataSourceKind,
	DirectiveConfiguration,
	FetchConfiguration,
	FieldConfiguration,
	GraphQLDataSourceHooksConfiguration,
	MTLSConfiguration,
	SigningMethod,
	SingleTypeField,
	StatusCodeTypeMapping,
	TypeConfiguration,
	TypeField,
	UpstreamAuthentication,
	UpstreamAuthenticationKind,
} from '@wundergraph/protobuf';
import { applyNameSpaceToGraphQLSchema } from './namespacing';
import { InputVariable, mapInputVariable } from '../configure/variables';
import { introspectGraphqlWithCache } from './graphql-introspection';
import { introspectFederation } from './federation-introspection';
import { IGraphqlIntrospectionHeadersBuilder, IHeadersBuilder } from './headers-builder';
import { introspectOpenApi, introspectOpenApiV2 } from './openapi-introspection';
import {
	introspectMongoDB,
	introspectMySQL,
	introspectPlanetScale,
	introspectPostgresql,
	introspectPrisma,
	introspectSQLite,
	introspectSQLServer,
} from './database-introspection';
import { introspectSoap } from './soap-introspection';

// Use UPPERCASE for environment variables
export const WG_DATA_SOURCE_POLLING_MODE = process.env['WG_DATA_SOURCE_POLLING_MODE'] === 'true';
export const WG_ENABLE_INTROSPECTION_CACHE = process.env['WG_ENABLE_INTROSPECTION_CACHE'] === 'true';
export const WG_INTROSPECTION_CACHE_SKIP = process.env['WG_INTROSPECTION_CACHE_SKIP'] === 'true';
// Only use the introspection cache, return an error when hitting the network
export const WG_ENABLE_INTROSPECTION_OFFLINE = process.env['WG_ENABLE_INTROSPECTION_OFFLINE'] === 'true';

export const WG_PRETTY_GRAPHQL_VALIDATION_ERRORS = process.env['WG_PRETTY_GRAPHQL_VALIDATION_ERRORS'] === 'true';
// Default polling interval for data sources without one
export const WG_DATA_SOURCE_DEFAULT_POLLING_INTERVAL_SECONDS = (() => {
	const seconds = parseInt(process.env['WG_DATA_SOURCE_DEFAULT_POLLING_INTERVAL_SECONDS'] ?? '', 10);
	return isNaN(seconds) ? 0 : seconds;
})();

/**
 * ApiIntrospectionOptions contains options that are passed to
 * all ApiIntrospector<T> functions
 */
export interface ApiIntrospectionOptions {
	/**
	 * Global proxy URL, which might be overridden at the data source level
	 */
	httpProxyUrl?: string;
	apiID?: string;
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

export type ApiType = GraphQLApiCustom | RESTApiCustom | DatabaseApiCustom;

export class Api<T = ApiType> implements RenameTypes, RenameTypeFields {
	constructor(
		schema: string,
		namespace: string,
		dataSources: DataSource<T>[],
		fields: FieldConfiguration[],
		types: TypeConfiguration[],
		interpolateVariableDefinitionAsJSON: string[],
		customJsonScalars?: string[]
	) {
		this.Schema = schema;
		this.Namespace = namespace;
		this.DataSources = dataSources;
		this.Fields = fields;
		this.Types = types;
		this.interpolateVariableDefinitionAsJSON = interpolateVariableDefinitionAsJSON;
		this.CustomJsonScalars = customJsonScalars;
	}

	DefaultFlushInterval: number = 500;
	Schema: string;
	DataSources: DataSource<T>[];
	Fields: FieldConfiguration[];
	Types: TypeConfiguration[];
	interpolateVariableDefinitionAsJSON: string[];
	CustomJsonScalars?: string[];
	Namespace: string;

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
	return new GraphQLApi(applyNameSpaceToGraphQLSchema(schema, [], apiNamespace), apiNamespace || '', [], [], [], []);
};

export class GraphQLApi extends Api<GraphQLApiCustom> {}

export class RESTApi extends Api<RESTApiCustom> {}

export class PostgresqlApi extends Api<DatabaseApiCustom> {}

export class MySQLApi extends Api<DatabaseApiCustom> {}

export class PlanetscaleApi extends Api<DatabaseApiCustom> {}

export class SQLiteApi extends Api<DatabaseApiCustom> {}

export class SQLServerApi extends Api<DatabaseApiCustom> {}

export class MongoDBApi extends Api<DatabaseApiCustom> {}

export class PrismaApi extends Api<DatabaseApiCustom> {}

export interface DataSource<Custom = unknown> {
	Id?: string;
	Kind: DataSourceKind;
	RootNodes: TypeField[];
	ChildNodes: TypeField[];
	Custom: Custom;
	Directives: DirectiveConfiguration[];
	RequestTimeoutSeconds: number;
}

interface GraphQLIntrospectionOptions {
	// loadSchemaFromString allows you to skip the introspection process and load the GraphQL Schema from a string instead
	// this way, you can import a GraphQL Schema file or load the Schema in more flexible ways than relying on sending a GraphQL Introspection Query
	loadSchemaFromString?: string | (() => string);
	customFloatScalars?: string[];
	customIntScalars?: string[];
	customJSONScalars?: string[];
	// switching internal to true will mark the origin as an internal GraphQL API
	// this will forward the original request and user info to the internal upstream
	// so that the request context can be enriched
	internal?: boolean;
	skipRenameRootFields?: string[];
	// the schemaExtension field is used to extend the generated GraphQL schema with additional types and fields
	// this is useful for specifying type definitions for JSON objects
	schemaExtension?: string;
	replaceCustomScalarTypeFields?: ReplaceCustomScalarTypeFieldConfiguration[];
}

export interface GraphQLIntrospection extends GraphQLUpstream, GraphQLIntrospectionOptions {
	isFederation?: boolean;
}

export interface GraphQLFederationUpstream extends Omit<Omit<GraphQLUpstream, 'introspection'>, 'apiNamespace'> {
	name?: string;
	loadSchemaFromString?: GraphQLIntrospectionOptions['loadSchemaFromString'];
	introspection?: IntrospectionFetchOptions & GraphqlIntrospectionHeaders;
}

export interface GraphQLFederationIntrospection extends IntrospectionConfiguration {
	upstreams: GraphQLFederationUpstream[];
	apiNamespace?: string;
}

export interface ReplaceCustomScalarTypeFieldConfiguration {
	entityName: string;
	fieldName: string;
	inputTypeReplacement?: string;
	responseTypeReplacement: string;
}

export interface DatabaseIntrospection extends IntrospectionConfiguration {
	databaseURL: InputVariable;
	apiNamespace?: string;
	// the schemaExtension field is used to extend the generated GraphQL schema with additional types and fields
	// this is useful for specifying type definitions for JSON objects
	schemaExtension?: string;
	replaceCustomScalarTypeFields?: ReplaceCustomScalarTypeFieldConfiguration[];
}

export interface PrismaIntrospection extends IntrospectionConfiguration {
	prismaFilePath: string;
	apiNamespace?: string;
	// the schemaExtension field is used to extend the generated GraphQL schema with additional types and fields
	// this is useful for specifying type definitions for JSON objects
	schemaExtension?: string;
	replaceCustomScalarTypeFields?: ReplaceCustomScalarTypeFieldConfiguration[];
}

export interface IntrospectionFetchOptions {
	disableCache?: boolean;
	pollingIntervalSeconds?: number;
}

export interface IntrospectionConfiguration {
	// id is the unique identifier for the data source
	id?: string;
	/**
	 * Timeout for network requests originated by this data source, in seconds.
	 *
	 * @remarks
	 * See {@link NodeOptions| the NodeOptions type} for more details.
	 *
	 * @defaultValue Use the default timeout for this node.
	 */
	requestTimeoutSeconds?: number;
	introspection?: IntrospectionFetchOptions;
}

export interface HTTPUpstream extends IntrospectionConfiguration {
	apiNamespace?: string;
	headers?: (builder: IHeadersBuilder) => IHeadersBuilder;
	authentication?: HTTPUpstreamAuthentication;
	mTLS?: HTTPmTlsConfiguration;
	/** HTTP(S) proxy to use, overriding the default one. To disable a global proxy
	 * set its value to null.
	 *
	 * @defaultValue undefined, which uses the global proxy defined in configureWunderGraphApplication()
	 */
	httpProxyUrl?: InputVariable | null;
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

export interface GraphqlIntrospectionHeaders {
	headers?: (builder: IGraphqlIntrospectionHeadersBuilder) => IGraphqlIntrospectionHeadersBuilder;
}

export interface GraphQLUpstream extends HTTPUpstream {
	url: InputVariable;
	baseUrl?: InputVariable;
	path?: InputVariable;
	subscriptionsURL?: InputVariable;
	subscriptionsUseSSE?: boolean;
	introspection?: IntrospectionFetchOptions & GraphqlIntrospectionHeaders;
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

export interface OpenAPIIntrospection extends HTTPUpstream {
	source: OpenAPIIntrospectionSource;
	// statusCodeUnions set to true will make all responses return a union type of all possible response objects,
	// mapped by status code
	// by default, only the status 200 response is mapped, which keeps the GraphQL API flat
	// by enabling statusCodeUnions, you have to unwrap the response union via fragments for each response
	statusCodeUnions?: boolean;
	baseURL?: InputVariable;
	// the schemaExtension field is used to extend the generated GraphQL schema with additional types and fields
	// this is useful for specifying type definitions for JSON objects
	schemaExtension?: string;
	replaceCustomScalarTypeFields?: ReplaceCustomScalarTypeFieldConfiguration[];
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
		UseSSE: boolean;
	};
	UpstreamSchema: string;
	HooksConfiguration: GraphQLDataSourceHooksConfiguration;
	CustomScalarTypeFields: SingleTypeField[];
}

export interface GraphQLServerConfiguration extends Omit<GraphQLIntrospection, 'loadSchemaFromString'> {
	schema: GraphQLSchema | Promise<GraphQLSchema>;
}

export const introspectGraphqlServer = async (introspection: GraphQLServerConfiguration) => {
	const { schema, ...rest } = introspection;
	const resolvedSchema = (await schema) as GraphQLSchema;

	return introspectGraphqlWithCache({
		...rest,
		internal: true,
		loadSchemaFromString: () => printSchema(buildClientSchema(introspectionFromSchema(resolvedSchema))),
	});
};

export const introspect = {
	graphql: (introspection: Omit<GraphQLIntrospection, 'isFederation'>) => {
		return introspectGraphqlWithCache(introspection);
	},
	postgresql: introspectPostgresql,
	mysql: introspectMySQL,
	planetscale: introspectPlanetScale,
	sqlite: introspectSQLite,
	sqlserver: introspectSQLServer,
	mongodb: introspectMongoDB,
	prisma: introspectPrisma,
	federation: introspectFederation,
	openApi: introspectOpenApi,
	openApiV2: introspectOpenApiV2,
	soap: introspectSoap,
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
