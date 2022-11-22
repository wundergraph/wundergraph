import { NextPage } from 'next';
import { withWunderGraph, useMutation, useQuery } from '../components/generated/nextjs';
import { useState } from 'react';

const Home: NextPage = () => {
	const [title, setTitle] = useState<string>('');
	const [isEdit, setIsEdit] = useState<boolean>(false);
	const [editObject, setEditObject] = useState<{ id: number; title: string }>(null);
	const todos = useQuery({
		operationName: 'Todos',
		liveQuery: true,
	});
	const createTodo = useMutation({
		operationName: 'CreateTodo',
	});
	const deleteTodoOperation = useMutation({
		operationName: 'DeleteTodo',
	});

	const enableEdit = (id: number, title: string) => {
		setIsEdit(true);
		setEditObject({ id: id, title: title });
		setTitle(title);
	};
	async function Add() {
		await createTodo.trigger({
			title: title,
		});
		setTitle('');
	}
	async function deleteTodo(id: number) {
		const deleteResult = await deleteTodoOperation.trigger({ id: id });
		if (!deleteResult.db_deleteOneTodo) {
			alert('Oops! Delete Failed');
		}
	}

	return (
		<div>
			<div>
				<input
					style={{
						background: 'greenyellow',
					}}
					type={'text'}
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>
				<button
					onClick={Add}
					style={{
						marginLeft: '10px',
						background: 'orange',
					}}
				>
					Save
				</button>
			</div>

			<ul>
				{todos?.data?.db_findManyTodo?.map((todo, index) => {
					return (
						<div key={todo.id}>
							<li
								onClick={() => {
									enableEdit(todo.id, todo.title);
								}}
							>
								{index + 1}) {todo.title}
							</li>
							<div>
								<button
									onClick={() => {
										deleteTodo(todo.id);
									}}
								>
									Delete
								</button>
							</div>
						</div>
					);
				})}
			</ul>
		</div>
	);
};

export default withWunderGraph(Home);
