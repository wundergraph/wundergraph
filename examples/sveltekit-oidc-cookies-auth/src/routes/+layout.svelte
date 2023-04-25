<script lang="ts">
	import '../app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import type { PageData } from './$types';
	import Navbar from '$lib/components/Navbar.svelte';
	export let data: PageData;
</script>

<QueryClientProvider client={data.queryClient}>
	<div class="min-h-full">
		<Navbar />
		<div class="p-10">
			<slot />
		</div>
	</div>
</QueryClientProvider>
