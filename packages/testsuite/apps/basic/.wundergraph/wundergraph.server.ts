import { WunderGraphServerRequest, configureWunderGraphServer } from '@wundergraph/sdk/server';
import { GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql/index';
import { GraphQLExecutionContext } from './generated/wundergraph.server';

class MyCustomContext {
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
						data: context.hello(),
					};
				},
			},
		},
		mutations: {},
	},
	//createContext: async (): Promise<MyCustomContext> => {
	createContext: async (): Promise<MyCustomContext> => {
		return new MyCustomContext();
	},
	graphqlServers: [
		{
			apiNamespace: 'embedded',
			serverName: 'embedded',
			schema: new GraphQLSchema({
				query: new GraphQLObjectType<any, GraphQLExecutionContext<MyCustomContext>>({
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
			}),
		},
	],
}));
