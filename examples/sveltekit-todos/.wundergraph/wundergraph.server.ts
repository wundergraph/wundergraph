import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
	hooks: {
		queries: {},
		mutations: {
			CreateTodo: {
				mutatingPreResolve: async ({ input, operations }) => {
					const { data } = await operations.query({
						operationName: 'GetLastOrder',
					});
					let order = 1;
					if (data?.lastItem) {
						order = data.lastItem.order + 1;
					}
					return {
						...input,
						order,
					};
				},
			},
			UpdateTodoOrder: {
				preResolve: async ({ input, operations }) => {
					const { data } = await operations.query({
						operationName: 'Todo',
						input: { id: input.id },
					});

					if (!data?.todo) {
						return;
					}

					if (data.todo.order > input.order) {
						await operations.mutate({
							operationName: 'ReorderTodosDragDown',
							input: {
								newOrder: input.order,
								oldOrder: data.todo.order,
							},
						});
					} else if (data.todo.order <= input.order) {
						await operations.mutate({
							operationName: 'ReorderTodosDragUp',
							input: {
								newOrder: input.order,
								oldOrder: data.todo.order,
							},
						});
					}
				},
			},
		},
	},
}));
