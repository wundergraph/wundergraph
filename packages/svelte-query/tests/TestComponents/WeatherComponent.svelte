<script>
export let queryCreator

const query = queryCreator()
</script>

<div>Response: {$query.data?.id}</div>
