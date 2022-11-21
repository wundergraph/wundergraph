import { NextPage } from 'next';
import { useMutation, useQuery } from '../lib/react-query';
import Nav from '../components/Nav';
import { hasura_todos_pk_columns_input } from '../components/generated/models';

const Home: NextPage = () => {
	const {
		data: todos,
		isLoading,
		isError,
		error: todosError,
	} = useQuery({
		operationName: 'Todos',
		liveQuery: true,
	});
	const { mutateAsync: createTodoOperation } = useMutation({
		operationName: 'CreateTodo',
	});
	const { mutateAsync: deleteTodoOperation } = useMutation({
		operationName: 'DeleteTodo',
	});
	const { mutateAsync: editTodoOperation } = useMutation({
		operationName: 'EditTodo',
	});

	const addTodo = async () => {
		const value = window.prompt('Enter Todo title');
		if (value && value.trim().length > 0) {
			let savedTodo = await createTodoOperation({ title: value });
			if (!savedTodo.hasura_insert_todos_one) {
				alert('Oops! Add failed');
			}
		}
	};
	const deleteTodo = async (id: number) => {
		const confirmDelete = window.confirm('Are you sure you want to delete? ');
		if (confirmDelete) {
			let deleteResult = await deleteTodoOperation({ id: id });
			if (!deleteResult.hasura_delete_todos_by_pk) {
				alert('Oops! Delete failed');
			}
		}
	};
	const editTodo = async (id: number, title: string) => {
		let editId: hasura_todos_pk_columns_input = { id: id };
		const newValue = window.prompt('', title);
		if (newValue) {
			let editResult = await editTodoOperation({ id: editId, title: newValue });
			if (!editResult.hasura_update_todos_by_pk) {
				alert('Oops! Edit failed');
			}
		}
	};

	return (
		<div className={'w-full h-screen'}>
			<Nav />
			<div className="relative max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-20">
				<div className={'flex flex-col items-center h-screen'}>
					{/*Welcome message*/}
					<h1 className={'mb-4 text-4xl font-extrabold md:text-5xl lg:text-5xl'}>
						{' '}
						Welcome to{' '}
						<span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
							{' '}
							React Query
						</span>{' '}
						with
					</h1>
					<h1 className={'mb-4 text-4xl font-extrabold md:text-5xl lg:text-5xl'}>
						<span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
							{' '}
							WunderGraph
						</span>
					</h1>
					{!isError && (
						<>
							{!isLoading && (
								<button
									onClick={addTodo}
									className="flex bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-full"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="w-6 h-6"
									>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
									</svg>
									Add
								</button>
							)}
							<div className={'mt-5 grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-6'}>
								{isLoading && (
									<div role="status">
										<svg
											className="inline mr-2 w-8 h-8 text-gray-200 animate-spin fill-blue-600"
											viewBox="0 0 100 101"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
												fill="currentColor"
											/>
											<path
												d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
												fill="currentFill"
											/>
										</svg>
									</div>
								)}
								{todos?.hasura_todos?.map((todo) => {
									return (
										<span
											key={todo.id}
											className="divide-gray-400 divide-x px-4 py-4 rounded-full text-gray-800 bg-blue-200 font-semibold text-sm flex align-center w-max cursor-pointer active:bg-gray-300 transition duration-300 ease"
										>
											{todo.title}
											<span className={'mr-2'}></span>
											<button>
												<div className={'grid grid-cols-2'}>
													<svg
														onClick={() => editTodo(todo.id, todo.title)}
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth={1.5}
														stroke="currentColor"
														className="w-5 h-4"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
														/>
													</svg>

													<svg
														onClick={() => {
															deleteTodo(todo.id);
														}}
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														strokeWidth={1.5}
														stroke="currentColor"
														className="w-5 h-4"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
														/>
													</svg>
												</div>
											</button>
										</span>
									);
								})}
							</div>
						</>
					)}

					{isError && <div>{JSON.stringify(todosError)}</div>}
				</div>
			</div>
		</div>
	);
};
export default Home;
