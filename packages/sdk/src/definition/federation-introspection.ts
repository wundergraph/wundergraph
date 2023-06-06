import { DocumentNode, parse } from 'graphql';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { GraphQLApi, GraphQLFederationIntrospection, GraphQLIntrospection, ApiIntrospectionOptions } from './index';
import { loadFile } from '../codegen/templates/typescript';
import { resolveVariable } from '../configure/variables';
import { mergeApis } from './merge';
import { introspectWithCache } from './introspection-cache';
import {
	graphqlIntrospectionCacheConfiguration,
	introspectGraphql,
	resolveGraphqlIntrospectionHeaders,
} from './graphql-introspection';
import { HeadersBuilder, mapHeaders } from './headers-builder';
import { Fetcher } from './introspection-fetcher';
import { Logger } from '../logger';

export const fetchFederationServiceSDL = async (
	url: string,
	headers?: Record<string, string>,
	meta?: { apiNamespace?: string; upstreamName?: string }
): Promise<string> => {
	const data = JSON.stringify({
		query: '{_service{sdl}}',
	});

	let opts: AxiosRequestConfig = {
		headers,
		'axios-retry': {
			onRetry: (retryCount: number, error: AxiosError, requestConfig: AxiosRequestConfig) => {
				let msg = `failed to fetch federation service sdl: ${requestConfig.method} url: ${requestConfig.url}`;
				if (meta?.apiNamespace) {
					msg += ` apiNamespace: ${meta.apiNamespace}`;
				}
				if (meta?.upstreamName) {
					msg += ` upstreamName: ${meta.upstreamName}`;
				}

				msg += ` retryAttempt: ${retryCount}`;

				Logger.info(msg);
			},
		},
	};

	let res: AxiosResponse | undefined;
	try {
		res = await Fetcher().post(url, data, opts);
	} catch (e: any) {
		throw new Error(`failed to fetch federation service sdl (url: ${url}), error: ${e.message}`);
	}
	if (res === undefined) {
		throw new Error(`failed to fetch federation service sdl (url: ${url}), no response`);
	}
	if (res.status !== 200) {
		throw new Error(
			`failed to fetch federation service sdl (url: ${url}), response code: ${res.status}, message: ${res.statusText}`
		);
	}

	return res.data.data._service.sdl;
};

export interface ServiceDefinition {
	typeDefs: DocumentNode;
	name: string;
}

export const introspectFederation = async (introspection: GraphQLFederationIntrospection) => {
	const keyInputs: string[] = [];
	introspection.upstreams.forEach(async (upstream) => {
		keyInputs.push(await (await graphqlIntrospectionCacheConfiguration(upstream)).keyInput);
	});
	const cacheConfig = { keyInput: keyInputs.join('') };
	return introspectWithCache(
		introspection,
		cacheConfig,
		async (introspection: GraphQLFederationIntrospection, options: ApiIntrospectionOptions): Promise<GraphQLApi> => {
			const upstreams = introspection.upstreams.map(async (upstream, i) => {
				let schema = upstream.loadSchemaFromString ? loadFile(upstream.loadSchemaFromString) : '';

				const name = upstream.name ?? i.toString();

				if (schema === '' && upstream.url) {
					const introspectionHeadersBuilder = new HeadersBuilder();

					if (upstream.headers !== undefined) {
						upstream.headers(introspectionHeadersBuilder);
					}

					if (upstream.introspection?.headers !== undefined) {
						upstream.introspection?.headers(introspectionHeadersBuilder);
					}
					const introspectionHeaders = resolveGraphqlIntrospectionHeaders(mapHeaders(introspectionHeadersBuilder));

					// upstream.url is truthy at this point, no need to check
					schema = await fetchFederationServiceSDL(resolveVariable(upstream.url), introspectionHeaders, {
						apiNamespace: introspection.apiNamespace,
						upstreamName: name,
					});
				}

				if (schema == '') {
					throw new Error(`Subgraph ${name} has not provided a schema`);
				}

				return {
					name,
					typeDefs: parse(schema),
				};
			});

			const graphQLIntrospections: GraphQLIntrospection[] = introspection.upstreams.map((upstream) => ({
				...upstream,
				apiNamespace: introspection.apiNamespace,
				id: upstream.id ?? introspection.id,
				isFederation: true,
			}));

			const apis = await Promise.all(graphQLIntrospections.map((i) => introspectGraphql(i, options)));
			const merged = mergeApis([], [], ...apis) as GraphQLApi;
			merged.Namespace = introspection.apiNamespace || '';
			return merged;
		}
	);
};
