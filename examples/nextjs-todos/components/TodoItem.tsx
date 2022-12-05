import clsx from 'clsx';
import React, { Fragment, useState } from 'react';
import { TodoItemProp } from '../interfaces';
import { EditTodoInput, UpdateCompleteTodoInput } from './generated/models';
import useUpdateTitleMutation from '../hooks/useUpdateTitleMutation';
import useUpdateCompleteStatusMutation from '../hooks/useUpdateCompleteStatusMutation';
import useDeleteTodoMutation from '../hooks/useDeleteTodoMutation';

function TodoItem(props: TodoItemProp) {
	const { todo, allTodos, lastItem } = props;
	const [deleteShow, setDeleteShow] = useState(false);
	const editTodoTitle = useUpdateTitleMutation();
	const updateCompleteTodo = useUpdateCompleteStatusMutation();
	const deleteTodo = useDeleteTodoMutation();
	const [title, setTitle] = useState<string>(todo.title);
	const [completed, setCompleted] = useState<boolean>(todo.completed);
	const [editMode, setEditMode] = useState<boolean>(false);

	async function updateCompletedStatus(e: React.ChangeEvent<HTMLInputElement>) {
		let newCheckedStatus: boolean = e.target.checked;
		let updateCompleteTodoStatus: UpdateCompleteTodoInput = {
			id: todo.id,
			complete: {
				set: newCheckedStatus,
			},
		};
		setCompleted(newCheckedStatus);
		await updateCompleteTodo({ updateCompleteTodoStatus, allTodos });
	}

	async function deleteTodoItem() {
		let id: number = todo.id;
		await deleteTodo({ id, allTodos });
	}

	async function editTodoTile() {
		if (title.trim().length > 0) {
			let updateTodoTitle: EditTodoInput = {
				id: todo.id,
				title: {
					set: title,
				},
			};
			clearEdit();
			await editTodoTitle({ allTodos, updateTodoTitle });
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
					onMouseOver={() => setDeleteShow(true)}
					onMouseLeave={() => setDeleteShow(false)}
					onDoubleClick={enableEditMode}
					className={clsx(
						['flex justify-between pt-4 pb-3 m-2 px-2 w-72 hover:bg-zinc-500 hover:rounded b'],
						[!lastItem && 'border-solid border-0 border-b border-zinc-600']
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
								className={clsx(
									['cursor-pointer ml-3 text-sm font-medium text-gray-300 '],
									[completed && 'line-through']
								)}
							>
								<span className="break-all">{title}</span>
							</div>
						</div>
						{deleteShow && (
							<div onClick={deleteTodoItem} className="flex flex-col justify-start ml-5 cursor-pointer ">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="#fafafa"
									className="w-5 h-5 hover:bg-zinc-500 hover:rounded "
								>
									<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</div>
						)}
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
									'py-3 pl-10 pr-2 ml-2 h-12 border-solid  w-72 text-sm bg-zinc-500 rounded text-white focus:outline-none ',
								]
							)}
						/>
						<div
							onClick={editTodoTile}
							className="absolute right-4 top-3.5 cursor-pointer hover:bg-zinc-500 hover:rounded"
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
