import { Reorder } from "framer-motion";
import { NextPage } from "next";
import React, { Fragment, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { useMutation, useQuery, withWunderGraph } from "../components/generated/nextjs";
import TodoItem from "../components/TodoItem";

import { TodoOrder } from "../interfaces";
import useAddMutation from "../hooks/useAddTodoMutation";

const Home: NextPage = () => {
	const { mutate } = useSWRConfig();
	const createTodo = useAddMutation();
	const allTodos = useQuery({
		operationName: "Todos",
		onSuccess: (data) => {
			setPrevTodos(data.db_findManyTodo);
		},
	});
	const updateTodoOrder = useMutation({ operationName: "UpdateTodoOrder" });

	const [title, setTitle] = useState<string>("");
	const titleRef = useRef<HTMLInputElement>();
	const [prevTodos, setPrevTodos] = useState<any>([]);

	async function addTodo() {
		if (title.trim().length > 0) {
			await createTodo({ title, allTodos });
			clearAdd();
		}
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
			<div className="flex flex-col items-center w-full">
				<div className="mt-[10%]">
					<div className="mb-5 w-72">
						<div className="flex items-center flex-end">
							<a href="https://wundergraph.com" target="_blank">
								<img src="/wundergraph.svg" className="h-12" alt="WunderGraph logo" />
							</a>
							<span className="mt-2 ml-2 text-2xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
								WunderGraph
							</span>
						</div>
					</div>
					<div className="relative">
						<input
							ref={titleRef}
							placeholder="Add todo"
							type="text"
							onKeyDown={titleKeyHandler}
							value={title}
							onChange={(e) => {
								setTitle(e.target.value);
							}}
							className="bg-gray-600 py-3 pl-5 pr-10 w-72 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75"
						/>
						<div onClick={addTodo} className="absolute right-1.5 top-3 cursor-pointer hover:bg-zinc-500 hover:rounded">
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
					<div className="mt-2">
						<div className="absolute mt-1 -ml-1">
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
												allTodos={allTodos}
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
