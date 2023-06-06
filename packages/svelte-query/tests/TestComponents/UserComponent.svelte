<script>
	export let userGetter

	const query = userGetter()

</script>

<div>{$query.data?.email}</div>
