import { useMutation } from '../components/generated/nextjs';
import { useSWRConfig } from 'swr';

function useReorderTodoMutation() {
	const { mutate } = useSWRConfig();
	const mutation = useMutation({
		operationName: 'UpdateTodoOrder',
		onSuccess() {
			mutate({ operationName: 'Todos' });
		},
		onError() {
			mutate({ operationName: 'Todos' });
		},
	});
	return mutation;
}

export default useReorderTodoMutation;
