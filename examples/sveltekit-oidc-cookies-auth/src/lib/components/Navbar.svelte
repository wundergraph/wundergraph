<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getAuth, createQuery, queryKey } from '$lib/svelte-query';

	const query = createQuery({
		operationName: 'user/Me',
		retry: false
	});
	const { logout, login } = getAuth();
	$: user = $query.data?.db_findUniqueUser;
	$: path = $page.url.pathname;

	$: console.log('user: ', user);
</script>

<nav class="border-b border-gray-200 bg-white">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 justify-between">
			<div class="flex">
				<nav class="my-px sm:ml-6 sm:flex sm:space-x-8">
					<a
						href="/user"
						class={`${
							path === '/user'
								? 'border-indigo-500 text-gray-900'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
						} inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium`}
						aria-current="page">User from cookie</a
					>

					<a
						href="/user/from-operation"
						class={`${
							path === '/user/from-operation'
								? 'border-indigo-500 text-gray-900'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
						} inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium`}
						>User from operation</a
					>
				</nav>
			</div>

			<div class="sm:ml-6 sm:flex sm:items-center">
				{#if user}
					<div class="flex gap-3">
						<img
							class="h-8 w-8 rounded-full"
							src={user.picture}
							alt=""
							referrerpolicy="no-referrer"
						/>
						<button
							type="button"
							class="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
							on:click={async () => {
								await logout();
								$query.refetch();
								goto('/');
								user = undefined;
							}}>Signout</button
						>
					</div>
				{:else}
					<button
						type="button"
						class="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
						on:click={async () => {
							await login('github', 'http://localhost:5173/user');
						}}>Sign in</button
					>
				{/if}
			</div>
		</div>
	</div>
</nav>
