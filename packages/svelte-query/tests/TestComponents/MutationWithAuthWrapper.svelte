<script>
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import MutationWithAuthComponent from './MutationWithAuthComponent.svelte';
	export let queryClient, mutationCreator
</script>

<QueryClientProvider client={queryClient}>
	<MutationWithAuthComponent mutationCreator={mutationCreator}/>
</QueryClientProvider>
