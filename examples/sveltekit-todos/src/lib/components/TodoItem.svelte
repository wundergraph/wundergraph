<script lang="ts">
	import CheckIcon from './CheckIcon.svelte';
	import XIcon from './XIcon.svelte';
	import { clickOutside, handleEnterOrEscKey } from './actions/handleKeyboardEvents';
	import { deleteTodoMutation, editTodoMutation, toggleCompleteTodoMutation } from './hooks/todos';

	export let todo: {
		id: number;
		title: string;
		completed: boolean;
		order: number;
	};

	const deleteMutation = deleteTodoMutation();
	const editMutation = editTodoMutation();
	const toggleCompleteMutation = toggleCompleteTodoMutation();

	let title = todo.title;
	let editMode = false;
	function enableEditMode() {
		editMode = true;
	}
	function disableEditMode() {
		title = todo.title;
		editMode = false;
	}
	async function updateCompletedStatus() {
		await $toggleCompleteMutation.mutate({ id: todo.id, complete: !todo.completed });
	}
	async function deleteTodoItem() {
		await $deleteMutation.mutate({ id: todo.id });
	}
	async function editTodoTile() {
		await $editMutation.mutate({ id: todo.id, title });
		disableEditMode();
	}
</script>

<div
	class="group flex justify-between items-center py-3 my-2 pl-2 pr-1 w-72 h-11 transition hover:bg-slate-800 rounded-md relative"
	class:bg-slate-800={editMode}
>
	{#if !editMode}
		<div class="flex flex-1 items-center mx-1">
			<input
				on:change={updateCompletedStatus}
				type="checkbox"
				checked={todo.completed}
				class="h-4 w-4 rounded-full transition cursor-pointer accent-pink-500 border-gray-500 bg-slate-800 text-pink-600 focus:ring-pink-500 focus:ring-1 focus:border-pink-500 hover:ring-1 focus:ring-offset-0 hover:border-pink-500 ring-pink-500"
			/>
			<div
				on:dblclick={enableEditMode}
				class="flex-1 cursor-pointer ml-3 text-sm font-medium text-gray-300"
				class:line-through={todo.completed}
			>
				<span class="break-all">{todo.title}</span>
			</div>
		</div>
		<button
			on:click={deleteTodoItem}
			class="flex-col items-center justify-center ml-5 h-9 w-9 transition cursor-pointer hidden group-hover:flex text-white opacity-50 hover:opacity-100 hover:bg-gray-700 rounded"
		>
			<XIcon />
		</button>
	{:else}
		<div class="relative w-full" use:clickOutside on:outclick={disableEditMode}>
			<input
				type="text"
				use:handleEnterOrEscKey
				on:escapeKey={disableEditMode}
				on:enterKey={editTodoTile}
				bind:value={title}
				class="py-2.5 pl-8 pr-2 h-11 -mt-[1px] border-0 w-full leadig-0 text-sm font-medium bg-slate-800 rounded text-white focus:outline-none focus:border-0 focus:ring-0"
			/>
			<button
				on:click={editTodoTile}
				class="absolute transition right-0 top-1 -mt-[1px] h-9 w-9 flex items-center justify-center cursor-pointer hover:bg-gray-700 rounded text-white"
				class:opacity-40={todo.title.trim().length === 0}
			>
				<CheckIcon className="w-6 h-6" />
			</button>
		</div>
	{/if}
</div>
