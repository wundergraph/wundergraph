import React, { Fragment, useEffect, useState } from 'react';
import { EditTodoInput, UpdateCompleteTodoInput } from './generated/models';
import { TodoItemProp } from '../interfaces';
import clsx from 'clsx';

function TodoItem(props: TodoItemProp) {
	const { todo, lastItem, deleteTodo, updateTitle, updateCompleteStatus } = props;

	const [currentTodo, setCurrentTodo] = useState(todo);
	useEffect(() => {
		setCurrentTodo(todo);
	}, [todo]);

	const [editMode, setEditMode] = useState<boolean>(false);

	async function updateCompletedStatus(e: React.ChangeEvent<HTMLInputElement>) {
		let newCheckedStatus: boolean = e.target.checked;
		let updateCompleteTodoStatus: UpdateCompleteTodoInput = {
			id: currentTodo.id,
			complete: {
				set: newCheckedStatus,
			},
		};
		updateCompleteStatus(updateCompleteTodoStatus);
	}

	async function editTodoTile() {
		if (currentTodo.title.trim().length > 0) {
			let updateTodoTitle: EditTodoInput = {
				id: currentTodo.id,
				title: {
					set: currentTodo.title,
				},
			};
			updateTitle(updateTodoTitle);
			clearEdit();
		}
	}

	function clearEdit() {
		setEditMode(false);
	}

	function resetTitle() {
		setCurrentTodo({
			...currentTodo,
			title: todo.title,
		});
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
						['flex justify-between pt-4 pb-2 m-2 px-2 hover:px-3 w-72 hover:bg-zinc-600 hover:rounded'],
						[!lastItem && 'border-solid border-0 border-b border-zinc-600']
					)}
				>
					<Fragment>
						<div className="flex items-center mb-2">
							<form>
								<input
									onChange={updateCompletedStatus}
									type="checkbox"
									checked={currentTodo.completed}
									className={'mt-1 h-4 w-4 rounded-full accent-pink-500'}
								/>
							</form>
							<div
								onClick={enableEditMode}
								className={clsx(
									['cursor-pointer ml-3 text-sm font-medium text-gray-300'],
									[currentTodo.completed && 'line-through']
								)}
							>
								<span className={'break-all'}>{currentTodo.title}</span>
							</div>
						</div>
						<div
							onClick={() => deleteTodo(currentTodo.id)}
							className={'flex flex-col justify-start ml-2 cursor-pointer'}
						>
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
					<div className={'relative'}>
						<input
							type="text"
							onKeyDown={titleKeyHandler}
							value={currentTodo.title}
							onChange={(e) => {
								setCurrentTodo({
									...currentTodo,
									title: e.target.value,
								});
							}}
							className={clsx(
								[currentTodo.completed && 'line-through', editMode && 'mb-1'],
								[
									'border-solid border-0 border-b border-pink-400 py-3 pl-5 pr-10 w-72 bg-gray-900 text-white focus:outline-none',
								]
							)}
						/>

						<div
							onClick={editTodoTile}
							className={'absolute right-6 top-3 cursor-pointer hover:bg-zinc-500 hover:rounded'}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="white"
								className="w-6 h-6"
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
