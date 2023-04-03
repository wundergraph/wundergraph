<script>
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import MutationWithInvalidationComponent from './MutationWithInvalidationComponent.svelte';
	export let queryClient, mutationCreator, queryCreator
</script>

<QueryClientProvider client={queryClient}>
	<MutationWithInvalidationComponent mutationCreator={mutationCreator} queryCreator={queryCreator}/>
</QueryClientProvider>
