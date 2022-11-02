import { fetchFederationServiceSDL, isFederationService } from './federation-introspection';
import { configuration } from '../graphql/configuration';
import {
	buildClientSchema,
	buildSchema,
	getIntrospectionQuery,
	GraphQLSchema,
	parse,
	lexicographicSortSchema,
} from 'graphql';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConfigurationVariableKind, DataSourceKind, HTTPHeader, HTTPMethod } from '@wundergraph/protobuf';
import { cleanupSchema } from '../graphql/schema';
import {
	applyNamespaceToDirectiveConfiguration,
	applyNameSpaceToFieldConfigurations,
	applyNameSpaceToGraphQLSchema,
	applyNameSpaceToTypeFields,
	generateTypeConfigurationsForNamespace,
} from './namespacing';
import { loadFile } from '../codegen/templates/typescript';
import * as https from 'https';
import { introspectWithCache } from './introspection-cache';
import { mapInputVariable, resolveVariable } from '../configure/variables';
import { buildMTLSConfiguration, buildUpstreamAuthentication, GraphQLApi, GraphQLIntrospection } from './index';
import { HeadersBuilder, mapHeaders } from './headers-builder';
import { Fetcher } from './introspection-fetcher';
import { Logger } from '../logger';
import { buildSubgraphSchema } from '@apollo/federation';

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

export const introspectGraphql = async (introspection: GraphQLIntrospection): Promise<GraphQLApi> => {
	return introspectWithCache(introspection, async (introspection: GraphQLIntrospection): Promise<GraphQLApi> => {
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

		let schema = await introspectGraphQLSchema(introspection, introspectionHeaders);
		schema = lexicographicSortSchema(schema);
		const federationEnabled = isFederationService(schema);
		const schemaSDL = cleanupSchema(
			schema,
			introspection.customFloatScalars || [],
			introspection.customIntScalars || []
		);
		const serviceSDL = !federationEnabled
			? undefined
			: await fetchFederationServiceSDL(resolveVariable(introspection.url), introspectionHeaders, {
					apiNamespace: introspection.apiNamespace,
			  });
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
							UseSSE: introspection.subscriptionsUseSSE !== undefined ? introspection.subscriptionsUseSSE : false,
						},
						Federation: {
							Enabled: federationEnabled,
							ServiceSDL: serviceSDL || '',
						},
						UpstreamSchema: schemaSDL,
						HooksConfiguration: {
							onWSTransportConnectionInit: false,
						},
					},
					Directives: applyNamespaceToDirectiveConfiguration(schema, introspection.apiNamespace),
					RequestTimeoutSeconds: introspection.requestTimeoutSeconds ?? 0,
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
};

const introspectGraphQLSchema = async (introspection: GraphQLIntrospection, headers?: Record<string, string>) => {
	if (introspection.loadSchemaFromString) {
		try {
			if (introspection.isFederation) {
				const parsedSchema = parse(loadFile(introspection.loadSchemaFromString));
				const subgraphSchema = buildSubgraphSchema(parsedSchema);
				return subgraphSchema;
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
		'axios-retry': {
			onRetry: (retryCount: number, error: AxiosError, requestConfig: AxiosRequestConfig) => {
				let msg = `failed to run introspection query: method: ${requestConfig.method} url: ${requestConfig.url}`;
				if (introspection.apiNamespace) {
					msg += ` apiNamespace: ${introspection.apiNamespace}`;
				}
				msg += ` retryAttempt: ${retryCount}`;

				Logger.info(msg);
			},
		},
	};

	if (introspection.mTLS) {
		opts.httpsAgent = new https.Agent({
			key: resolveVariable(introspection.mTLS.key),
			cert: resolveVariable(introspection.mTLS.cert),
			rejectUnauthorized: !introspection.mTLS.insecureSkipVerify,
		});
	}

	let res: AxiosResponse | undefined;
	try {
		res = await Fetcher().post(resolveVariable(introspection.url), data, opts);
	} catch (e: any) {
		throw new Error(
			`introspection failed (url: ${introspection.url}, namespace: ${introspection.apiNamespace || ''}), error: ${
				e.message
			}`
		);
	}
	if (res === undefined) {
		throw new Error(
			`introspection failed (url: ${introspection.url}, namespace: ${introspection.apiNamespace || ''}), no response`
		);
	}
	if (res.status !== 200) {
		throw new Error(
			`introspection failed (url: ${introspection.url}, namespace: ${
				introspection.apiNamespace || ''
			}), response code: ${res.status}, message: ${res.statusText}`
		);
	}
	return buildClientSchema(res.data.data);
};

const hasSubscriptions = (schema: GraphQLSchema): boolean => {
	const subscriptionType = schema.getSubscriptionType();
	if (!subscriptionType) {
		return false;
	}
	const fields = subscriptionType.getFields();
	return Object.keys(fields).length !== 0;
};
