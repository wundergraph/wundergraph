import { waitFor, screen, render, fireEvent } from '@solidjs/testing-library';
import { QueryCache, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/solid-query';
import { createEffect, JSX } from 'solid-js';
import { Client, ClientConfig, OperationsDefinition, ResponseError } from '@wundergraph/sdk/client';
import nock from 'nock';
import fetch from 'node-fetch';

import { createHooks } from '../src';

export type Queries = {
	Weather: {
		response: { data?: any; error?: ResponseError };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
};

export type Mutations = {
	SetNameWithoutAuth: {
		input: { name: string };
		response: { data?: { id: string }; error?: ResponseError };
		requiresAuthentication: false;
	};
	SetName: {
		input: { name: string };
		response: { data?: { id: string }; error?: ResponseError };
		requiresAuthentication: true;
	};
};

export type Subscriptions = {
	Countdown: {
		input: { from: number };
		response: { data?: { count: number }; error?: ResponseError };
		requiresAuthentication: false;
	};
};

export type LiveQueries = {};

export interface Operations
	extends OperationsDefinition<Queries, Mutations, Subscriptions, LiveQueries, string, {}, 'github'> {}

export function sleep(time: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, time));
}

const _renderWithConfig = (element: JSX.Element, config: { client: QueryClient }): ReturnType<typeof render> => {
	return render(() => <QueryClientProvider client={config.client}>{element}</QueryClientProvider>);
};

export const renderWithClient = (
	element: JSX.Element,
	queryClient: QueryClient
): ReturnType<typeof _renderWithConfig> => {
	return _renderWithConfig(element, { client: queryClient });
};

const createClient = (overrides?: Partial<ClientConfig>) => {
	return new Client({
		sdkVersion: '1.0.0',
		baseURL: 'https://api.com',
		applicationHash: '123',
		customFetch: fetch as any,
		operationMetadata: {
			Weather: {
				requiresAuthentication: false,
			},
			SetName: {
				requiresAuthentication: true,
			},
			SetNameWithoutAuth: {
				requiresAuthentication: false,
			},
			Countdown: {
				requiresAuthentication: false,
			},
		},
		...overrides,
	});
};

const nockQuery = (operationName = 'Weather', wgParams = {}) => {
	return nock('https://api.com')
		.matchHeader('accept', 'application/json')
		.matchHeader('content-type', 'application/json')
		.matchHeader('WG-SDK-Version', '1.0.0')
		.get('/operations/' + operationName)
		.query({ wg_api_hash: '123', ...wgParams });
};

const nockMutation = (operationName = 'SetName', wgParams = {}, authenticated = false) => {
	const csrfScope = nock('https://api.com')
		.matchHeader('accept', 'text/plain')
		.matchHeader('WG-SDK-Version', '1.0.0')
		.get('/auth/cookie/csrf')
		.reply(200, 'csrf');
	const mutation = nock('https://api.com')
		.matchHeader('accept', 'application/json')
		.matchHeader('content-type', 'application/json')
		.matchHeader('WG-SDK-Version', '1.0.0')
		.post('/operations/' + operationName, wgParams)
		.query({ wg_api_hash: '123' });

	if (authenticated) {
		mutation.matchHeader('x-csrf-token', 'csrf');
	}

	return {
		csrfScope,
		mutation,
	};
};

describe('Solid Query - createHooks', () => {
	const client = createClient();

	const hooks = createHooks<Operations>(client);

	it('should be able to init hooks', async () => {
		expect(hooks).toBeTruthy();
	});
});

describe('Solid Query - createQuery', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryClient.clear();
		nock.cleanAll();
	});

	const { createQuery } = createHooks<Operations>(client);

	it('should return data', async () => {
		const scope = nockQuery()
			.once()
			.reply(200, {
				data: {
					id: '1',
				},
			});

		function Page() {
			const weather = createQuery({
				operationName: 'Weather',
			});
			return <div>Response: {weather.data?.id}</div>;
		}

		render(() => (
			<QueryClientProvider client={queryClient}>
				<Page />
			</QueryClientProvider>
		));

		await waitFor(() => {
			screen.getByText('Response: 1');
		});

		scope.done();
	});

	it('should be disabled', async () => {
		const scope = nockQuery().reply(200, {
			data: {
				id: '2',
			},
		});

		function Page() {
			const query = createQuery({
				operationName: 'Weather',
				input: {
					forCity: 'berlin',
				},
				enabled: false,
			});

			return (
				<div>
					<div>Fetched: {query.isFetched ? 'true' : 'false'}</div>
				</div>
			);
		}

		render(() => (
			<QueryClientProvider client={queryClient}>
				<Page />
			</QueryClientProvider>
		));

		screen.getByText('Fetched: false');

		await sleep(500);

		screen.getByText('Fetched: false');

		expect(() => scope.done()).toThrow();
	});
});

describe('Solid Query - createMutation', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryClient.clear();
		nock.cleanAll();
	});

	const hooks = createHooks<Operations>(client);

	it('should trigger mutation with auth', async () => {
		const { mutation, csrfScope } = nockMutation('SetName', { name: 'Rick Astley' }, true);

		const scope = mutation.once().reply(200, {
			data: {
				id: 'Never gonna give you up',
			},
		});

		function Page() {
			const mutation = hooks.createMutation({
				operationName: 'SetName',
			});

			createEffect(() => {
				mutation.mutate({ name: 'Rick Astley' });
			});

			return <div>{mutation.data?.id}</div>;
		}

		render(() => (
			<QueryClientProvider client={queryClient}>
				<Page />
			</QueryClientProvider>
		));

		await waitFor(() => {
			screen.getByText('Never gonna give you up');
		});

		csrfScope.done();
		scope.done();
	});

	it('should trigger mutation', async () => {
		const { mutation, csrfScope } = nockMutation('SetNameWithoutAuth', { name: 'Rick Astley' });

		const scope = mutation.once().reply(200, {
			data: {
				id: '1',
			},
		});

		function Page() {
			const mutation = hooks.createMutation({
				operationName: 'SetNameWithoutAuth',
			});

			mutation.mutate({ name: 'Rick Astley' });

			return <div>{mutation.data?.id}</div>;
		}

		render(() => (
			<QueryClientProvider client={queryClient}>
				<Page />
			</QueryClientProvider>
		));

		await waitFor(() => {
			screen.getByText('1');
		});

		expect(() => csrfScope.done()).toThrow(); // should not be called

		scope.done();
	});

	it('should invalidate query', async () => {
		const scope = nockQuery()
			.reply(200, {
				data: {
					id: '1',
					name: 'Test',
				},
			})
			.matchHeader('accept', 'application/json')
			.matchHeader('content-type', 'application/json')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.post('/operations/SetNameWithoutAuth', { name: 'Not Rick Astley' })
			.query({ wg_api_hash: '123' })
			.reply(200, { data: { id: '1', name: 'Not Rick Astley' } })
			.matchHeader('accept', 'application/json')
			.matchHeader('content-type', 'application/json')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.get('/operations/Weather')
			.query({ wg_api_hash: '123' })
			.reply(200, { data: { id: '1', name: 'Rick Astley' } });

		function Page() {
			const queryClient = useQueryClient();

			const query = hooks.createQuery({
				operationName: 'Weather',
			});

			const mutation = hooks.createMutation({
				operationName: 'SetNameWithoutAuth',
				onSuccess: () => {
					queryClient.invalidateQueries(hooks.queryKey({ operationName: 'Weather' }));
				},
			});

			const onClick = () => {
				mutation.mutate({ name: 'Not Rick Astley' });
			};

			return (
				<div>
					<div>{query.data?.name}</div>
					<button onClick={onClick}>submit</button>
				</div>
			);
		}

		render(() => (
			<QueryClientProvider client={queryClient}>
				<Page />
			</QueryClientProvider>
		));

		await waitFor(() => {
			screen.getByText('Test');
		});

		fireEvent.click(screen.getByText('submit'));

		await waitFor(() => {
			screen.getByText('Rick Astley');
		});

		scope.done();
	});
});

describe('Solid Query - createSubscription', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryCache.clear();
	});

	afterAll(() => {
		queryCache.clear();
	});

	const { createSubscription } = createHooks<Operations>(client);

	it('should subscribe', async () => {
		// web streams not supported in node-fetch, we use subscribeOnce to test
		const scope = nock('https://api.com')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.matchHeader('accept', 'application/json')
			.matchHeader('content-type', 'application/json')
			.get('/operations/Countdown')
			.query(
				(obj) =>
					obj.wg_api_hash === '123' &&
					obj.wg_variables === JSON.stringify({ from: 100 }) &&
					obj.wg_subscribe_once === ''
			)
			.reply(200, { data: { count: 100 } });

		function Page() {
			const subscription = createSubscription({
				operationName: 'Countdown',
				subscribeOnce: true,
				input: {
					from: 100,
				},
			});
			return <div>{subscription.data?.count ? subscription.data.count : 'loading'}</div>;
		}

		render(() => (
			<QueryClientProvider client={queryClient}>
				<Page />
			</QueryClientProvider>
		));

		screen.getByText('loading');

		await waitFor(
			() => {
				screen.getByText('100');
			},
			{
				timeout: 10000,
			}
		);

		scope.done();
	});
});

describe('Solid Query - useUser', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryCache.clear();
	});

	const { useUser } = createHooks<Operations>(client);

	it('should return user', async () => {
		const scope = nock('https://api.com')
			.matchHeader('accept', 'application/json')
			.matchHeader('content-type', 'application/json')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.get('/auth/user')
			.query({ wg_api_hash: '123' })
			.reply(200, { email: 'info@wundergraph.com' });

		function Page() {
			const user = useUser();

			return <div>{user.data?.email}</div>;
		}

		render(() => (
			<QueryClientProvider client={queryClient}>
				<Page />
			</QueryClientProvider>
		));

		await waitFor(() => {
			screen.getByText('info@wundergraph.com');
		});

		scope.done();
	});
});
