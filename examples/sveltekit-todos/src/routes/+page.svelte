<script>
	import AddTodo from '$lib/components/AddTodo.svelte';
	import TodoList from '$lib/components/TodoList.svelte';
</script>

<div class="flex flex-col items-center align-center w-full">
	<div class="mt-[10%]">
		<div class="mb-10 w-72">
			<div class="flex items-center justify-center">
				<a href="https://wundergraph.com" target="_blank">
					<img src="/wundergraph.svg" class="h-8" alt="WunderGraph logo" />
				</a>
				<span
					class="ml-3 text-3xl bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent font-semibold"
				>
					WunderTodo
				</span>
			</div>
		</div>
		<AddTodo />
		<div class="mt-4">
			<TodoList />
		</div>
	</div>
</div>
