import { Reorder } from 'framer-motion';
import React from 'react';
import { useSWRConfig } from 'swr';

import { useQuery } from '../components/generated/nextjs';
import TodoItem from '../components/TodoItem';

import useReorderTodoMutation from '../hooks/useReorderTodoMutation';
import { Todo, Todos } from '../types';

const TodoList = () => {
	const { mutate } = useSWRConfig();
	const { data } = useQuery({
		operationName: 'Todos',
	});
	const todos = data?.todos;

	const reorderTodo = useReorderTodoMutation();

	function handleReorder(newOrder: Todos) {
		// optimistically update the order
		mutate({ operationName: 'Todos' }, { todos: newOrder }, { revalidate: false });
	}

	function reorderItems(item: Todo, index: number) {
		const newOrder = index + 1;
		const oldOrder = item.order;

		if (newOrder && newOrder !== oldOrder) {
			reorderTodo.trigger({ id: item.id, order: newOrder }, { throwOnError: false });
		}
	}
	return todos ? (
		<Reorder.Group axis="y" values={todos} onReorder={handleReorder}>
			{todos.map((todo, index: number) => (
				<Reorder.Item
					onDragEnd={() => {
						reorderItems(todo, index);
					}}
					key={todo.id}
					value={todo}
				>
					<TodoItem todo={todo} />
				</Reorder.Item>
			))}
		</Reorder.Group>
	) : null;
};

export default TodoList;
