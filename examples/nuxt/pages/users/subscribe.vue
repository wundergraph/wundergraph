<script setup>
const {
	$wgraph: { useSubscription },
} = useNuxtApp();
const { data } = useSubscription({
	operationName: 'users/subscribe',
	input: {
		id: '1',
	},
});
//await suspense(); does not work with subscriptions
</script>
<template>
	<div class="min-h-screen flex flex-col items-center justify-center text-white">
		<h1 class="text-2xl md:text-3xl font-bold">Typescript Operations</h1>
		<div class="bg-white text-sm md:text-lg text-black p-6 md:p-12 rounded-lg mt-12">
			<div>ID: {{ data?.id }}</div>
			<div>Name: {{ data?.name }}</div>
			<div>Bio: {{ data?.bio }}</div>
			<div>Time: {{ data?.time }}</div>
		</div>
	</div>
</template>
