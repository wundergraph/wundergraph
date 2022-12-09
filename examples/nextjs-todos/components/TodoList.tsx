import { Reorder } from 'framer-motion';
import { useState } from 'react';
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
	const [previousTodos, setPreviousTodos] = useState<Todo[] | undefined>(undefined);
	const reorderTodo = useReorderTodoMutation();

	function handleReorder(newOrder: Todos) {
		mutate({ operationName: 'Todos' }, { todos: newOrder }, { revalidate: false });
	}

	async function reorderItems(item: Todo, index: number) {
		if (previousTodos) {
			const newOrder = previousTodos[index].order;
			const oldOrder = item.order;
			if (newOrder && newOrder !== oldOrder) {
				reorderTodo.trigger({ id: item.id, order: newOrder }, { throwOnError: false });
			}
		}
	}

	return todos ? (
		<Reorder.Group axis="y" values={todos} onReorder={handleReorder}>
			{todos.map((todo, index: number) => (
				<Reorder.Item
					onDragStart={() => {
						setPreviousTodos(JSON.parse(JSON.stringify(todos)));
					}}
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
