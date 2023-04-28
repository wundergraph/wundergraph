import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export class MyContext {
	greet() {
		console.log('say hello');
	}
}

export const makeContext = async () => {
	return new MyContext();
};

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {
			Countries: {
				preResolve: async ({ operations, context }) => {},
			},
		},
		mutations: {},
	},
	context: makeContext,
}));
