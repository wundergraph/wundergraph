<script lang="ts">
	import { createQuery } from '../lib/wundergraph';

	const dragonsQuery = createQuery({
		operationName: 'Dragons',
	});
</script>

<div class="results">
	{#if $dragonsQuery.isLoading}
		<p>Loading...</p>
	{:else if $dragonsQuery.error}
		<pre>Error: {JSON.stringify($dragonsQuery.error, null, 2)}</pre>
	{:else}
		<pre>{JSON.stringify($dragonsQuery.data, null, 2)}</pre>
	{/if}
</div>
