import { GraphQLSchema, GraphQLObjectType, GraphQLString } from 'graphql';
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
 *   greetings: String
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
			greetings: {
				type: GraphQLString,
				subscribe: async function* () {
					for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
						yield { greetings: hi };
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

fastify.listen({ port: 4000, host: '127.0.0.1' }, (err) => {
	if (err) {
		fastify.log.error(err);
		return process.exit(1);
	}
	console.log('Listening on port 4000');
});
