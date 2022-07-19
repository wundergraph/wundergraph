import express from 'express';
import { ApolloServer } from 'apollo-server-express';

const app = express();

async function main() {
	const server = new ApolloServer({
		typeDefs: `
				type Query {
					hello: String!
				}
				type Subscription {
					countdown: Int!
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
	});

	await server.start();

	server.applyMiddleware({
		app,
		path: '/graphql',
	});

	app.listen(process.env.PORT || 4000, () => {
		console.log(`🚀 Server is running at http://localhost:${process.env.PORT}`);
	});
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
