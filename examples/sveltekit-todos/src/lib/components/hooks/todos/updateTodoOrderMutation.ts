import { createMutation, queryKey } from "$lib/svelte-query";
import { useQueryClient } from "@tanstack/svelte-query";
import type { TodosResponseData, UpdateTodoOrderInput } from '$lib/generated/models'

export function updateTodoOrderMutation() {    
    const queryClient = useQueryClient()
    return createMutation({
        operationName: 'UpdateTodoOrder',                
        // When mutate is called:
        onMutate: async (input: UpdateTodoOrderInput) => {
        
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries(queryKey({
            operationName: 'Todos'
        }))
  
        // Snapshot the previous value
        const previousTodos = queryClient.getQueryData<TodosResponseData>(queryKey({
            operationName: 'Todos'
        }))
  
        // Optimistically update to the new value
        if (previousTodos) {
          let optimisticTodos = {...previousTodos}
          const elIndex = previousTodos.todos.findIndex(todo => todo.id === input.id)
          if(elIndex) {
            // remove changed element from array
            const element = optimisticTodos.todos.splice(elIndex, 1)[0]
            // re-add element to new location in array
            optimisticTodos.todos.splice(input.order - 1, 0, element)
          }
          
          queryClient.setQueryData<TodosResponseData>(queryKey({
            operationName: 'Todos'
          }), {
            ...optimisticTodos,
            todos: optimisticTodos.todos
          })
        } 
        
        // return previous todos to cancel if error updating db
        return previousTodos as any
      },
      // If the mutation fails, use the context returned from onMutate to roll back
      onError: (err: any, variables: any, context: any) => {
        if (context?.todos) {
          queryClient.setQueryData<TodosResponseData>(queryKey({operationName: 'Todos'}), context)
        }
      },
      // Always refetch after error or success:
      onSettled: () => {        
        queryClient.invalidateQueries(queryKey({
            operationName: 'Todos'
        }))
      },
    })    
}