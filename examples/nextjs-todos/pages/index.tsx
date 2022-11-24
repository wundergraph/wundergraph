import { NextPage } from 'next';
import { withWunderGraph, useQuery, useMutation } from '../components/generated/nextjs';
import { Fragment, useRef, useState } from 'react';
import { EditTodoInput, EditTodoResponseData, UpdateCompleteTodoInput } from '../components/generated/models';
import { mutate } from 'swr';

const Home: NextPage = () => {
	const [title, setTitle] = useState('');
	const titleRef = useRef();

	const todos = useQuery({
		operationName: 'Todos',
	});
	const createTodo = useMutation({
		operationName: 'CreateTodo',
	});

	async function addTodo() {
		if (title.trim().length > 0) {
			let addTodoData = { title: title };
			await mutate(
				{
					operationName: 'Todos',
				},
				async () => {
					const result = await createTodo.trigger(addTodoData);
					cancelAdd();
					return {
						getTodo: result.db_createOneTodo,
					};
				},
				{
					optimisticData: {
						getTodo: addTodoData,
					},
					rollbackOnError: true,
				}
			);
		}
	}

	async function titleKeyHandler(event) {
		if (event.key === 'Escape') {
			// @ts-ignore
			titleRef.current.blur();
		} else if (event.key === 'Enter') {
			await addTodo();
		}
	}

	function cancelAdd() {
		setTitle('');
	}

	return (
		<Fragment>
			<NavBar />
			<div className={`flex flex-col items-center h-[200vh] w-full bg-gray-900`}>
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
							className="
							mb-2
							bg-gray-600
							py-3 pl-5 pr-10 w-72 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75"
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
						{todos?.data?.db_findManyTodo?.map((todo, index) => {
							return (
								<div key={todo.id}>
									<TodoItem todo={todo} lastItem={index === todos.data.db_findManyTodo.length - 1} />
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</Fragment>
	);
};

function TodoItem({ todo, lastItem }: any) {
	const [currentTodo, setCurrentTodo] = useState(todo);
	const [editMode, setEditMode] = useState(false);

	const updateCompleteTodo = useMutation({
		operationName: 'UpdateCompleteTodo',
	});
	const deleteTodoOperation = useMutation({
		operationName: 'DeleteTodo',
	});
	const updateTodo = useMutation({ operationName: 'EditTodo' });

	async function updateCompletedStatus(e) {
		let newCheckedStatus: boolean = e.target.checked;
		let updateCompleteTodoStatus: UpdateCompleteTodoInput = {
			id: currentTodo.id,
			complete: {
				set: newCheckedStatus,
			},
		};
		await mutate({ operationName: 'Todos' }, async (todos) => {
			const updatedCompleteTodoStatus = await updateCompleteTodo.trigger(updateCompleteTodoStatus);
			let updatedTodos = todos.db_findManyTodo.map((todo) => {
				if (todo.id === updatedCompleteTodoStatus.db_updateOneTodo.id) {
					return updatedCompleteTodoStatus.db_updateOneTodo;
				}
				return todo;
			});
			return updatedTodos;
		});
	}
	async function deleteTodo(id: number) {
		const deleteTodoArg = { id: id };
		await mutate(
			{
				operationName: 'Todos',
			},
			async (todos) => {
				const deletedTodo = await deleteTodoOperation.trigger(deleteTodoArg);
				let filteredTodos = todos.db_findManyTodo.filter((todo) => todo.id !== deletedTodo.db_deleteOneTodo.id);
				return filteredTodos;
			}
		);
	}

	async function editTodo() {
		if (currentTodo.title.trim().length > 0) {
			let updateTodoTitle: EditTodoInput = {
				id: currentTodo.id,
				title: {
					set: currentTodo.title,
				},
			};
			await mutate({ operationName: 'Todos' }, async (todos) => {
				const updatedTodo = await updateTodo.trigger(updateTodoTitle);
				let updatedTodos = todos.db_findManyTodo.map((todo) => {
					if (todo.id === updatedTodo.db_updateOneTodo.id) {
						return updatedTodo.db_updateOneTodo;
					}
					return todo;
				});
				return updatedTodos;
			});
		}
	}

	function cancelEdit() {
		setCurrentTodo({
			...currentTodo,
			title: todo.title,
		});
		setEditMode(false);
	}

	async function titleKeyHandler(event) {
		if (event.key === 'Escape') {
			cancelEdit();
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
					className={`
					flex justify-between pt-4 pb-2 m-2 px-2 hover:px-3 w-72 hover:bg-zinc-600 hover:rounded 
					${!lastItem ? `border-solid border-0 border-b border-zinc-500` : ''}`}
				>
					<Fragment>
						<div className="flex items-center mb-2">
							<input
								type="checkbox"
								onChange={updateCompletedStatus}
								checked={currentTodo.completed}
								className={'h-4 w-4 rounded-full accent-pink-500'}
							/>
							<div
								onClick={enableEditMode}
								className={`cursor-pointer ml-3 text-sm font-medium text-gray-300  ${
									currentTodo.completed ? 'line-through' : ''
								}`}
							>
								<span className={'break-all'}>{todo.title}</span>
							</div>
						</div>
						<div onClick={() => deleteTodo(todo.id)} className={'flex flex-col justify-start ml-2 cursor-pointer'}>
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
							className={`${editMode ? 'mb-1' : ''}
							${currentTodo.completed ? 'line-through' : ''}
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

function NavBar() {
	return (
		<nav className="px-2 py-2.5 sm:px-4 bg-gray-900 border-solid border-0 border-b border-zinc-700">
			<div>
				<div className="flex items-center px-5 py-2">
					<a href="https://wundergraph.com" target="_blank">
						<img src="/wundergraph.svg" className="h-12 pr-3" alt="WunderGraph logo" />
					</a>
					<span className="self-center text-xl font-semibold whitespace-nowrap bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
						WunderGraph
					</span>
				</div>
			</div>
		</nav>
	);
}

export default withWunderGraph(Home);
