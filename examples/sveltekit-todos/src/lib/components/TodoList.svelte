<script lang="ts">
	import { createQuery } from '$lib/svelte-query';
	import TodoItem from './TodoItem.svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { updateTodoOrderMutation } from './hooks/todos';
	const flipDurationMs = 300;

	const updateTodoOrder = updateTodoOrderMutation();
	function handleDndConsider(e: any) {
		todos = e.detail.items;
	}
	async function handleDndFinalize(e: any) {
		todos = e.detail.items;
		const previousOrder: any = $query.data?.todos.reduce((acc, todo, index) => {
			return {
				...acc,
				[todo.id]: index
			};
		}, {});
		if (previousOrder && e?.detail.items) {
			for (let i = 0; i < e.detail.items.length; i++) {
				if (previousOrder[e.detail.items[i].id] !== i) {
					await $updateTodoOrder.mutate({
						id: e.detail.items[i].id,
						order: i + 1
					});
				}
			}
		}
	}

	const query = createQuery({
		operationName: 'Todos'
	});

	$: isLoading = $query.isLoading;
	$: error = $query.error;
	$: todos = $query.data?.todos;
	$: isFetching = $query.isFetching;
</script>

{#if todos && todos.length > 0}
	<section
		use:dndzone={{ items: todos, flipDurationMs, dropTargetStyle: { outline: 'none' } }}
		on:consider={handleDndConsider}
		on:finalize={handleDndFinalize}
	>
		{#each todos as todo (todo.id)}
			<TodoItem {todo} />
		{/each}
	</section>
{/if}
