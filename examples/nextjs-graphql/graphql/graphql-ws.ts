import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql';

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
			countdown: {
				type: GraphQLInt,
				// This will return the value on every 1 sec until it reaches 0
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

import { WebSocketServer } from 'ws'; // yarn add ws
// import ws from 'ws'; yarn add ws@7
// const WebSocketServer = ws.Server;
import { useServer } from 'graphql-ws/lib/use/ws';

const server = new WebSocketServer({
	port: 4000,
	path: '/graphql',
});

useServer({ schema }, server);

console.log('Listening to port 4000');
