import {EditTodoResponseData} from "../components/generated/models";
import {mutate} from "swr";
import {useMutation} from "../components/generated/nextjs";

function useUpdateCompleteStatusMutation () {
    const updateCompleteTodo = useMutation({ operationName: "UpdateCompleteTodo" });
    return function ({updateCompleteTodoStatus, allTodos}) {
        return new Promise(async (resolve) => {
            let currentTodos = [...allTodos.data.db_findManyTodo];
            let id = updateCompleteTodoStatus.id;
            let indexToBeUpdate = currentTodos.findIndex((t) => t.id === id);
            let todoToBeUpdate = { ...currentTodos[indexToBeUpdate] };
            todoToBeUpdate.completed = updateCompleteTodoStatus.complete.set;
            currentTodos[indexToBeUpdate] = { ...todoToBeUpdate };
            let updatedTodoData = { db_findManyTodo: currentTodos };
            let updateResponse: EditTodoResponseData;
            await mutate(
                { operationName: "Todos" },
                async (todos) => {
                    //make deep copy of todos
                    let modifyTodos = JSON.parse(JSON.stringify(todos));
                    updateResponse = await updateCompleteTodo.trigger(updateCompleteTodoStatus);
                    if (updateResponse.db_updateOneTodo) {
                        modifyTodos.db_findManyTodo.map((currTodo) => {
                            if (currTodo.id === updateResponse.db_updateOneTodo.id) {
                                currTodo.completed = updateCompleteTodoStatus.complete.set;
                            }
                        });
                    }
                    return modifyTodos;
                },
                { optimisticData: updatedTodoData, revalidate: true, rollbackOnError: true }
            );
            resolve(updateResponse)
        })
    }
}
export default useUpdateCompleteStatusMutation