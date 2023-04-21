import { createServer } from '@graphql-yoga/node';
import type { NextApiRequest, NextApiResponse } from 'next';

interface Todo {
	id: number;
	text: string;
	isCompleted: boolean;
}

interface UpdateTodoInput {
	id: number;
	text: string;
	isCompleted: boolean;
}

interface AddTodoInput {
	text: string;
}

let nextId = 0;
let todos: Todo[] = [{ id: nextId++, text: 'Todo #1', isCompleted: false }];
let listeners: Array<() => any> = [];

export const todosStore = {
	addTodo({ text }: AddTodoInput) {
		const newTodo = { id: nextId++, text, isCompleted: false };
		todos = [...todos, newTodo];
		emitChange();
		return newTodo;
	},
	updateTodo(input: UpdateTodoInput) {
		const todoIndex = todos.findIndex((todo) => todo.id === input.id);
		if (todoIndex !== -1) {
			const newTodo = {
				id: input.id,
				text: input.text,
				isCompleted: input.isCompleted,
			};
			todos = [...todos.slice(0, todoIndex), newTodo, ...todos.slice(todoIndex + 1)];
			emitChange();
			return newTodo;
		} else {
			throw new Error('Todo not found');
		}
	},
	subscribe(listener: () => any) {
		listeners = [...listeners, listener];
		return () => {
			listeners = listeners.filter((l) => l !== listener);
		};
	},
	getSnapshot() {
		return todos;
	},
};

function emitChange() {
	for (let listener of listeners) {
		listener();
	}
}

const typeDefs = /* GraphQL */ `
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
`;

const resolvers = {
	Query: {
		todos: () => todosStore.getSnapshot(),
	},
	Mutation: {
		updateTodo: (_: any, { todo }: { todo: UpdateTodoInput }) => {
			return todosStore.updateTodo(todo);
		},
		addTodo: (_: any, { todo }: { todo: AddTodoInput }) => {
			return todosStore.addTodo(todo);
		},
	},
	Subscription: {
		TodoChanges: {
			subscribe: async function* () {
				while (true) {
					const onNextChange = new Promise<void>((resolve) => {
						const unsubscribe = todosStore.subscribe(() => {
							unsubscribe();
							resolve();
						});
					});
					await onNextChange;
					yield {
						TodoChanges: todosStore.getSnapshot(),
					};
				}
			},
		},
	},
};

// Provide your schema
export default createServer<{
	req: NextApiRequest;
	res: NextApiResponse;
}>({
	schema: {
		typeDefs,
		resolvers,
	},
});

export const config = {
	api: {
		// Disable body parsing (required for file uploads)
		bodyParser: false,
	},
};
