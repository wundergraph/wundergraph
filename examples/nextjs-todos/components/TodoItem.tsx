import clsx from 'clsx';
import React, { Fragment, useState } from 'react';

import useUpdateTitleMutation from '../hooks/useUpdateTitleMutation';
import useUpdateCompleteStatusMutation from '../hooks/useUpdateCompleteStatusMutation';
import useDeleteTodoMutation from '../hooks/useDeleteTodoMutation';
import { Todo } from '../types';

interface TodoItemProps {
	todo: Todo;
}

function TodoItem(props: TodoItemProps) {
	const { todo } = props;
	const editTodoTitle = useUpdateTitleMutation();
	const updateCompleteTodo = useUpdateCompleteStatusMutation();
	const deleteTodo = useDeleteTodoMutation();
	const [title, setTitle] = useState<string>(todo.title);
	const [completed, setCompleted] = useState<boolean>(todo.completed);
	const [editMode, setEditMode] = useState<boolean>(false);

	function updateCompletedStatus(e: React.ChangeEvent<HTMLInputElement>) {
		let newCheckedStatus: boolean = e.target.checked;
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

	async function titleKeyHandler(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Escape') {
			clearEdit();
			resetTitle();
		} else if (event.key === 'Enter') {
			await editTodoTile();
		}
	}

	function enableEditMode() {
		setEditMode(true);
	}

	return (
		<Fragment>
			{!editMode && (
				<div
					className={clsx(
						['flex justify-between pt-4 pb-2 m-2 px-2 w-72 hover:bg-zinc-600 hover:rounded-md']
						// [!lastItem && 'border-solid border-0 border-b border-zinc-600']
					)}
				>
					<Fragment>
						<div className="flex items-center mb-1 mx-1">
							<input
								onChange={updateCompletedStatus}
								type="checkbox"
								checked={completed}
								className="h-4 w-4 rounded-full accent-pink-500"
							/>
							<div
								onClick={enableEditMode}
								className={clsx(
									['cursor-pointer ml-3 text-sm font-medium text-gray-300'],
									[completed && 'line-through']
								)}
							>
								<span className="break-all">
									{title} - {todo.id} - {todo.order}
								</span>
							</div>
						</div>
						<div onClick={deleteTodoItem} className="flex flex-col justify-start ml-5 cursor-pointer">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="#fafafa"
								className="w-5 h-5 hover:bg-zinc-500 hover:rounded"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</div>
					</Fragment>
				</div>
			)}
			{editMode && (
				<Fragment>
					<div className="relative">
						<input
							type="text"
							onKeyDown={titleKeyHandler}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className={clsx(
								[completed && 'line-through', editMode && 'mb-1'],
								[
									'py-3 pl-5 ml-2 border-solid border-0 border-b border-pink-400 w-72 bg-gray-900 text-white focus:outline-none',
								]
							)}
						/>
						<div
							onClick={editTodoTile}
							className="absolute right-4 top-4 cursor-pointer hover:bg-zinc-500 hover:rounded"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="white"
								className="w-5 h-5"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
							</svg>
						</div>
					</div>
				</Fragment>
			)}
		</Fragment>
	);
}

export default TodoItem;
