import {EditTodoResponseData} from "../components/generated/models";
import {mutate} from "swr";
import {useMutation} from "../components/generated/nextjs";

function useUpdateTitleMutation () {
    const updateTodo = useMutation({ operationName: "EditTodo" });
    return function ({updateTodoTitle, allTodos}) {
        return new Promise(async (resolve) => {
            let currentTodos = [...allTodos.data.db_findManyTodo];
            let id = updateTodoTitle.id;
            let indexToBeUpdate = currentTodos.findIndex((t) => t.id === id);
            let todoToBeUpdate = {...currentTodos[indexToBeUpdate]};
            todoToBeUpdate.title = updateTodoTitle.title.set;
            currentTodos[indexToBeUpdate] = {...todoToBeUpdate};
            let updatedTodoData = {db_findManyTodo: currentTodos};
            let updateResponse: EditTodoResponseData;
            await mutate(
                {operationName: "Todos"},
                async (todos) => {
                    //make deep copy of todos
                    let modifyTodos = JSON.parse(JSON.stringify(todos));
                    updateResponse = await updateTodo.trigger(updateTodoTitle);
                    if (updateResponse.db_updateOneTodo) {
                        modifyTodos.db_findManyTodo.map((currTodo) => {
                            if (currTodo.id === updateResponse.db_updateOneTodo.id) {
                                currTodo.title = updateTodoTitle.title.set;
                            }
                        });
                    }
                    return modifyTodos;
                },
                {optimisticData: updatedTodoData, revalidate: true, rollbackOnError: true}
            );
            resolve(updateResponse)
        })
    }
}
export default useUpdateTitleMutation