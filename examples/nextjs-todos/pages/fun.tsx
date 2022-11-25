import { Reorder } from 'framer-motion';
import { useQuery } from '../components/generated/nextjs';
import { mutate } from 'swr';

function Fun() {
	const todos = useQuery({
		operationName: 'Todos',
	});
	async function handleReorder(newOrder) {
		// await mutate({operationName: 'Todos'}, async (allTodos) => {
		// 	if (allTodos) {
		// 		let newTodos = JSON.parse(JSON.stringify(allTodos));
		// 		newTodos.db_findManyTodo = newTodos.db_findManyTodo.map((todo, index) => {
		// 			todo.order = newOrder[index];
		// 			return todo;
		// 		})
		// 	}
		// },{revalidate: false, rollbackOnError: true})
	}
	if (!todos.data || !todos.data.db_findManyTodo) {
		return <div>loading..</div>;
	}
	return (
		<div>
			<Reorder.Group axis="y" values={todos.data.db_findManyTodo.map((e) => e.id)} onReorder={handleReorder}>
				{todos.data.db_findManyTodo.map((item) => (
					<Reorder.Item key={item.order} value={item.order}>
						{item.title}
					</Reorder.Item>
				))}
			</Reorder.Group>
		</div>
	);
}
export default Fun;
