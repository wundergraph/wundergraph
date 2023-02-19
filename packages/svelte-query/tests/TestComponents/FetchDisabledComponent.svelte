<script>
	export let queryCreator
	
	const query = queryCreator()
</script>
	
<div>
	<div>Fetched: {$query.isFetched ? 'true' : 'false'}</div>
</div>
	