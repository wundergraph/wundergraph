import { mutate } from "swr";
import { useMutation, useQuery } from "../components/generated/nextjs";
import { Todos } from "../types";

function useAddMutation() {
	const { data } = useQuery({ operationName: "Todos" });
	const todos = data?.todos;

	const createTodo = useMutation({
		operationName: "CreateTodo",
	});

	function getNextMaxOrder(todos: Todos) {
		if (!todos || todos.length === 0) {
			return 1;
		}
		return todos[todos.length - 1].order + 1;
	}

	const trigger: typeof createTodo.trigger = async (input) => {
		const order = getNextMaxOrder(todos);

		if (!input?.title) {
			return;
		}

		const newTodos = todos ? [...todos] : [];

		newTodos.push({
			id: Math.floor(Math.random() * (13200000 - 95000 + 1) + 95000),
			title: input?.title,
			completed: false,
			order,
		});

		// we optimistically update the cache with the new todo.
		return mutate(
			{ operationName: "Todos" },
			() => {
				return createTodo.trigger(input);
			},
			{
				optimisticData: {
					todos: newTodos,
				},
				populateCache: false,
				revalidate: true,
				rollbackOnError: true,
			}
		);
	};

	return {
		...createTodo,
		trigger,
	};
}

export default useAddMutation;
