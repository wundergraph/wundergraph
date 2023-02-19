<script>
	export let subscriptionCreator

	const subscription = subscriptionCreator();
</script>

<div>
	{$subscription.data?.count ? $subscription.data.count : 'loading'}
</div>
