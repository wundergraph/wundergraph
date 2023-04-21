import { fetchFederationServiceSDL } from './federation-introspection';
import { configuration } from '../graphql/configuration';
import {
	buildClientSchema,
	buildSchema,
	DocumentNode,
	getIntrospectionQuery,
	GraphQLSchema,
	IntrospectionQuery,
	lexicographicSortSchema,
	ObjectTypeDefinitionNode,
	ObjectTypeExtensionNode,
	parse,
	print,
	printSchema,
} from 'graphql';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigurationVariableKind, DataSourceKind, HTTPHeader, HTTPMethod } from '@wundergraph/protobuf';
import { cleanupSchema } from '../graphql/schema';
import {
	applyNamespaceToDirectiveConfiguration,
	applyNameSpaceToFieldConfigurations,
	applyNameSpaceToGraphQLSchema,
	applyNameSpaceToSingleTypeFields,
	applyNameSpaceToTypeFields,
	generateTypeConfigurationsForNamespace,
} from './namespacing';
import { loadFile } from '../codegen/templates/typescript';
import * as https from 'https';
import { IntrospectionCacheConfiguration, introspectWithCache } from './introspection-cache';
import { mapInputVariable, resolveVariable } from '../configure/variables';
import { buildMTLSConfiguration, buildUpstreamAuthentication, GraphQLApi, GraphQLIntrospection } from './index';
import { HeadersBuilder, mapHeaders } from './headers-builder';
import { Fetcher } from './introspection-fetcher';
import { urlHash, urlIsLocalNetwork } from '../localcache';
import { Logger } from '../logger';
import { mergeSchemas } from '@graphql-tools/schema';
import transformSchema from '../transformations/transformSchema';
import { printSchemaWithDirectives } from '@graphql-tools/utils';

class MissingKeyError extends Error {
	constructor(private key: string, private introspection: GraphQLIntrospection) {
		super(`${key} is not defined in your ${introspection.apiNamespace} datasource`);
		Object.setPrototypeOf(this, MissingKeyError.prototype);
	}
}

export const resolveGraphqlIntrospectionHeaders = (headers?: { [key: string]: HTTPHeader }): Record<string, string> => {
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

	return baseHeaders;
};

export const graphqlIntrospectionCacheConfiguration = async (
	introspection: GraphQLIntrospection
): Promise<IntrospectionCacheConfiguration> => {
	if (introspection.loadSchemaFromString) {
		const schema = loadFile(introspection.loadSchemaFromString);
		if (schema) {
			return { keyInput: schema, dataSource: 'localFilesystem' };
		}
	}
	const url = resolveVariable(introspection.url);
	const baseUrl = introspection.baseUrl ? resolveVariable(introspection.baseUrl) : '';
	const path = introspection.path ? resolveVariable(introspection.path) : '';
	const hash = await urlHash(url);
	const dataSource = (await urlIsLocalNetwork(url)) ? 'localNetwork' : 'remote';
	const baseUrlHash = await urlHash(baseUrl + path);
	return { keyInput: hash + baseUrlHash, dataSource };
};

export const introspectGraphql = async (
	introspection: GraphQLIntrospection,
	openAPI?: boolean
): Promise<GraphQLApi> => {
	const headersBuilder = new HeadersBuilder();
	const introspectionHeadersBuilder = new HeadersBuilder();

	if (introspection.headers !== undefined) {
		introspection.headers(headersBuilder);
		introspection.headers(introspectionHeadersBuilder);
	}
	if (introspection.introspection?.headers !== undefined) {
		introspection.introspection?.headers(introspectionHeadersBuilder);
	}

	const headers = mapHeaders(headersBuilder);
	const introspectionHeaders = resolveGraphqlIntrospectionHeaders(mapHeaders(introspectionHeadersBuilder));

	let upstreamSchema = await introspectGraphQLSchema(introspection, introspectionHeaders);
	upstreamSchema = lexicographicSortSchema(upstreamSchema);
	const federationEnabled = introspection.isFederation || false;
	const cleanUpstreamSchema = openAPI ? printSchemaWithDirectives(upstreamSchema) : cleanupSchema(upstreamSchema);

	const { schemaSDL: schemaSDLWithCustomScalars, customScalarTypeFields } = transformSchema.replaceCustomScalars(
		cleanUpstreamSchema,
		introspection
	);

	const { schemaSDL, argumentReplacements } = transformSchema.replaceCustomNumericScalars(
		schemaSDLWithCustomScalars,
		introspection
	);

	let serviceSDL: string | undefined;
	if (federationEnabled) {
		if (introspection.loadSchemaFromString) {
			serviceSDL = loadFile(introspection.loadSchemaFromString);
		} else {
			if (!introspection.url) {
				throw new MissingKeyError('url', introspection);
			}
			serviceSDL = await fetchFederationServiceSDL(resolveVariable(introspection.url), introspectionHeaders, {
				apiNamespace: introspection.apiNamespace,
			});
		}
	}
	const serviceDocumentNode = serviceSDL !== undefined ? parse(serviceSDL) : undefined;
	const schemaDocumentNode = parse(schemaSDL);
	const graphQLSchema = buildSchema(schemaSDL);
	const { RootNodes, ChildNodes, Fields } = configuration(
		schemaDocumentNode,
		introspection.customJSONScalars,
		serviceDocumentNode,
		argumentReplacements
	);
	const subscriptionsEnabled = hasSubscriptions(upstreamSchema);
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
	const skipRenameRootFields = introspection.skipRenameRootFields || [];
	return new GraphQLApi(
		applyNameSpaceToGraphQLSchema(schemaSDL, skipRenameRootFields, introspection.apiNamespace),
		introspection.apiNamespace || '',
		[
			{
				Id: introspection.id,
				Kind: DataSourceKind.GRAPHQL,
				RootNodes: applyNameSpaceToTypeFields(RootNodes, graphQLSchema, introspection.apiNamespace),
				ChildNodes: applyNameSpaceToTypeFields(ChildNodes, graphQLSchema, introspection.apiNamespace),
				Custom: {
					Fetch: {
						url: mapInputVariable(introspection.url),
						baseUrl: introspection.baseUrl ? mapInputVariable(introspection.baseUrl) : mapInputVariable(''),
						path: introspection.path ? mapInputVariable(introspection.path) : mapInputVariable(''),
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
								? mapInputVariable(introspection.url)
								: mapInputVariable(''),
						UseSSE: introspection.subscriptionsUseSSE ?? false,
					},
					Federation: {
						Enabled: federationEnabled,
						ServiceSDL: serviceSDL || '',
					},
					UpstreamSchema: cleanUpstreamSchema,
					HooksConfiguration: {
						onWSTransportConnectionInit: false,
					},
					CustomScalarTypeFields: applyNameSpaceToSingleTypeFields(
						customScalarTypeFields,
						graphQLSchema,
						introspection.apiNamespace
					),
				},
				Directives: applyNamespaceToDirectiveConfiguration(upstreamSchema, introspection.apiNamespace),
				RequestTimeoutSeconds: introspection.requestTimeoutSeconds ?? 0,
			},
		],
		applyNameSpaceToFieldConfigurations(Fields, graphQLSchema, skipRenameRootFields, introspection.apiNamespace),
		generateTypeConfigurationsForNamespace(schemaSDL, introspection.apiNamespace),
		[],
		introspection.customJSONScalars
	);
};

export const introspectGraphqlWithCache = async (introspection: GraphQLIntrospection): Promise<GraphQLApi> => {
	const cacheConfig = await graphqlIntrospectionCacheConfiguration(introspection);
	return introspectWithCache(introspection, cacheConfig, introspectGraphql);
};

const introspectGraphQLSchema = async (introspection: GraphQLIntrospection, headers?: Record<string, string>) => {
	if (introspection.loadSchemaFromString) {
		try {
			if (introspection.isFederation) {
				const parsedSchema = parse(loadFile(introspection.loadSchemaFromString));
				return buildSubgraphSchema(parsedSchema);
			}
			return buildSchema(loadFile(introspection.loadSchemaFromString));
		} catch (e: any) {
			throw new Error(
				`Loading schema from string failed for apiNamespace '${introspection.apiNamespace}'. Make sure the schema is valid and try again: ${e}`
			);
		}
	}
	try {
		return introspectGraphQLAPI(introspection, headers);
	} catch (e: any) {
		throw new Error(`Introspecting GraphQL API failed for apiNamespace '${introspection.apiNamespace}': ${e}`);
	}
};

interface GraphQLErrorMessage {
	message: string;
}

interface GraphQLIntrospectionResponse {
	data?: IntrospectionQuery;
	errors?: GraphQLErrorMessage[];
}

const introspectGraphQLAPI = async (
	introspection: GraphQLIntrospection,
	headers?: Record<string, string>
): Promise<GraphQLSchema> => {
	const data = JSON.stringify({
		query: getIntrospectionQuery(),
		operationName: 'IntrospectionQuery',
	});

	let opts: AxiosRequestConfig = {
		headers: headers,
		// Prevent axios from running JSON.parse() for us
		transformResponse: (res) => res,
		'axios-retry': {
			onRetry: (retryCount: number, error: AxiosError, requestConfig: AxiosRequestConfig) => {
				let msg = `failed to run introspection query: method: ${requestConfig.method} url: ${requestConfig.url}`;
				if (introspection.apiNamespace) {
					msg += ` apiNamespace: ${introspection.apiNamespace}`;
				}
				msg += ` retryAttempt: ${retryCount}`;

				Logger.debug(msg);
			},
		},
	};

	if (introspection.mTLS) {
		if (!introspection.mTLS.key) {
			throw new MissingKeyError('mTLS.key', introspection);
		}
		if (!introspection.mTLS.cert) {
			throw new MissingKeyError('mTLS.cert', introspection);
		}
		opts.httpsAgent = new https.Agent({
			key: resolveVariable(introspection.mTLS.key),
			cert: resolveVariable(introspection.mTLS.cert),
			rejectUnauthorized: !introspection.mTLS.insecureSkipVerify,
		});
	}

	let res: AxiosResponse<string> | undefined;
	if (!introspection.url) {
		throw new MissingKeyError('url', introspection);
	}
	const url = resolveVariable(introspection.url);
	try {
		res = await Fetcher().post(url, data, opts);
	} catch (e: any) {
		throw new Error(
			`introspection failed (url: ${url}, namespace: ${introspection.apiNamespace || ''}), error: ${e.message}`
		);
	}
	if (res === undefined) {
		throw new Error(`introspection failed (url: ${url}, namespace: ${introspection.apiNamespace || ''}), no response`);
	}
	if (res.status !== 200) {
		throw new Error(
			`introspection failed (url: ${url}, namespace: ${introspection.apiNamespace || ''}), response code: ${
				res.status
			}, message: ${res.statusText}`
		);
	}
	let response: GraphQLIntrospectionResponse;
	try {
		response = JSON.parse(res.data) as GraphQLIntrospectionResponse;
	} catch (e: any) {
		throw new Error(`error decoding introspection data from ${url}: ${e}`);
	}
	if (response.errors) {
		throw new Error(`error introspecting ${url}: ${JSON.stringify(response.errors)}`);
	}
	if (!response.data) {
		throw new Error(`no errors, but empty data when introspecting ${url}`);
	}
	return buildClientSchema(response.data);
};

const hasSubscriptions = (schema: GraphQLSchema): boolean => {
	const subscriptionType = schema.getSubscriptionType();
	if (!subscriptionType) {
		return false;
	}
	const fields = subscriptionType.getFields();
	return Object.keys(fields).length !== 0;
};

const subgraphBaseSchema = `directive @key(fields: String!) on OBJECT | INTERFACE

directive @extends on OBJECT | INTERFACE

directive @external on OBJECT | FIELD_DEFINITION

directive @requires(fields: String!) on FIELD_DEFINITION

directive @provides(fields: String!) on FIELD_DEFINITION

type Query {
  _entities(representations: [_Any!]!): [_Entity]!
  _service: _Service!
}

scalar _Entity

scalar _Any

type _Service {
  """
  The sdl representing the federated service capabilities. Includes federation directives, removes federation types, and includes rest of full schema after schema directives have been applied
  """
  sdl: String
}`;

export const buildSubgraphSchema = (schema: DocumentNode): GraphQLSchema => {
	const entities = findEntityNames(schema);
	// union _Entity = User | Product
	const entityDefinition = entities.length > 0 ? `union _Entity = ${entities.join(' | ')}` : '';
	const subgraphSchema = print(schema);
	const merged = mergeSchemas({
		schemas: [
			buildSchema(subgraphSchema, { assumeValidSDL: true }),
			buildSchema(subgraphBaseSchema, { assumeValidSDL: true }),
		],
	});
	const withoutEntityUnion = printSchema(merged);
	const withEntityUnion = withoutEntityUnion.replace('scalar _Entity', entityDefinition);
	return lexicographicSortSchema(buildSchema(withEntityUnion, { assumeValidSDL: true }));
};

const findEntityNames = (schema: DocumentNode): string[] => {
	return schema.definitions
		.filter((node) => node.kind === 'ObjectTypeDefinition' || node.kind === 'ObjectTypeExtension')
		.filter((node) =>
			(node as ObjectTypeDefinitionNode | ObjectTypeExtensionNode).directives?.some(
				(directive) => directive.name.value === 'key'
			)
		)
		.map((node) => (node as ObjectTypeDefinitionNode | ObjectTypeExtensionNode).name.value);
};
