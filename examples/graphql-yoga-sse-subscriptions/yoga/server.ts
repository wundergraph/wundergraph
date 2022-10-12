import { createServer } from '@graphql-yoga/node';

// Provide your schema
const server = createServer({
	schema: {
		typeDefs: /* GraphQL */ `
			type Query {
				hello: String
			}

			type Subscription {
				countdown(from: Int!): Int!
			}
		`,
		resolvers: {
			Query: {
				hello: () => 'world',
			},
			Subscription: {
				countdown: {
					// This will return the value on every 1 sec until it reaches 0
					subscribe: async function* (_, { from }) {
						for (let i = from; i >= 0; i--) {
							await new Promise((resolve) => setTimeout(resolve, 1000));
							yield { countdown: i };
						}
					},
				},
			},
		},
	},
	hostname: '127.0.0.1',
	port: 4000,
});

server.start().catch((err) => console.error(err));
