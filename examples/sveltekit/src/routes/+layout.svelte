<script lang="ts">
	import Header from "./Header.svelte";
	import { browser } from "$app/environment";
	import "./styles.css";
	import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
	import type { LayoutData } from "./$types";

	export let data: LayoutData;
</script>

<QueryClientProvider client={data.queryClient}>
	<div class="app">
		<Header />

		<main>
			<slot />
		</main>

		<footer>
			<p>
				visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn
				SvelteKit
			</p>
		</footer>
	</div>
</QueryClientProvider>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}

	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
