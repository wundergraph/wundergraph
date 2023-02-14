import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import type { Component } from 'solid-js';
import { createQuery, createMutation, createSubscription } from './lib/wundergraph';

const queryClient = new QueryClient();

const Countries: Component = () => {
	const country = createQuery({
		operationName: 'Country',
	});

	return <pre class="text-4xl text-blue-700 py-20">{JSON.stringify(country.data, null, 2)}</pre>;
};

const Continents: Component = () => {
	const continents = createQuery({
		operationName: 'Continents',
	});

	return <pre class="text-4xl text-blue-700 py-20">{JSON.stringify(continents.data, null, 2)}</pre>;
};

const User: Component = () => {
	const user = createQuery({
		operationName: 'users/get',
		input: {
			id: '1',
		},
	});

	return <pre class="text-4xl text-blue-700 py-20">{JSON.stringify(user.data, null, 2)}</pre>;
};

const UserSubscribe: Component = () => {
	const user = createSubscription({
		operationName: 'users/subscribe',
		input: {
			id: '1',
		},
	});

	return <pre class="text-4xl text-blue-700 py-20">{JSON.stringify(user.data, null, 2)}</pre>;
};

const UserUpdate: Component = () => {
	const mutation = createMutation({
		operationName: 'users/update',
	});

	const handleClick = () => {
		mutation.mutate({
			id: '1',
			name: 'John Doe',
			bio: 'Lorem ipsum',
		});
	};

	return (
		<>
			<button onClick={handleClick}>Update</button>
			<pre class="text-4xl text-blue-700 py-20">{JSON.stringify(mutation.data, null, 2)}</pre>
		</>
	);
};

const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<div class="max-w-lg mx-auto space-y-4">
				<Countries />

				<Continents />

				<User />

				<UserSubscribe />

				<UserUpdate />
			</div>
		</QueryClientProvider>
	);
};

export default App;
