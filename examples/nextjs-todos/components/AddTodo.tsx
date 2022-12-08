import { useRef, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

import useAddMutation from '../hooks/useAddTodoMutation';
import clsx from 'clsx';

const AddTodo = () => {
	const createTodo = useAddMutation();

	const [title, setTitle] = useState<string>('');

	const titleRef = useRef<HTMLInputElement>(null);

	function addTodo() {
		if (title.trim().length > 0) {
			createTodo.trigger({ title });
			clearAdd();
		}
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Escape') {
			clearAdd();
		} else if (event.key === 'Enter') {
			addTodo();
		}
	}

	function clearAdd() {
		setTitle('');
	}

	return (
		<div className="relative">
			<input
				ref={titleRef}
				placeholder="Add todo"
				type="text"
				onKeyDown={handleKeyDown}
				value={title}
				onChange={(e) => {
					setTitle(e.target.value);
				}}
				className="py-2.5 pl-5 h-11 pr-10 w-72 rounded-md border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500  transition"
			/>
			<button
				onClick={addTodo}
				className={clsx(
					'absolute transition right-1 top-1 h-9 w-9 flex items-center justify-center cursor-pointer hover:bg-gray-700 rounded text-white',
					{ 'opacity-40': title.trim().length === 0 }
				)}
			>
				<CheckIcon className="w-6 h-6" />
			</button>
		</div>
	);
};

export default AddTodo;
