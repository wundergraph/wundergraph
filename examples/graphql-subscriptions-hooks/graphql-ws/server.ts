import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql';
import Fastify from 'fastify'; // yarn add fastify
import fastifyWebsocket from '@fastify/websocket'; // yarn add @fastify/websocket
import { makeHandler } from 'graphql-ws/lib/use/@fastify/websocket';

/**
 * Construct a GraphQL schema and define the necessary resolvers.
 *
 * type Query {
 *   hello: String
 * }
 * type Subscription {
 *   countdown(from: Int!): Int!
 * }
 */
export const schema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'Query',
		fields: {
			hello: {
				type: GraphQLString,
				resolve: () => 'world',
			},
		},
	}),
	subscription: new GraphQLObjectType({
		name: 'Subscription',
		fields: {
			countdown: {
				args: {
					from: { type: GraphQLInt },
				},
				type: GraphQLInt,
				subscribe: async function* (_, { from }) {
					for (let i = from; i >= 0; i--) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
						yield { countdown: i };
					}
				},
			},
		},
	}),
});

const fastify = Fastify();
fastify.register(fastifyWebsocket, {
	options: {
		handleProtocols: (protocols: string[], client: any) => {
			return 'graphql-transport-ws';
		},
	},
});

fastify.register(async (fastify) => {
	fastify.get('/graphql', { websocket: true }, makeHandler({ schema }));
});

fastify.listen(4000, 'localhost', (err) => {
	if (err) {
		fastify.log.error(err);
		return process.exit(1);
	}
	console.log('Listening to port 4000');
});
