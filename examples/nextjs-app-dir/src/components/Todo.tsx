'use client';

import { AllTodosResponseData } from '../../.wundergraph/generated/models';
import { toggleTodo } from '@/app/actions';
import { useTransition } from 'react';

export const Todo = ({ data }: { data: NonNullable<AllTodosResponseData['todos_todos']>[0] }) => {
	const [, startTransition] = useTransition();

	return (
		<div className="mb-4" key={data.id}>
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
