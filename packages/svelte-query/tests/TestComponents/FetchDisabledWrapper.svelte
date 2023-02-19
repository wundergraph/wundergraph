<script>
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import FetchDisabledComponent from './FetchDisabledComponent.svelte';
	export let queryClient, queryCreator
</script>

<QueryClientProvider client={queryClient}>
	<FetchDisabledComponent queryCreator={queryCreator}/>
</QueryClientProvider>
