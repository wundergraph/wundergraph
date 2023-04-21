import { configureWunderGraphApplication, cors, EnvironmentVariable, introspect, templates } from '@wundergraph/sdk';
import server from './wundergraph.server';
import operations from './wundergraph.operations';

const todos = introspect.graphql({
	apiNamespace: 'todos',
	url: 'http://localhost:3000/api/graphql',
	loadSchemaFromString: /* GraphQL */ `
		type Todo {
			id: Int!
			text: String!
			isCompleted: Boolean!
		}

		input TodoInput {
			id: Int!
			text: String!
			isCompleted: Boolean!
		}

		input NewTodoInput {
			text: String!
		}

		type Query {
			todos: [Todo]
		}

		type Mutation {
			updateTodo(todo: TodoInput): Todo
			addTodo(todo: NewTodoInput): Todo
		}

		type Subscription {
			TodoChanges: [Todo]
		}
	`,
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
	apis: [todos],
	server,
	operations,
	codeGenerators: [
		{
			templates: [
				// use all the typescript react templates to generate a client
				...templates.typescript.all,
			],
		},
	],
	cors: {
		...cors.allowAll,
		allowedOrigins:
			process.env.NODE_ENV === 'production'
				? [
						// change this before deploying to production to the actual domain where you're deploying your app
						'http://localhost:3000',
				  ]
				: ['http://localhost:3000', new EnvironmentVariable('WG_ALLOWED_ORIGIN')],
	},
	security: {
		enableGraphQLEndpoint: process.env.NODE_ENV !== 'production' || process.env.GITPOD_WORKSPACE_ID !== undefined,
	},
});
