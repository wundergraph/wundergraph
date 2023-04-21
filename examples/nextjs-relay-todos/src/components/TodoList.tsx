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
		<div>
			<h1>Todo List</h1>
			{todos.todos_todos?.map((todo, index) => (todo ? <Todo key={index.toString()} todo={todo} /> : null))}
			<div>
				<input
					type="text"
					value={newTodoText}
					onChange={(e) => setNewTodoText(e.target.value)}
					placeholder="New todo text"
				/>
				<button onClick={handleAddTodo}>Add Todo</button>
			</div>
		</div>
	);
};
