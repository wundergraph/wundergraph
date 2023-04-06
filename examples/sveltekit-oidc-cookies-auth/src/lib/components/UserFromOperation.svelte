<script lang="ts">
	import { createQuery } from '$lib/svelte-query';

	const query = createQuery({
		operationName: 'user/Me',
		networkMode: 'offlineFirst'
	});

	$: user = $query.data?.db_findUniqueUser;
</script>

<div
	class="flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow max-w-sm m-auto"
>
	<div class="flex flex-1 flex-col p-8">
		<img class="mx-auto h-32 w-32 flex-shrink-0 rounded-full" src={user?.picture} alt="" />
		<h3 class="mt-6 text-sm font-medium text-gray-900">{user?.name}</h3>
		<dl class="mt-1 flex flex-grow flex-col justify-between">
			<dd class="text-sm text-gray-500">{user?.email}</dd>
		</dl>
	</div>
</div>
<p>This data was called using the createQuery function from @wundergraph/svelte-client</p>
