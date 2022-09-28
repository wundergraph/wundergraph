import { GraphQLSchema } from 'graphql';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { GraphQLApi, GraphQLFederationIntrospection, GraphQLIntrospection } from './index';
import { loadFile } from '../codegen/templates/typescript';
import { resolveVariable } from '../configure/variables';
import { parse } from 'graphql/index';
import { ServiceDefinition } from '@apollo/federation';
import { composeServices } from '@apollo/composition';
import { mergeApis } from './merge';
import { introspectWithCache } from './introspection-cache';
import { introspectGraphql, resolveGraphqlIntrospectionHeaders } from './graphql-introspection';
import { mapHeaders, HeadersBuilder } from './headers-builder';

export const isFederationService = (schema: GraphQLSchema): boolean => {
	const queryType = schema.getQueryType();
	if (queryType === undefined || queryType === null) {
		return false;
	}
	const fields = queryType.getFields();
	if (fields === undefined) {
		return false;
	}
	return Object.keys(fields).indexOf('_service') !== -1;
};

export const fetchFederationServiceSDL = async (url: string, headers?: Record<string, string>): Promise<string> => {
	const data = JSON.stringify({
		query: '{_service{sdl}}',
	});

	let opts: AxiosRequestConfig = {
		headers,
	};

	let res: AxiosResponse | undefined;
	try {
		res = await axios.post(url, data, opts);
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

export const introspectFederation = async (introspection: GraphQLFederationIntrospection): Promise<GraphQLApi> =>
	introspectWithCache(introspection, async (introspection: GraphQLFederationIntrospection): Promise<GraphQLApi> => {
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

				schema = await fetchFederationServiceSDL(resolveVariable(upstream.url), introspectionHeaders);
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
			throw new Error(
				`Service composition of federated subgraph failed: ${errors[0]}. Make sure all subgraphs can be composed to a supergaph.`
			);
		}

		const graphQLIntrospections: GraphQLIntrospection[] = introspection.upstreams.map((upstream) => ({
			...upstream,
			isFederation: true,
			apiNamespace: introspection.apiNamespace,
		}));

		const apis = await Promise.all(graphQLIntrospections.map((i) => introspectGraphql(i)));
		return mergeApis([], ...apis) as GraphQLApi;
	});
