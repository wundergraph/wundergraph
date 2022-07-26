import { createServer } from '@graphql-yoga/node';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import express from 'express';

const schema = {
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
};

const app = express();

const yogaApp = createServer({
	graphiql: {
		subscriptionsProtocol: 'WS',
	},
	logging: {
		debug: (...args) => console.log('[yoga]', ...args),
		info: (...args) => console.log('[yoga]', ...args),
		warn: (...args) => console.log('[yoga]', ...args),
		error: (...args) => console.log('[yoga]', ...args),
	},
	schema,
});

app.use('/graphql', yogaApp);

const server = app.listen(4000, () => {
	// Get NodeJS Server from Yoga
	// const httpServer = await yogaApp.start();
	// Create WebSocket server instance from our Node server
	const wsServer = new WebSocketServer({
		server: server,
		path: yogaApp.getAddressInfo().endpoint,
	});

	useServer(
		{
			execute: (args: any) => args.rootValue.execute(args),
			subscribe: (args: any) => args.rootValue.subscribe(args),
			onSubscribe: async (ctx, msg) => {
				const { schema, execute, subscribe, contextFactory, parse, validate } = yogaApp.getEnveloped(ctx);

				const args = {
					schema,
					operationName: msg.payload.operationName,
					document: parse(msg.payload.query),
					variableValues: msg.payload.variables,
					contextValue: await contextFactory(),
					rootValue: {
						execute,
						subscribe,
					},
				};

				const errors = validate(args.schema, args.document);
				console.log(errors);
				if (errors.length) return errors;
				return args;
			},
		},
		wsServer
	);
});
