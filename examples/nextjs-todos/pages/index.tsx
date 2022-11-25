import { NextPage } from 'next';
import { withWunderGraph, useQuery, useMutation } from '../components/generated/nextjs';
import React, { Fragment, useRef, useState } from 'react';
import TodoItem from '../components/TodoItem';
import NavBar from '../components/Navbar';
import { mutate } from 'swr';

const Home: NextPage = () => {
	const [title, setTitle] = useState<string>('');
	const titleRef = useRef<HTMLInputElement>();
	const todos = useQuery({
		operationName: 'Todos',
	});

	const createTodo = useMutation({ operationName: 'CreateTodo' });

	async function addTodo() {
		if (title.trim().length > 0) {
			mutate(
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
				{ revalidate: false, rollbackOnError: true }
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
					<div className={'absolute mt-2'}>
						{todos?.data?.db_findManyTodo?.map((todo, index: number) => (
							<TodoItem key={todo.id} todo={todo} lastItem={index === todos.data.db_findManyTodo.length - 1} />
						))}
					</div>
				</div>
			</div>
		</Fragment>
	);
};

export default withWunderGraph(Home);
