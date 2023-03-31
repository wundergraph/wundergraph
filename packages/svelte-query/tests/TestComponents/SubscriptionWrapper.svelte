<script>
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import SubscriptionComponent from './SubscriptionComponent.svelte';
	export let queryClient, subscriptionCreator
</script>

<QueryClientProvider client={queryClient}>
	<SubscriptionComponent subscriptionCreator={subscriptionCreator}/>
</QueryClientProvider>
