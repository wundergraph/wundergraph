import {useMutation} from "../components/generated/nextjs";
import {CreateTodoResponseData} from "../components/generated/models";
import {mutate} from "swr";

function useAddMutation () {
    const createTodo = useMutation({ operationName: "CreateTodo" });
    return function ({title, allTodos}) {
        return new Promise(async (resolve) => {
            // random id: generate random number between 95000 and 13200000
            let id: number = Math.floor(Math.random() * (13200000 - 95000 + 1) + 95000);
            let newItem = {
                id: id,
                title: title,
                completed: false,
                order: id,
            };
            let newTodos = [...allTodos.data.db_findManyTodo];
            newTodos.unshift(newItem);
            let newTodosData = { db_findManyTodo: newTodos };
            let savedTodo: CreateTodoResponseData
            await mutate(
                { operationName: "Todos" },
                async (todos) => {
                    if (todos) {
                        //make deep copy of todos
                        let newTodos = JSON.parse(JSON.stringify(todos));
                        savedTodo = await createTodo.trigger({ title: title });
                        if (savedTodo.db_createOneTodo) {
                            newItem.id = savedTodo.db_createOneTodo.id;
                            newItem.order = savedTodo.db_createOneTodo.id;
                            newTodos.db_findManyTodo.unshift(newItem);
                        }
                        return newTodos;
                    }
                },
                { optimisticData: newTodosData, revalidate: true, rollbackOnError: true }
            );
            resolve(savedTodo);
        })
    }
}
export default useAddMutation