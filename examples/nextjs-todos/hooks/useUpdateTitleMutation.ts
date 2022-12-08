import { useSWRConfig } from 'swr';
import { useMutation, useQuery } from '../components/generated/nextjs';

function useUpdateTitleMutation() {
	const { mutate } = useSWRConfig();
	const { data } = useQuery({ operationName: 'Todos' });
	const todos = data?.todos;

	const updateTodo = useMutation({ operationName: 'EditTodo' });

	const trigger: typeof updateTodo.trigger = async (input, options) => {
		if (!todos || !input) {
			return updateTodo.trigger(input, options);
		}
		const updatedTodos = [...todos];
		const item = updatedTodos.find((t) => t.id === input?.id);

		if (item) {
			item.title = input.title;
		}

		await mutate(
			{
				operationName: 'Todos',
			},
			async () => {
				return updateTodo.trigger(input, options);
			},
			{
				optimisticData: {
					todos: updatedTodos,
				},
				populateCache: false,
				revalidate: true,
				rollbackOnError: true,
				...options,
			}
		);
	};

	return {
		...updateTodo,
		trigger,
	};
}

export default useUpdateTitleMutation;
