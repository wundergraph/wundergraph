<script lang="ts">
	import svelteLogo from './assets/svelte.svg';
	import Dragons from './components/Dragons.svelte';
	import viteLogo from '/vite.svg';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	const queryClient = new QueryClient();
</script>

<main>
	<QueryClientProvider client={queryClient}>
		<div>
			<a href="https://vitejs.dev" target="_blank" rel="noreferrer">
				<img src={viteLogo} class="logo" alt="Vite Logo" />
			</a>
			<a href="https://svelte.dev" target="_blank" rel="noreferrer">
				<img src={svelteLogo} class="logo svelte" alt="Svelte Logo" />
			</a>
		</div>
		<h1>Vite + Svelte + WunderGraph</h1>

		<div class="card">
			<Dragons />
		</div>

		<p class="read-the-docs">Click on the Vite and Svelte logos to learn more</p>
	</QueryClientProvider>
</main>

<style>
	.logo {
		height: 6em;
		padding: 1.5em;
		will-change: filter;
		transition: filter 300ms;
	}
	.logo:hover {
		filter: drop-shadow(0 0 2em #646cffaa);
	}
	.logo.svelte:hover {
		filter: drop-shadow(0 0 2em #ff3e00aa);
	}
	.read-the-docs {
		color: #888;
	}
</style>
