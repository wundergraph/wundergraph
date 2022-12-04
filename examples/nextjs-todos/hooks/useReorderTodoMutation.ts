import {useMutation} from "../components/generated/nextjs";
import {
    ReorderTodosDragDownResponseData, ReorderTodosDragUpInput,
    ReorderTodosDragUpResponseData,
    UpdateTodoOrderInput, UpdateTodoOrderResponseData
} from "../components/generated/models";
import {ReorderTodosDragDownInput} from "../.wundergraph/generated/models";

function useReorderTodoMutation() {
    const reorderTodosDragDown = useMutation({operationName: "ReorderTodosDragDown"});
    const reorderTodosDragUp = useMutation({operationName: "ReorderTodosDragUp"});
    const updateTodoOrder = useMutation({operationName: "UpdateTodoOrder"});
    return function ({id, oldOrder, newOrder, allTodos}) {
        return new Promise(async (resolve) => {
            let updateTodoOrderInput: UpdateTodoOrderInput = {
                id: id,
                order: {
                    set: newOrder
                }
            };
            let reorderTodosInput: ReorderTodosDragDownInput | ReorderTodosDragUpInput = {
                newOrder: newOrder,
                oldOrder: oldOrder
            };
            let todosReorder: ReorderTodosDragUpResponseData | ReorderTodosDragDownResponseData;

            //drag down
            if (newOrder < oldOrder) {
                todosReorder = await reorderTodosDragDown.trigger(reorderTodosInput);
            }
            //drag up
            else {
                todosReorder = await reorderTodosDragUp.trigger(reorderTodosInput);
            }

            //update order of dragged todo
            let singleTodoUpdate: UpdateTodoOrderResponseData = await updateTodoOrder.trigger(updateTodoOrderInput);

            allTodos.mutate();

            resolve({
                todosReorder,
                singleTodoUpdate
            });
        });
    };
}

export default useReorderTodoMutation;