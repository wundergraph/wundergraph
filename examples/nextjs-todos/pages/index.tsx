import { NextPage } from 'next';
import { withWunderGraph, useMutation, useQuery } from '../components/generated/nextjs';
import { Fragment, useRef, useState } from 'react';
import { EditTodoInput, UpdateCompleteTodoInput } from '../components/generated/models';

const Home: NextPage = () => {
	const [title, setTitle] = useState('');
	const titleRef = useRef();
	const todos = useQuery({
		operationName: 'Todos',
		liveQuery: true,
		// onError(error) {
		// 	alert(error.message);
		// }
	});
	const createTodo = useMutation({
		operationName: 'CreateTodo',
	});

	async function addTodo() {
		if (title.trim().length > 0) {
			let createTodoResponse = await createTodo.trigger({
				title: title,
			});
			if (!createTodoResponse.db_createOneTodo) {
				alert('Oops! Add failed');
			} else {
				cancelAdd();
			}
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
			<div className={'w-full bg-zinc-700'}>
				<div className={'flex flex-col justify-center items-center h-full'}>
					<div className="relative">
						<input
							ref={titleRef}
							placeholder={'Add todo'}
							onKeyDown={titleKeyHandler}
							value={title}
							onChange={(e) => {
								setTitle(e.target.value);
							}}
							type="text"
							className=" py-3 px-8 rounded-md text-sm bg-gray-200"
						/>
						<div className="absolute inset-y-0 right-0 flex items-center cursor-pointer z-20 pr-4">
							<div
								onClick={addTodo}
								className={'flex flex-col justify-center p-1 ml-2 cursor-pointer hover:bg-zinc-300 hover:rounded'}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="black"
									className="w-6 h-6"
								>
									<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
								</svg>
							</div>
						</div>
					</div>
					<br />
					<ul>
						{todos?.data?.db_findManyTodo?.map((todo, index) => {
							return (
								<div key={todo.id}>
									<TodoItem todo={todo} lastItem={index === todos.data.db_findManyTodo.length - 1} />
								</div>
							);
						})}
					</ul>
				</div>
			</div>
		</Fragment>
	);
};

function TodoItem({ todo, lastItem }: any) {
	const titleRef = useRef();
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
		setCurrentTodo({
			...currentTodo,
			completed: newCheckedStatus,
		});
		let updateCompleteTodoStatus: UpdateCompleteTodoInput = {
			id: currentTodo.id,
			complete: {
				set: newCheckedStatus,
			},
		};
		let updateCompleteTodoStatusResponse = await updateCompleteTodo.trigger(updateCompleteTodoStatus);

		if (!updateCompleteTodoStatusResponse.db_updateOneTodo) {
			alert('Oops! Update Failed');
			setCurrentTodo({
				...currentTodo,
				completed: !newCheckedStatus,
			});
		}
	}

	async function deleteTodo(id: number) {
		const deleteResult = await deleteTodoOperation.trigger({ id: id });
		if (!deleteResult.db_deleteOneTodo) {
			alert('Oops! Delete failed');
		}
	}

	async function editTodo() {
		if (currentTodo.title.trim().length > 0) {
			let updateTodoTitle: EditTodoInput = {
				id: currentTodo.id,
				title: {
					set: currentTodo.title,
				},
			};
			let updateTodoTitleResponse = await updateTodo.trigger(updateTodoTitle);
			if (updateTodoTitleResponse.db_updateOneTodo) {
				setEditMode(false);
			} else {
				alert('Oops! Update Failed');
			}
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

	return (
		<Fragment>
			<div
				className={`hover:bg-zinc-600 hover:rounded flex justify-between py-2 px-8 m-2 ${
					!lastItem ? `border-solid border-0 border-b border-zinc-500` : ''
				}`}
			>
				{editMode ? (
					<div>
						<input
							ref={titleRef}
							type="text"
							onKeyDown={titleKeyHandler}
							value={currentTodo.title}
							onChange={(e) => {
								setCurrentTodo({
									...currentTodo,
									title: e.target.value,
								});
							}}
							className="py-2 px-4 rounded-md text-sm bg-zinc-400 text-white bg-opacity-50 bg-transparent border-none"
						/>
					</div>
				) : (
					<div className="flex items-center mb-2">
						<input
							type="checkbox"
							onChange={updateCompletedStatus}
							checked={currentTodo.completed}
							className="text-indigo-600 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 w-4 h-4 rounded accent-green-300 text-gray-200 "
						/>
						<label
							onClick={() => setEditMode(true)}
							className={`cursor-pointer ml-3 text-sm font-medium text-gray-300 ${
								currentTodo.completed ? 'line-through' : ''
							}`}
						>
							{todo.title}
						</label>
					</div>
				)}

				{editMode ? (
					<div
						onClick={editTodo}
						className={'flex flex-col justify-center ml-2 cursor-pointer hover:bg-zinc-500 hover:rounded'}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="#fafafa"
							className="w-6 h-6"
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
					</div>
				) : (
					<div
						onClick={() => deleteTodo(todo.id)}
						className={'flex flex-col justify-center ml-2 cursor-pointer hover:bg-zinc-500 hover:rounded'}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="#fafafa"
							className="w-5 h-5"
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
				)}
			</div>
		</Fragment>
	);
}

export default withWunderGraph(Home);
