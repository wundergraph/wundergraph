import {useMutation} from "../components/generated/nextjs";
import {CreateTodoResponseData} from "../components/generated/models";
import {mutate} from "swr";

function useAddMutation() {
    const createTodo = useMutation({operationName: "CreateTodo"});

    function getNextMaxOrder(allTodos) {
        if (allTodos.data.db_findManyTodo.length === 0) {
            return 1;
        }
        //max order + 1, for sorted order desc first element is the max order
        return allTodos.data.db_findManyTodo[0].order + 1;
    }

    return function ({title, allTodos}) {
        return new Promise(async (resolve) => {
            // random id: generate random number between 95000 and 13200000
            let id: number = Math.floor(Math.random() * (13200000 - 95000 + 1) + 95000);
            let order: number = allTodos.data.db_findManyTodo.length;
            let newItem = {
                id: id,
                title: title,
                completed: false,
                order: order
            };
            let newTodos = [...allTodos.data.db_findManyTodo];
            newTodos.unshift(newItem);
            let newTodosData = {db_findManyTodo: newTodos};
            let savedTodo: CreateTodoResponseData;
            await mutate(
                {operationName: "Todos"},
                async (todos) => {
                    if (todos) {
                        //make deep copy of todos
                        let newTodos = JSON.parse(JSON.stringify(todos));
                        savedTodo = await createTodo.trigger({title: title, order: getNextMaxOrder(allTodos)});
                        if (savedTodo.db_createOneTodo) {
                            newItem.id = savedTodo.db_createOneTodo.id;
                            newItem.order = savedTodo.db_createOneTodo.id;
                            newTodos.db_findManyTodo.unshift(newItem);
                        }
                        return newTodos;
                    }
                },
                {optimisticData: newTodosData, revalidate: true, rollbackOnError: true}
            );
            resolve(savedTodo);
        });
    };
}

export default useAddMutation;