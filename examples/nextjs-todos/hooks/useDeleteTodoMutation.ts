import {DeleteTodoInput, DeleteTodoResponseData} from "../components/generated/models";
import {useMutation} from "../components/generated/nextjs";
import {mutate} from "swr";

function useDeleteTodoMutation () {
    const deleteTodo = useMutation({ operationName: "DeleteTodo" });
    return function ({id, allTodos}) {
        return new Promise(async (resolve) => {
            const deleteTodoArg: DeleteTodoInput = { id: id };
            let filteredTodos = [...allTodos.data.db_findManyTodo];
            filteredTodos = filteredTodos.filter((t) => t.id !== id);
            let remainingTodos = { db_findManyTodo: filteredTodos };
            let deletedTodo: DeleteTodoResponseData;
            await mutate(
                { operationName: "Todos" },
                async (todos) => {
                    //make deep copy of todos
                    let filteredTodos = JSON.parse(JSON.stringify(todos));
                    deletedTodo = await deleteTodo.trigger(deleteTodoArg);
                    if (deletedTodo.db_deleteOneTodo) {
                        filteredTodos.db_findManyTodo = filteredTodos.db_findManyTodo.filter(
                            (todo) => todo.id !== deletedTodo.db_deleteOneTodo.id
                        );
                    }
                    return filteredTodos;
                },
                { optimisticData: remainingTodos, revalidate: true, rollbackOnError: true }
            );
            resolve(deletedTodo)
        })
    }
}
export default useDeleteTodoMutation

