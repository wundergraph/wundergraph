<script lang="ts" setup>
const {
	$wgraph: { useMutation },
} = useNuxtApp();

const id = ref('1');
const name = ref('Jens');
const bio = ref('Founder of WunderGraph');

const { data, mutate } = useMutation({
	operationName: 'users/update',
});
</script>
<template>
	<div class="min-h-screen flex flex-col gap-4 items-center justify-center">
		<h1 class="text-2xl md:text-3xl font-bold text-white mb-4">Typescript Operations</h1>
		<input class="px-2 py-1 rounded-sm w-64" v-model="id" />
		<input class="px-2 py-1 rounded-sm w-64" v-model="name" />
		<input class="px-2 py-1 rounded-sm w-64" v-model="bio" />
		<button class="bg-blue-500 text-white py-2 px-4 rounded-md" @click="mutate({ id, name, bio })">Update</button>
		<pre class="bg-white mt-4">{{ data }}</pre>
	</div>
</template>
