import { ContextFactoryContext, configureWunderGraphServer } from '@wundergraph/sdk/server';
import { GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql/index';
import { GraphQLExecutionContext } from './generated/wundergraph.server';

class MyCustomContext {
	hello() {
		console.log('hello');
		return 'world';
	}
}

const myCreateContext = async (req: ContextFactoryContext) => {
	return new MyCustomContext();
};

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
			// CustomcontextGraphql: {
			// 	mutatingPostResolve: async ({ context }) => {
			// 		return {
			// 			data: context.hello(),
			// 		};
			// 	},
			// },
		},
		mutations: {},
	},
	// This works, declaring return type makes no difference
	createContext: async () => {
		return new MyCustomContext();
	},
	// This works
	//createContext: myCreateContext,
	// This does NOT work, regardless of the declared return type
	// unless we use configureWunderGraphServer<MyCustomContext>
	// createContext: async (req): Promise<MyCustomContext> => {
	// 	return new MyCustomContext();
	// },
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
