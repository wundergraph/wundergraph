import { useSWRConfig } from 'swr';
import { useMutation, useQuery } from '../components/generated/nextjs';

function useDeleteTodoMutation() {
	const { mutate } = useSWRConfig();
	const { data } = useQuery({ operationName: 'Todos' });
	const deleteTodo = useMutation({ operationName: 'DeleteTodo' });

	const trigger: typeof deleteTodo.trigger = async (input, options) => {
		const filteredTodos = data?.todos.filter((t) => t.id !== input?.id) || [];

		return await mutate(
			{
				operationName: 'Todos',
			},
			() => {
				return deleteTodo.trigger(input, options);
			},
			{
				optimisticData: {
					todos: filteredTodos,
				},
				populateCache: false,
				revalidate: true,
				rollbackOnError: true,
			}
		);
	};

	return {
		...deleteTodo,
		trigger,
	};
}

export default useDeleteTodoMutation;
