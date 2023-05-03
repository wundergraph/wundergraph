import { TodoListAddTodoMutation } from '@/__relay__generated__/TodoListAddTodoMutation.graphql';
import { pagesAllTodosQuery$data } from '@/__relay__generated__/pagesAllTodosQuery.graphql';
import { useState } from 'react';
import { graphql, useFragment, useMutation } from 'react-relay';
import { Todo } from './Todo';

const AddTodoMutation = graphql`
	mutation TodoListAddTodoMutation($todo: todos_NewTodoInput!) {
		todos_addTodo(todo: $todo) {
			id
			text
			isCompleted
		}
	}
`;

export const TodoList = ({ todos }: { todos: pagesAllTodosQuery$data }) => {
	const [newTodoText, setNewTodoText] = useState('');

	const [addTodo] = useMutation<TodoListAddTodoMutation>(AddTodoMutation);

	const handleAddTodo = () => {
		addTodo({
			variables: { todo: { text: newTodoText } },
			onCompleted: () => {
				console.log('Todo added');
				setNewTodoText('');
			},
		});
	};

	return (
		<div className="bg-white rounded-lg shadow p-6">
			<h1 className="text-2xl font-semibold mb-4 text-gray-700">Todo List</h1>
			{todos.todos_todos?.map((todo, index) => (todo ? <Todo key={index.toString()} todo={todo} /> : null))}
			<div className="flex items-center">
				<input
					type="text"
					value={newTodoText}
					onChange={(e) => setNewTodoText(e.target.value)}
					placeholder="New todo text"
					className="form-input flex-grow rounded-l-lg border-r-0 focus:ring-0 focus:border-indigo-300"
				/>
				<button
					className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-r-lg hover:bg-indigo-500 focus:outline-none"
					onClick={handleAddTodo}
				>
					Add Todo
				</button>
			</div>
		</div>
	);
};
