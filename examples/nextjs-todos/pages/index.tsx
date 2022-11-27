import { NextPage } from 'next';
import { withWunderGraph, useQuery, useMutation } from '../components/generated/nextjs';
import React, { Fragment, useRef, useState } from 'react';
import TodoItem from '../components/TodoItem';
import NavBar from '../components/Navbar';
import { useSWRConfig } from 'swr';
import { Reorder } from 'framer-motion';

import {
	DeleteTodoInput,
	EditTodoInput,
	EditTodoResponseData,
	UpdateCompleteTodoInput,
} from '../components/generated/models';
import { TodoOrder } from '../interfaces';

const Home: NextPage = () => {
	const { mutate } = useSWRConfig();
	const allTodos = useQuery({
		operationName: 'Todos',
		onSuccess: (data) => {
			setPrevTodos(data.db_findManyTodo);
		},
	});
	const updateCompleteTodo = useMutation({ operationName: 'UpdateCompleteTodo' });
	const updateTodo = useMutation({ operationName: 'EditTodo' });
	const updateTodoOrder = useMutation({ operationName: 'UpdateTodoOrder' });

	const createTodo = useMutation({ operationName: 'CreateTodo' });
	const deleteTodoOperation = useMutation({ operationName: 'DeleteTodo' });

	const [title, setTitle] = useState<string>('');
	const titleRef = useRef<HTMLInputElement>();
	const [prevTodos, setPrevTodos] = useState<any>([]);

	// todo operations
	async function updateCompleteStatus(updateCompleteTodoStatus: UpdateCompleteTodoInput) {
		let optimisticTodos = [...allTodos.data.db_findManyTodo];
		let id = updateCompleteTodoStatus.id;
		let index = optimisticTodos.findIndex((t) => t.id === id);
		let todoToUpdate = { ...optimisticTodos[index] };
		todoToUpdate.completed = updateCompleteTodoStatus.complete.set;

		optimisticTodos[index] = { ...todoToUpdate };
		let optimisticData = { db_findManyTodo: optimisticTodos };
		await mutate(
			{ operationName: 'Todos' },
			async (allTodos) => {
				//make deep copy of todos
				let modifyTodos = JSON.parse(JSON.stringify(allTodos));
				let updateResponse: EditTodoResponseData;
				updateResponse = await updateCompleteTodo.trigger(updateCompleteTodoStatus);
				if (updateResponse.db_updateOneTodo) {
					modifyTodos.db_findManyTodo.map((currTodo) => {
						if (currTodo.id === updateResponse.db_updateOneTodo.id) {
							currTodo.completed = updateCompleteTodoStatus.complete.set;
						}
					});
				}
				return modifyTodos;
			},
			{ optimisticData: optimisticData, revalidate: true, rollbackOnError: true }
		);
	}
	async function updateTitle(updateTodoTitle: EditTodoInput) {
		let optimisticTodos = [...allTodos.data.db_findManyTodo];
		let id = updateTodoTitle.id;
		let index = optimisticTodos.findIndex((t) => t.id === id);
		let todoToUpdate = { ...optimisticTodos[index] };
		todoToUpdate.title = updateTodoTitle.title.set;
		optimisticTodos[index] = { ...todoToUpdate };
		let optimisticData = { db_findManyTodo: optimisticTodos };
		await mutate(
			{ operationName: 'Todos' },
			async (allTodos) => {
				//make deep copy of todos
				let modifyTodos = JSON.parse(JSON.stringify(allTodos));
				let updateResponse: EditTodoResponseData = await updateTodo.trigger(updateTodoTitle);
				if (updateResponse.db_updateOneTodo) {
					modifyTodos.db_findManyTodo.map((currTodo) => {
						if (currTodo.id === updateResponse.db_updateOneTodo.id) {
							currTodo.title = updateTodoTitle.title.set;
						}
					});
				}
				return modifyTodos;
			},
			{ optimisticData: optimisticData, revalidate: true, rollbackOnError: true }
		);
	}

	async function addTodo() {
		if (title.trim().length > 0) {
			let newItem = {
				id: 99999,
				title: title,
				completed: false,
				order: 99999,
			};
			let optimisticTodos = [...allTodos.data.db_findManyTodo];
			optimisticTodos.unshift(newItem);
			let optimisticData = { db_findManyTodo: optimisticTodos };
			mutate(
				{ operationName: 'Todos' },
				async (todos) => {
					if (todos) {
						//make deep copy of todos
						let newTodos = JSON.parse(JSON.stringify(todos));
						let savedTodo = await createTodo.trigger({ title: title });
						if (savedTodo.db_createOneTodo) {
							newItem.id = savedTodo.db_createOneTodo.id;
							newItem.order = savedTodo.db_createOneTodo.id;
							newTodos.db_findManyTodo.unshift(newItem);
						}
						clearAdd();
						return newTodos;
					}
				},
				{ optimisticData: optimisticData, revalidate: true, rollbackOnError: true }
			);
		}
	}
	async function deleteTodo(id: number) {
		const deleteTodoArg: DeleteTodoInput = { id: id };
		let optimisticTodos = [...allTodos.data.db_findManyTodo];
		optimisticTodos = optimisticTodos.filter((t) => t.id !== id);
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

	//reorder todos
	function handleReorder(newOrder: number[]) {
		let newItems = [];
		let itemsMap = new Map();

		for (let i = 0; i < allTodos.data.db_findManyTodo.length; i++) {
			let item = allTodos.data.db_findManyTodo[i];
			itemsMap.set(item.order, item);
		}

		for (let i = 0; i < newOrder.length; i++) {
			newItems.push(itemsMap.get(newOrder[i]));
		}

		let optimisticData = { db_findManyTodo: newItems };
		mutate(
			{ operationName: 'Todos' },
			async () => {
				return { db_findManyTodo: newItems };
			},
			{ optimisticData: optimisticData, revalidate: false, rollbackOnError: true }
		);
	}
	async function updateDragAndDropOrder() {
		let newOrder: TodoOrder[] = [];
		let newOrderMap = new Map();

		for (let i = 0; i < allTodos.data.db_findManyTodo.length; i++) {
			let item = allTodos.data.db_findManyTodo[i];
			let order = { id: item.id, order: { set: prevTodos[i].order } };
			newOrderMap.set(item.id, order.id);
			newOrder.push(order);
		}
		await Promise.all(newOrder.map((item: TodoOrder) => updateTodoOrder.trigger(item)));
	}

	async function titleKeyHandler(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Escape') {
			clearAdd();
		} else if (event.key === 'Enter') {
			await addTodo();
		}
	}

	function clearAdd() {
		setTitle('');
		titleRef.current.blur();
	}

	return (
		<Fragment>
			<NavBar />
			<div className={'flex flex-col items-center h-[200vh] w-full bg-gray-900'}>
				<div className={'mt-[10%]'}>
					<div className={'mb-5 w-72'}>
						<div className={'flex items-center flex-end'}>
							<a href="https://wundergraph.com" target="_blank">
								<img src="/wundergraph.svg" className="h-16" alt="WunderGraph logo" />
							</a>
							<span className="ml-4 text-2xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
								{' '}
								WunderGraph Todo{' '}
							</span>
						</div>
					</div>
					<div className={'relative'}>
						<input
							ref={titleRef}
							placeholder={'Add todo'}
							type="text"
							onKeyDown={titleKeyHandler}
							value={title}
							onChange={(e) => {
								setTitle(e.target.value);
							}}
							className={
								'mb-2 bg-gray-600 py-3 pl-5 pr-10 w-72 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75'
							}
						/>
						<div onClick={addTodo} className={'absolute right-3 top-3 cursor-pointer hover:bg-zinc-500 hover:rounded'}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="white"
								className="w-7 h-6"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
							</svg>
						</div>
					</div>
					<div className={'mt-2'}>
						<div className={'absolute mt-1 -ml-1'}>
							{allTodos?.data?.db_findManyTodo && (
								<Reorder.Group
									axis="y"
									values={allTodos.data.db_findManyTodo.map((c) => c.order)}
									onReorder={handleReorder}
								>
									{allTodos?.data.db_findManyTodo.map((todo, index: number) => (
										<Reorder.Item onDragEnd={updateDragAndDropOrder} key={todo.order} value={todo.order}>
											<TodoItem
												todo={todo}
												deleteTodo={deleteTodo}
												updateTitle={updateTitle}
												updateCompleteStatus={updateCompleteStatus}
												lastItem={index === allTodos.data.db_findManyTodo.length - 1}
											/>
										</Reorder.Item>
									))}
								</Reorder.Group>
							)}
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	);
};

export default withWunderGraph(Home);
