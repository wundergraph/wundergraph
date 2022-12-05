import { useSWRConfig } from 'swr';
import { useMutation, useQuery } from '../components/generated/nextjs';

function useUpdateCompleteStatusMutation() {
	const { mutate } = useSWRConfig();
	const { data } = useQuery({ operationName: 'Todos' });
	const todos = data?.todos;
	const updateCompleteTodo = useMutation({ operationName: 'UpdateCompleteTodo' });

	const trigger: typeof updateCompleteTodo.trigger = async (input, options) => {
		if (!todos || !input) {
			return updateCompleteTodo.trigger(input, options);
		}
		const updatedTodos = [...todos];
		const item = updatedTodos.find((t) => t.id === input?.id);

		if (item) {
			item.completed = input.complete;
		}

		mutate(
			{
				operationName: 'Todos',
			},
			() => {
				return updateCompleteTodo.trigger(input, options);
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
		...updateCompleteTodo,
		trigger,
	};
}

export default useUpdateCompleteStatusMutation;
