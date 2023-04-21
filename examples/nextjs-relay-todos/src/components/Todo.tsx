import { TodoListUpdateTodoMutation } from '@/__relay__generated__/TodoListUpdateTodoMutation.graphql';
import { Todo_todo$key } from '@/__relay__generated__/Todo_todo.graphql';
import { graphql, useFragment, useMutation } from 'react-relay';

const UpdateTodoMutation = graphql`
	mutation TodoListUpdateTodoMutation($todo: todos_TodoInput!) {
		todos_updateTodo(todo: $todo) {
			id
			text
			isCompleted
		}
	}
`;

const TodoFragment = graphql`
	fragment Todo_todo on todos_Todo {
		id
		text
		isCompleted
	}
`;

type Todo = Todo_todo$key;

export const Todo = ({ todo }: { todo: Todo }) => {
	const data = useFragment(TodoFragment, todo);

	const [updateTodo] = useMutation<TodoListUpdateTodoMutation>(UpdateTodoMutation);

	const handleUpdateTodo = (id: number, isCompleted: boolean) => {
		updateTodo({
			variables: { todo: { id, isCompleted, text: data.text } },
			onCompleted: () => {
				console.log('Todo updated');
			},
		});
	};

	return (
		<div key={data.id}>
			<input type="checkbox" checked={data.isCompleted} onChange={() => handleUpdateTodo(data.id, !data.isCompleted)} />
			{data.text}
		</div>
	);
};
