<script setup lang="ts">
useHead({
	title: 'Nuxt Wundergraph',
	meta: [{ name: 'Nuxt + Wundergraph', content: 'Nuxt and Wundergraph with vue query' }],
});
</script>
<template>
	<Body class="flex dark:bg-slate-800 min-h-screen w-screen justify-center">
		<NuxtPage />
	</Body>
</template>
