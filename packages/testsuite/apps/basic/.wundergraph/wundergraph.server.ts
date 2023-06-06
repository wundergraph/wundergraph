import {
	CreateWebhookVerifier,
	EnvironmentVariable,
	WebhookVerifierKind,
	configureWunderGraphServer,
} from '@wundergraph/sdk/server';
import { GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql/index';
import { GraphQLExecutionContext } from './generated/wundergraph.server';
class GlobalContext {
	constructor() {
		console.log('create GlobalContext');
	}
	release() {
		console.log('release GlobalContext');
	}
	globalHello() {
		console.log('global hello');
	}
}

class RequestContext {
	constructor(private ctx?: GlobalContext) {}
	release() {}
	hello() {
		console.log('hello');
		return 'world';
	}
}

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			Schema_extensionsExtensionWithHook: {
				mutatingPostResolve: async ({ response, context }) => {
					console.log(`hello ${context.hello()}`);
					return {
						...response,
						data: {
							...response.data,
							spacex_capsule: {
								...response.data?.spacex_capsule,
								myCustomField: 'resolved by mutatingPostResolve hook',
							},
						},
					};
				},
			},
			CustomcontextGraphql: {
				mutatingPostResolve: async ({ context }) => {
					return {
						data: {
							embedded_fromCustomContext: `fromHook: ${context.hello()}`,
						},
					};
				},
			},
			RequestidGraphql: {
				mutatingPostResolve: async ({ clientRequest, response, log }) => {
					log.info('hello', { from: 'hook' });
					response.data!.requestId!.code = clientRequest.headers.get('X-Request-ID') || '';
					return response;
				},
			},
		},
		mutations: {},
	},
	context: {
		global: {
			create: async () => {
				return new GlobalContext();
			},
			release: async (ctx) => {
				ctx.release();
			},
		},
		request: {
			create: async (ctx) => {
				ctx.globalHello();
				return new RequestContext(ctx);
			},
			release: async (ctx) => {
				ctx.release();
			},
		},
	},
	graphqlServers: [
		{
			apiNamespace: 'embedded',
			serverName: 'embedded',
			schema: new GraphQLSchema({
				query: new GraphQLObjectType<any, GraphQLExecutionContext<RequestContext>>({
					name: 'Query',
					fields: {
						clientRequestHeader: {
							type: GraphQLString,
							args: {
								header: {
									type: new GraphQLNonNull(GraphQLString),
								},
							},
							resolve: async (parent, args, ctx) => {
								ctx.wundergraph.log.info('hello', { from: 'GraphQL server' });
								return ctx.wundergraph.clientRequest.headers.get(args.header);
							},
						},
						fromCustomContext: {
							type: GraphQLString,
							resolve: async (parent, args, ctx) => {
								return ctx.wundergraph.context.hello();
							},
						},
					},
				}),
				mutation: new GraphQLObjectType<any, any>({
					name: 'Mutation',
					fields: {
						setName: {
							type: GraphQLString,
							args: {
								name: {
									type: new GraphQLNonNull(GraphQLString),
								},
							},
							resolve: async (source, args, context, info) => {
								return args.name;
							},
						},
					},
				}),
			}),
		},
	],
	webhooks: {
		verified: {
			verifier: CreateWebhookVerifier({
				kind: WebhookVerifierKind.HMAC_SHA256,
				signatureHeaderPrefix: 'sha1=',
				secret: new EnvironmentVariable('WEBHOOK_SECRET'),
				signatureHeader: 'X-Signature',
			}),
		},
	},
}));
