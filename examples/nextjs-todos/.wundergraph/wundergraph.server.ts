import { configureWunderGraphServer } from '@wundergraph/sdk';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
	hooks: {
		queries: {},
		mutations: {
			CreateTodo: {
				mutatingPreResolve: async ({ input, internalClient }) => {
					const { data } = await internalClient.queries.GetLastOrder();
					let order = 1;
					if (data && data.lastTodo.length === 1) {
						order = data.lastTodo[0].order + 1;
					}
					return {
						...input,
						order,
					};
				},
			},
			UpdateTodoOrder: {
				preResolve: async ({ input, internalClient }) => {
					const { data } = await internalClient.queries.Todo({
						input: { id: input.id },
					});

					if (!data?.todo) {
						return;
					}

					if (data.todo.order > input.order) {
						await internalClient.mutations.ReorderTodosDragDown({
							input: {
								newOrder: input.order,
								oldOrder: data.todo.order,
							},
						});
					} else if (data.todo.order <= input.order) {
						await internalClient.mutations.ReorderTodosDragUp({
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
