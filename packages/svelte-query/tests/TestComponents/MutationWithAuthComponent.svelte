<script>
	export let mutationCreator
	import { onMount } from 'svelte'

	const mutation = mutationCreator()

	onMount(() => {
		$mutation.mutate({ name: 'Rick Astley' })
	})
</script>

<div>{$mutation.data?.id}</div>
