import { Reorder } from "framer-motion";
import { NextPage } from "next";
import React, { Fragment, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { useMutation, useQuery, withWunderGraph } from "../components/generated/nextjs";
import TodoItem from "../components/TodoItem";

import {
	CreateTodoResponseData,
	DeleteTodoInput,
	DeleteTodoResponseData,
	EditTodoInput,
	EditTodoResponseData,
	UpdateCompleteTodoInput,
} from "../components/generated/models";
import { TodoOrder } from "../interfaces";

const Home: NextPage = () => {
	const { mutate } = useSWRConfig();
	const allTodos = useQuery({
		operationName: "Todos",
		onSuccess: (data) => {
			setPrevTodos(data.db_findManyTodo);
		},
	});
	const updateCompleteTodo = useMutation({ operationName: "UpdateCompleteTodo" });
	const updateTodo = useMutation({ operationName: "EditTodo" });
	const updateTodoOrder = useMutation({ operationName: "UpdateTodoOrder" });

	const createTodo = useMutation({ operationName: "CreateTodo" });
	const deleteTodoOperation = useMutation({ operationName: "DeleteTodo" });

	const [title, setTitle] = useState<string>("");
	const titleRef = useRef<HTMLInputElement>();
	const [prevTodos, setPrevTodos] = useState<any>([]);

	// todo operations
	async function addTodo() {
		if (title.trim().length > 0) {
			// random id: generate random number between 95000 and 13200000
			let id: number = Math.floor(Math.random() * (13200000 - 95000 + 1) + 95000);
			let newItem = {
				id: id,
				title: title,
				completed: false,
				order: id,
			};
			let newTodos = [...allTodos.data.db_findManyTodo];
			newTodos.unshift(newItem);
			let newTodosData = { db_findManyTodo: newTodos };
			mutate(
				{ operationName: "Todos" },
				async (todos) => {
					if (todos) {
						//make deep copy of todos
						let newTodos = JSON.parse(JSON.stringify(todos));
						let savedTodo: CreateTodoResponseData = await createTodo.trigger({ title: title });
						if (savedTodo.db_createOneTodo) {
							newItem.id = savedTodo.db_createOneTodo.id;
							newItem.order = savedTodo.db_createOneTodo.id;
							newTodos.db_findManyTodo.unshift(newItem);
						}
						clearAdd();
						return newTodos;
					}
				},
				{ optimisticData: newTodosData, revalidate: true, rollbackOnError: true }
			);
		}
	}

	async function deleteTodo(id: number) {
		const deleteTodoArg: DeleteTodoInput = { id: id };
		let filteredTodos = [...allTodos.data.db_findManyTodo];
		filteredTodos = filteredTodos.filter((t) => t.id !== id);
		let remainingTodos = { db_findManyTodo: filteredTodos };
		await mutate(
			{ operationName: "Todos" },
			async (todos) => {
				//make deep copy of todos
				let filteredTodos = JSON.parse(JSON.stringify(todos));
				const deletedTodo: DeleteTodoResponseData = await deleteTodoOperation.trigger(deleteTodoArg);
				if (deletedTodo.db_deleteOneTodo) {
					filteredTodos.db_findManyTodo = filteredTodos.db_findManyTodo.filter(
						(todo) => todo.id !== deletedTodo.db_deleteOneTodo.id
					);
				}
				return filteredTodos;
			},
			{ optimisticData: remainingTodos, revalidate: true, rollbackOnError: true }
		);
	}

	async function updateCompleteStatus(updateCompleteTodoStatus: UpdateCompleteTodoInput) {
		let currentTodos = [...allTodos.data.db_findManyTodo];
		let id = updateCompleteTodoStatus.id;
		let indexToBeUpdate = currentTodos.findIndex((t) => t.id === id);
		let todoToBeUpdate = { ...currentTodos[indexToBeUpdate] };
		todoToBeUpdate.completed = updateCompleteTodoStatus.complete.set;
		currentTodos[indexToBeUpdate] = { ...todoToBeUpdate };
		let updatedTodoData = { db_findManyTodo: currentTodos };
		await mutate(
			{ operationName: "Todos" },
			async (todos) => {
				//make deep copy of todos
				let modifyTodos = JSON.parse(JSON.stringify(todos));
				let updateResponse: EditTodoResponseData = await updateCompleteTodo.trigger(updateCompleteTodoStatus);
				if (updateResponse.db_updateOneTodo) {
					modifyTodos.db_findManyTodo.map((currTodo) => {
						if (currTodo.id === updateResponse.db_updateOneTodo.id) {
							currTodo.completed = updateCompleteTodoStatus.complete.set;
						}
					});
				}
				return modifyTodos;
			},
			{ optimisticData: updatedTodoData, revalidate: true, rollbackOnError: true }
		);
	}

	async function updateTitle(updateTodoTitle: EditTodoInput) {
		let currentTodos = [...allTodos.data.db_findManyTodo];
		let id = updateTodoTitle.id;
		let indexToBeUpdate = currentTodos.findIndex((t) => t.id === id);
		let todoToBeUpdate = { ...currentTodos[indexToBeUpdate] };
		todoToBeUpdate.title = updateTodoTitle.title.set;
		currentTodos[indexToBeUpdate] = { ...todoToBeUpdate };
		let updatedTodoData = { db_findManyTodo: currentTodos };
		await mutate(
			{ operationName: "Todos" },
			async (todos) => {
				//make deep copy of todos
				let modifyTodos = JSON.parse(JSON.stringify(todos));
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
			{ optimisticData: updatedTodoData, revalidate: true, rollbackOnError: true }
		);
	}

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

		let updatedReorder = { db_findManyTodo: newItems };
		mutate(
			{ operationName: "Todos" },
			async () => {
				return { db_findManyTodo: newItems };
			},
			{ optimisticData: updatedReorder, revalidate: false, rollbackOnError: true }
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
		if (event.key === "Escape") {
			clearAdd();
		} else if (event.key === "Enter") {
			await addTodo();
		}
	}

	function clearAdd() {
		setTitle("");
		titleRef.current.blur();
	}

	return (
		<Fragment>
			<div className={"flex flex-col items-center w-full"}>
				<div className={"mt-[10%]"}>
					<div className={"mb-5 w-72"}>
						<div className={"flex items-center flex-end"}>
							<a href="https://wundergraph.com" target="_blank">
								<img src="/wundergraph.svg" className="h-12" alt="WunderGraph logo" />
							</a>
							<span className="mt-2 ml-2 text-2xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
								WunderGraph
							</span>
						</div>
					</div>
					<div className={"relative"}>
						<input
							ref={titleRef}
							placeholder={"Add todo"}
							type="text"
							onKeyDown={titleKeyHandler}
							value={title}
							onChange={(e) => {
								setTitle(e.target.value);
							}}
							className={
								"bg-gray-600 py-3 pl-5 pr-10 w-72 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75"
							}
						/>
						<div
							onClick={addTodo}
							className={"absolute right-1.5 top-3 cursor-pointer hover:bg-zinc-500 hover:rounded"}
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
					<div className={"mt-2"}>
						<div className={"absolute mt-1 -ml-1"}>
							{allTodos?.data?.db_findManyTodo && (
								<Reorder.Group
									axis="y"
									values={allTodos.data.db_findManyTodo.map((c) => c.order)}
									onReorder={handleReorder}
								>
									{allTodos?.data.db_findManyTodo.map((todo, index: number) => (
										<Reorder.Item onDragEnd={updateDragAndDropOrder} key={todo.id} value={todo.order}>
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
