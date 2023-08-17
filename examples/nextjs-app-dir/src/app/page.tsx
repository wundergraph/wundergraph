import { Todo } from '@/components/Todo';
import { client } from '@/lib/wundergraph';
import { revalidatePath } from 'next/cache';

export default async function Home() {
	const todos = await client.query({
		operationName: 'allTodos',
	});

	const addTodo = async (data: FormData) => {
		'use server';

		const newTodo = {
			text: (data.get('new-todo') ?? '') as string,
		};

		await client.mutate({
			operationName: 'addTodo',
			input: newTodo,
		});

		revalidatePath('/');
	};

	return (
		<main>
			<div className="bg-gray-100 min-h-screen py-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<h1 className="text-4xl font-bold text-center mb-6 text-gray-800">WunderGraph TodoList</h1>
					<div className="bg-white rounded-lg shadow p-6">
						<h1 className="text-2xl font-semibold mb-4 text-gray-700">Todo List</h1>
						{todos?.data?.todos_todos?.map((todo, index) =>
							todo ? <Todo key={index.toString()} data={todo} /> : null
						)}
						<div className="flex items-center">
							<form action={addTodo}>
								<input
									type="text"
									name="new-todo"
									placeholder="New todo text"
									className="form-input flex-grow rounded-l-lg border-r-0 focus:ring-0 focus:border-indigo-300 p-2"
								/>
								<button
									type="submit"
									className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-r-lg hover:bg-indigo-500 focus:outline-none"
								>
									Add Todo
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
