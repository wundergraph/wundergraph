import { GraphQLSchema, GraphQLObjectType, GraphQLString } from 'graphql';
import { createHandler } from 'graphql-sse';
import Fastify from 'fastify';

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
const schema = new GraphQLSchema({
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
					for (const greeting of ['Hello', 'Bonjour', 'Hola', 'Ciao']) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
						//yield a new value for the subscription
						yield { greetings: greeting };
					}
				},
			},
		},
	}),
});

// Create the GraphQL over SSE handler
const handler = createHandler({ schema });

// Create a fastify instance serving all methods on `/graphql/stream`
const fastify = Fastify();
fastify.all('/graphql/stream', (req, res) =>
	handler(
		req.raw,
		res.raw,
		req.body // fastify reads the body for you
	)
);

fastify.listen(4000, '127.0.0.1');
console.log('Listening to port 4000');
