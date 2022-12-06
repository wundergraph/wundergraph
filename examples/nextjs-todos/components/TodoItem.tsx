import clsx from 'clsx';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

import useDeleteTodoMutation from '../hooks/useDeleteTodoMutation';
import useUpdateCompleteStatusMutation from '../hooks/useUpdateCompleteStatusMutation';
import useUpdateTitleMutation from '../hooks/useUpdateTitleMutation';
import { Todo } from '../types';

interface TodoItemProps {
	todo: Todo;
}

function TodoItem(props: TodoItemProps) {
	const { todo } = props;
	const editTodoTitle = useUpdateTitleMutation();
	const updateCompleteTodo = useUpdateCompleteStatusMutation();
	const deleteTodo = useDeleteTodoMutation();
	const inputRef = useRef<HTMLInputElement>(null);
	const [title, setTitle] = useState<string>(todo.title);
	const [completed, setCompleted] = useState<boolean>(todo.completed);
	const [editMode, setEditMode] = useState<boolean>(false);

	useEffect(() => {
		const listener = (event: MouseEvent | TouchEvent) => {
			const target = event.target as HTMLElement;
			if (!inputRef.current || inputRef.current.contains(target)) {
				return;
			}
			setEditMode(false);
		};
		if (editMode) {
			document.addEventListener('mousedown', listener);
			document.addEventListener('touchstart', listener);
		}
		return () => {
			document.removeEventListener('mousedown', listener);
			document.removeEventListener('touchstart', listener);
		};
	}, [editMode]);

	function updateCompletedStatus(e: React.ChangeEvent<HTMLInputElement>) {
		const newCheckedStatus = e.target.checked;
		setCompleted(newCheckedStatus);
		updateCompleteTodo.trigger({ id: todo.id, complete: newCheckedStatus }, { throwOnError: false });
	}

	function deleteTodoItem() {
		deleteTodo.trigger({ id: todo.id }, { throwOnError: false });
	}

	function editTodoTile() {
		if (title.trim().length > 0) {
			clearEdit();
			editTodoTitle.trigger({ id: todo.id, title }, { throwOnError: false });
		}
	}

	function clearEdit() {
		setEditMode(false);
	}

	function resetTitle() {
		setTitle(todo.title);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Escape') {
			clearEdit();
			resetTitle();
		} else if (event.key === 'Enter') {
			editTodoTile();
		}
	}

	function enableEditMode() {
		setEditMode(true);
		setTimeout(() => {
			inputRef.current?.focus();
		});
	}

	return (
		<div
			className={clsx(
				'group flex justify-between items-center py-3 my-2 pl-2 pr-1 w-72 h-11 transition hover:bg-slate-800 rounded-md relative',
				editMode && 'bg-slate-800'
			)}
		>
			{!editMode ? (
				<Fragment>
					<div className="flex flex-1 items-center mx-1">
						<input
							onChange={updateCompletedStatus}
							type="checkbox"
							checked={completed}
							className="h-4 w-4 rounded-full transition cursor-pointer accent-pink-500 border-gray-500 bg-slate-800 text-pink-600 focus:ring-pink-500 focus:ring-1 focus:border-pink-500 hover:ring-1 focus:ring-offset-0 hover:border-pink-500 ring-pink-500"
						/>
						<div
							onDoubleClick={enableEditMode}
							className={clsx('flex-1 cursor-pointer ml-3 text-sm font-medium text-gray-300', [
								completed && 'line-through',
							])}
						>
							<span className="break-all">{title}</span>
						</div>
					</div>
					<div
						onClick={deleteTodoItem}
						className="flex-col items-center justify-center ml-5  h-9 w-9 transition cursor-pointer hidden group-hover:flex text-white opacity-50 hover:opacity-100 hover:bg-gray-700 rounded"
					>
						<XMarkIcon className="w-6 h-6" />
					</div>
				</Fragment>
			) : (
				<Fragment>
					<div className="relative w-full">
						<input
							ref={inputRef}
							type="text"
							onKeyDown={handleKeyDown}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className={clsx(
								'py-2.5 pl-8 pr-2 h-11 -mt-[1px] border-0 w-full leadig-0 text-sm font-medium bg-slate-800 rounded text-white focus:outline-none focus:border-0 focus:ring-0'
							)}
						/>
						<button
							onClick={editTodoTile}
							className={clsx(
								'absolute transition right-0 top-1 -mt-[1px] h-9 w-9 flex items-center justify-center cursor-pointer hover:bg-gray-700 rounded text-white',
								{ 'opacity-40': title.trim().length === 0 }
							)}
						>
							<CheckIcon className="w-6 h-6" />
						</button>
					</div>
				</Fragment>
			)}
		</div>
	);
}

export default TodoItem;
