<script>
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import UserComponent from './UserComponent.svelte';
	export let queryClient, userGetter
</script>

<QueryClientProvider client={queryClient}>
	<UserComponent userGetter={userGetter}/>
</QueryClientProvider>
