<script lang="ts">
	import { addTodoMutation } from './hooks/todos/addTodoMutation';
	import CheckIcon from './CheckIcon.svelte';
	import { handleEnterOrEscKey } from './actions/handleKeyboardEvents';

	let title = '';
	const addMutation = addTodoMutation();
	function clearAdd() {
		title = '';
	}

	async function addTodo() {
		await $addMutation.mutate({ title });
		clearAdd();
	}
</script>

<div class="relative">
	<input
		placeholder="Add todo"
		type="text"
		use:handleEnterOrEscKey
		on:escapeKey={clearAdd}
		on:enterKey={addTodo}
		bind:value={title}
		class="py-2.5 pl-5 h-11 pr-10 w-72 rounded-md border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition"
		class:opacity-40={title.trim().length === 0}
	/>
	<button
		on:click={addTodo}
		class="absolute transition right-1 top-1 h-9 w-9 flex items-center justify-center cursor-pointer hover:bg-gray-700 rounded text-white"
		class:opacity-40={title.trim().length === 0}
	>
		<CheckIcon className="w-6 h-6" />
	</button>
</div>
