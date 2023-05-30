'use client';

import { AllTodosResponseData } from '../../.wundergraph/generated/models';
import { toggleTodo } from '@/app/actions';
import { wunderGraphRelayClientWrapper } from '@/lib/wundergraph/client';
import { FC, useTransition } from 'react';
import { graphql, useFragment } from 'react-relay';

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
		todoID: id
		text
		isCompleted
	}
`;

export const Todo = ({ data }) => {
	const todo = useFragment(TodoFragment, data);

	console.log({ todo, data });

	const [, startTransition] = useTransition();

	return (
		<div className="mb-4">
			<form>
				<label className="inline-flex items-center">
					<input
						type="checkbox"
						checked={data.isCompleted}
						onChange={() => startTransition(() => toggleTodo(data))}
						className="form-checkbox rounded text-indigo-600"
					/>
					<span className="ml-2 text-gray-800">{data.text}</span>
				</label>
			</form>
		</div>
	);
};
