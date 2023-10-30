import { FastifyPluginAsync } from 'fastify';
import { getGraphQLParameters, processRequest, sendResult } from 'graphql-helix';
import { buildSchema, GraphQLResolveInfo } from 'graphql/index';
import { fetch } from '@whatwg-node/fetch';
import { createExecutorFromSchemaAST } from '@omnigraph/soap';
import { MeshFetch } from '@graphql-mesh/types';
import { Agent } from 'https';
import { loggedFetch } from './fetch';

export interface SoapServerConfig {
	serverName: string;
	schema: string;
	mountPath: string;
	globalFetch: typeof fetch;
}

// fetchWithHeaders - wraps fetch function to pass headers from context to fetch options
const fetchWithHeaders =
	(fetchFn: MeshFetch) => (url: string, options?: RequestInit, context?: any, info?: GraphQLResolveInfo) => {
		/*
		 * temporary workaround to pass headers to fetch
		 * current drawback is that it will pass all headers from the wundernode request to the wundergraph server
		 * */

		const headers = {
			...context?.headers,
			...options?.headers,
		};

		// workaround to deal with https://github.com/node-fetch/node-fetch/discussions/1678
		delete headers.host;
		delete headers.referer;

		const opts = {
			...options,
			headers,
			agent: new Agent({ family: 4 }),
		};

		return fetchFn(url, opts, context, info);
	};

const FastifySoapGraphQLPlugin: FastifyPluginAsync<SoapServerConfig> = async (fastify, config) => {
	const schema = buildSchema(config.schema, {
		assumeValidSDL: true,
		assumeValid: true,
	});

	const fetchLogger = fastify.log.child({ type: 'SOAP' });
	const fetchFn = fetchWithHeaders(config.globalFetch);
	// prepare queries executor from schema with soap directives
	const executor = createExecutorFromSchemaAST(schema, loggedFetch(fetchLogger, fetchFn as typeof fetch));

	fastify.route({
		method: ['GET', 'POST'],
		url: config.mountPath,
		async handler(req, reply) {
			const request = {
				body: req.body,
				headers: req.headers,
				method: req.method,
				query: req.query,
			};

			reply.hijack();

			const { operationName, query, variables } = getGraphQLParameters(request);

			const result = await processRequest({
				operationName,
				query,
				variables,
				request,
				schema,
				contextFactory: () => ({
					headers: req.headers,
				}),

				execute: ({ document, contextValue, variableValues }) => {
					return executor({
						document: document,
						context: contextValue,
						variables: variableValues,
					});
				},
			});

			await sendResult(result, reply.raw);
		},
	});
};

export default FastifySoapGraphQLPlugin;
