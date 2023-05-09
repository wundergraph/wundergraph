import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql';
import Fastify from 'fastify'; // yarn add fastify
import FastifyWebsocket from '@fastify/websocket'; // yarn add @fastify/websocket
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
fastify.register(FastifyWebsocket as any, {
	options: {
		handleProtocols: (protocols: string[], client: any) => {
			return 'graphql-transport-ws';
		},
	},
});

fastify.register(async (fastify) => {
	fastify.get('/graphql', { websocket: true }, makeHandler({ schema }));
	fastify.get('/health', async () => 'OK');
});

fastify.listen({ host: 'localhost', port: 4000 }, (err) => {
	if (err) {
		fastify.log.error(err);
		return process.exit(1);
	}
	console.log('Listening to port 4000');
});
