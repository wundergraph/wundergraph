<script lang="ts">
	import '../app.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import type { LayoutData } from './$types';
	export let data: LayoutData;
</script>

<QueryClientProvider client={data.queryClient}>
	<main>
		<slot />
	</main>
</QueryClientProvider>
