import { NextPage } from 'next';
import { withWunderGraph, useQuery, useMutation } from '../components/generated/nextjs';
import React, { Fragment, useRef, useState } from 'react';
import TodoItem from '../components/TodoItem';
import NavBar from '../components/Navbar';
import { mutate } from 'swr';
import { Reorder } from 'framer-motion';
import { db_IntFieldUpdateOperationsInput } from '../components/generated/models';
interface TodoOrder {
	id: number;
	order: db_IntFieldUpdateOperationsInput;
}

const Home: NextPage = () => {
	const createTodo = useMutation({ operationName: 'CreateTodo' });
	const updateTodoOrder = useMutation({ operationName: 'UpdateTodoOrder' });

	const [title, setTitle] = useState<string>('');
	const titleRef = useRef<HTMLInputElement>();
	const [currentTodos, setCurrentTodos] = useState<any>([]);
	const [prevTodos, setPrevTodos] = useState<any>([]);

	useQuery({
		operationName: 'Todos',
		onSuccess: (data) => {
			setCurrentTodos(data.db_findManyTodo);
			setPrevTodos(data.db_findManyTodo);
		},
	});

	async function addTodo() {
		if (title.trim().length > 0) {
			await mutate(
				{ operationName: 'Todos' },
				async (todos) => {
					if (todos) {
						//make deep copy of todos
						let newTodos = JSON.parse(JSON.stringify(todos));
						let savedTodo = await createTodo.trigger({ title: title });
						if (savedTodo.db_createOneTodo) {
							let saveItem = {
								id: savedTodo.db_createOneTodo.id,
								title: title,
								completed: false,
								order: savedTodo.db_createOneTodo.id,
							};
							newTodos.db_findManyTodo.push(saveItem);
						}
						clearAdd();
						return newTodos;
					}
				},
				{ revalidate: true, rollbackOnError: true }
			);
		}
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

	function handleReorder(newOrder) {
		let newItems = [];
		let itemsMap = new Map();

		for (let i = 0; i < currentTodos.length; i++) {
			let item = currentTodos[i];
			itemsMap.set(item.order, item);
		}
		for (let i = 0; i < newOrder.length; i++) {
			newItems.push(itemsMap.get(newOrder[i]));
		}
		setCurrentTodos([...newItems]);
	}
	async function updateDragAndDropOrder() {
		let newOrder: TodoOrder[] = [];
		for (let i = 0; i < currentTodos.length; i++) {
			let item = currentTodos[i];
			let order = { id: item.id, order: { set: prevTodos[i].order } };
			newOrder.push(order);
		}
		await Promise.all(newOrder.map((item: TodoOrder) => updateTodoOrder.trigger(item)));
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
							<Reorder.Group axis="y" values={currentTodos.map((c) => c.order)} onReorder={handleReorder}>
								{currentTodos.map((todo, index: number) => (
									<Reorder.Item onDragEnd={updateDragAndDropOrder} key={todo.order} value={todo.order}>
										<TodoItem todo={todo} lastItem={index === currentTodos.length - 1} />
									</Reorder.Item>
								))}
							</Reorder.Group>
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	);
};

export default withWunderGraph(Home);
