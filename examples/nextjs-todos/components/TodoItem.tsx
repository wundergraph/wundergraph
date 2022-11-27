import React, { Fragment, useEffect, useState } from 'react';
import { useMutation } from './generated/nextjs';
import { DeleteTodoInput, EditTodoInput, EditTodoResponseData, UpdateCompleteTodoInput } from './generated/models';
import { mutate } from 'swr';

function TodoItem({ allTodos, todo, lastItem }) {
	const [currentTodo, setCurrentTodo] = useState(todo);
	useEffect(() => {
		setCurrentTodo(todo);
	}, [todo]);

	const [editMode, setEditMode] = useState<boolean>(false);

	const updateCompleteTodo = useMutation({
		operationName: 'UpdateCompleteTodo',
	});
	const deleteTodoOperation = useMutation({
		operationName: 'DeleteTodo',
	});
	const updateTodo = useMutation({ operationName: 'EditTodo' });

	async function updateCompletedStatus(e: React.ChangeEvent<HTMLInputElement>) {
		let newCheckedStatus: boolean = e.target.checked;
		let updateCompleteTodoStatus: UpdateCompleteTodoInput = {
			id: currentTodo.id,
			complete: {
				set: newCheckedStatus,
			},
		};
		performEditOperation(null, updateCompleteTodoStatus);
	}

	async function editTodo() {
		if (currentTodo.title.trim().length > 0) {
			let updateTodoTitle: EditTodoInput = {
				id: currentTodo.id,
				title: {
					set: currentTodo.title,
				},
			};
			performEditOperation(updateTodoTitle, null);
		}
	}

	/*
	 * Shared function to update todo title or completed status
	 * one of the input must be null and other must be either EditTodoInput or UpdateCompleteTodoInput
	 * */
	async function performEditOperation(
		updateTodoTitle: EditTodoInput,
		updateCompleteTodoStatus: UpdateCompleteTodoInput
	) {
		let optimisticTodos = [...allTodos.data.db_findManyTodo];
		let id = updateTodoTitle ? updateTodoTitle.id : updateCompleteTodoStatus.id;
		let index = optimisticTodos.findIndex((todo) => todo.id === id);
		let todoToUpdate = { ...optimisticTodos[index] };
		if (updateTodoTitle) {
			todoToUpdate.title = updateTodoTitle.title.set;
		} else {
			todoToUpdate.completed = updateCompleteTodoStatus.complete.set;
		}
		optimisticTodos[index] = { ...todoToUpdate };
		let optimisticData = { db_findManyTodo: optimisticTodos };
		await mutate(
			{ operationName: 'Todos' },
			async (allTodos) => {
				//make deep copy of todos
				let modifyTodos = JSON.parse(JSON.stringify(allTodos));
				let updateResponse: EditTodoResponseData;
				if (updateTodoTitle) {
					updateResponse = await updateTodo.trigger(updateTodoTitle);
				} else {
					updateResponse = await updateCompleteTodo.trigger(updateCompleteTodoStatus);
				}
				if (updateResponse.db_updateOneTodo) {
					modifyTodos.db_findManyTodo.map((currTodo) => {
						if (currTodo.id === updateResponse.db_updateOneTodo.id) {
							if (updateTodoTitle) {
								currTodo.title = updateTodoTitle.title.set;
							} else {
								currTodo.completed = updateCompleteTodoStatus.complete.set;
							}
						}
					});
				}
				if (updateTodoTitle) {
					clearEdit();
				}
				return modifyTodos;
			},
			{ optimisticData: optimisticData, revalidate: true, rollbackOnError: true }
		);
	}

	async function deleteTodo(id: number) {
		const deleteTodoArg: DeleteTodoInput = { id: id };
		let optimisticTodos = [...allTodos.data.db_findManyTodo];
		optimisticTodos = optimisticTodos.filter((todo) => todo.id !== id);
		let optimisticData = { db_findManyTodo: optimisticTodos };
		await mutate(
			{ operationName: 'Todos' },
			async (todos) => {
				//make deep copy of todos
				let filteredTodos = JSON.parse(JSON.stringify(todos));
				const deletedTodo = await deleteTodoOperation.trigger(deleteTodoArg);
				if (deletedTodo.db_deleteOneTodo) {
					filteredTodos.db_findManyTodo = filteredTodos.db_findManyTodo.filter(
						(todo) => todo.id !== deletedTodo.db_deleteOneTodo.id
					);
				}
				return filteredTodos;
			},
			{ optimisticData: optimisticData, revalidate: true, rollbackOnError: true }
		);
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
			await editTodo();
		}
	}

	function enableEditMode() {
		setEditMode(true);
	}

	return (
		<Fragment>
			{!editMode && (
				<div
					className={`flex justify-between pt-4 pb-2 m-2 px-2 hover:px-3 w-72 hover:bg-zinc-600 hover:rounded
					${!lastItem ? `border-solid border-0 border-b border-zinc-500` : ``}`}
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
								className={`cursor-pointer ml-3 text-sm font-medium text-gray-300 ${
									currentTodo.completed ? `line-through` : ``
								}`}
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
							className={`
							${editMode ? `mb-1` : ``} 
							${currentTodo.completed ? `line-through` : ``}
								border-solid border-0 border-b border-pink-400
								py-3 pl-5 pr-10 w-72 bg-gray-900 text-white focus:outline-none 
								`}
						/>

						<div onClick={editTodo} className={'absolute right-6 top-3 cursor-pointer hover:bg-zinc-500 hover:rounded'}>
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
