import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import { GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql/index';
import { GraphQLExecutionContext } from './generated/wundergraph.server';

class CustomContext {
	hello() {
		console.log('hello');
		return 'world';
	}
}

const createContext = async (): Promise<CustomContext> => {
	return new CustomContext();
};

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			Schema_extensionsExtensionWithHook: {
				mutatingPostResolve: async ({ response }) => {
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
				mutatingPostResolve: async ({ context, response }) => {
					return {
						data: context.hello(),
					};
				},
			},
		},
		mutations: {},
	},
	context: createContext,
	graphqlServers: [
		{
			apiNamespace: 'embedded',
			serverName: 'embedded',
			schema: new GraphQLSchema({
				query: new GraphQLObjectType<any, GraphQLExecutionContext<CustomContext>>({
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
					},
				}),
			}),
		},
	],
}));
