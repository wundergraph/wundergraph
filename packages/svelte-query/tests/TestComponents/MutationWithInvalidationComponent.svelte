<script>
	export let mutationCreator, queryCreator

	const query = queryCreator()
	const mutation = mutationCreator()

	const onClick = () => {
		$mutation.mutate({ name: 'Not Rick Astley' })
	}
</script>

<div>
	<div>{$query.data?.name}</div>
	<button on:click={onClick}>submit</button>
</div>
