import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import type { Component } from 'solid-js';
import { createQuery } from './lib/wundergraph';

const queryClient = new QueryClient();

const Dragons: Component = () => {
	const dragons = createQuery({
		operationName: 'Dragons',
	});
	return (
		<div class="results">
			{dragons.isLoading && <p>Loading...</p>}
			{dragons.error && <pre>Error: {JSON.stringify(dragons.error, null, 2)}</pre>}
			{dragons.data && <pre>{JSON.stringify(dragons.data, null, 2)}</pre>}
		</div>
	);
};

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<div class="App">
				<div>
					<a href="https://wundergraph.com" target="_blank">
						<img src="/wundergraph.svg" class="logo wundergraph" alt="WunderGraph logo" />
					</a>
					<a href="https://vitejs.dev" target="_blank">
						<img src="/vite.svg" class="logo" alt="Vite logo" />
					</a>
					<a href="https://www.solidjs.com/" target="_blank">
						<img src="/solid.svg" class="logo solid" alt="Solid logo" />
					</a>
				</div>
				<h1>WunderGraph + Vite + Solid</h1>
				<div class="card">
					<Dragons />
				</div>
				<p class="read-the-docs">Click on the WunderGraph, Vite and Solid logos to learn more</p>
			</div>
		</QueryClientProvider>
	);
}

export default App;
