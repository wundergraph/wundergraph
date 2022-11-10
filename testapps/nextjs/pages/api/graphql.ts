import { createServer } from '@graphql-yoga/node';
import type { NextApiRequest, NextApiResponse } from 'next';

// Provide your schema
export default createServer<{
	req: NextApiRequest;
	res: NextApiResponse;
}>({
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
});

export const config = {
	api: {
		// Disable body parsing (required for file uploads)
		bodyParser: false,
	},
};
