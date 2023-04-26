import { createMutation, queryKey } from "$lib/svelte-query";
import { useQueryClient } from "@tanstack/svelte-query";
import type { EditTodoInput, TodosResponseData } from '$lib/generated/models'

export function editTodoMutation() {    
    const queryClient = useQueryClient()
    return createMutation({
        operationName: 'EditTodo',                
        // When mutate is called:
        onMutate: async (input: EditTodoInput) => {
        
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
          queryClient.setQueryData<TodosResponseData>(queryKey({
            operationName: 'Todos'
          }), {
            ...previousTodos,
            todos: previousTodos.todos.map((todo) => {
              if(todo.id === input.id) {
                return {
                  ...todo,
                  title: input.title
                }
              }
              return todo
            }),
          })
        }  
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