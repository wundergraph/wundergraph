<script>
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import WeatherComponent from './WeatherComponent.svelte';
	export let queryClient, queryCreator
</script>

<QueryClientProvider client={queryClient}>
	<WeatherComponent queryCreator={queryCreator}/>
</QueryClientProvider>
