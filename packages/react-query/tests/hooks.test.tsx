import { act, waitFor, screen, render, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryCache, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';

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

export interface Operations extends OperationsDefinition<Queries, Mutations, Subscriptions, string, {}, 'github'> {}

export function sleep(time: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, time));
}

const _renderWithConfig = (element: React.ReactElement, config: any): ReturnType<typeof render> => {
	const TestProvider = ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={config.client}>{children}</QueryClientProvider>
	);
	return render(element, { wrapper: TestProvider });
};

export const renderWithClient = (
	element: React.ReactElement,
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

describe('React Query - createHooks', () => {
	const client = createClient();

	const hooks = createHooks<Operations>(client);

	it('should be able to init hooks', async () => {
		expect(hooks).toBeTruthy();
	});
});

describe('React Query - useQuery', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryClient.clear();
		nock.cleanAll();
	});

	const { useQuery } = createHooks<Operations>(client);

	it('should return data', async () => {
		const scope = nockQuery()
			.once()
			.reply(200, {
				data: {
					id: '1',
				},
			});

		function Page() {
			const { data } = useQuery({
				operationName: 'Weather',
			});

			return <div>Response: {data?.id}</div>;
		}

		renderWithClient(<Page />, queryClient);

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
			const { isFetched } = useQuery({
				operationName: 'Weather',
				input: {
					forCity: 'berlin',
				},
				enabled: false,
			});

			return (
				<div>
					<div>Fetched: {isFetched ? 'true' : 'false'}</div>
				</div>
			);
		}

		renderWithClient(<Page />, queryClient);

		screen.getByText('Fetched: false');

		await act(() => sleep(150));

		screen.getByText('Fetched: false');

		expect(() => scope.done()).toThrow();
	});
});

describe('React Query - useMutation', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryClient.clear();
		nock.cleanAll();
	});

	const { useMutation, useQuery, queryKey } = createHooks<Operations>(client);

	it('should trigger mutation with auth', async () => {
		const { mutation, csrfScope } = nockMutation('SetName', { name: 'Rick Astley' }, true);

		const scope = mutation.once().reply(200, {
			data: {
				id: 'Never gonna give you up',
			},
		});

		function Page() {
			const { data, mutate } = useMutation({
				operationName: 'SetName',
			});

			React.useEffect(() => {
				mutate({ name: 'Rick Astley' });
			}, []);

			return <div>{data?.id}</div>;
		}

		renderWithClient(<Page />, queryClient);

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
			const { data, mutate } = useMutation({
				operationName: 'SetNameWithoutAuth',
			});

			React.useEffect(() => {
				mutate({ name: 'Rick Astley' });
			}, []);

			return <div>{data?.id}</div>;
		}

		renderWithClient(<Page />, queryClient);

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
			.post('/operations/SetNameWithoutAuth', { name: 'Rick Astley' })
			.query({ wg_api_hash: '123' })
			.reply(200, { data: { id: '1', name: 'Rick Astley' } })
			.matchHeader('accept', 'application/json')
			.matchHeader('content-type', 'application/json')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.get('/operations/Weather')
			.query({ wg_api_hash: '123' })
			.reply(200, { data: { id: '1', name: 'Rick Astley' } });

		function Page() {
			const queryClient = useQueryClient();

			const query = useQuery({
				operationName: 'Weather',
			});

			const { mutate } = useMutation({
				operationName: 'SetNameWithoutAuth',
				onSuccess: () => {
					queryClient.invalidateQueries(queryKey({ operationName: 'Weather' }));
				},
			});

			const onClick = () => {
				mutate({ name: 'Rick Astley' });
			};

			return (
				<div>
					<div>{query.data?.name}</div>
					<button onClick={onClick}>submit</button>
				</div>
			);
		}

		renderWithClient(<Page />, queryClient);

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

describe('React Query - useSubscription', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryCache.clear();
	});

	afterAll(() => {
		queryCache.clear();
	});

	const { useSubscription } = createHooks<Operations>(client);

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
					obj.wg_subscribe_once === '' &&
					obj.wg_variables === JSON.stringify({ from: 100 })
			)
			.reply(200, { data: { count: 100 } });

		function Page() {
			const { data } = useSubscription({
				operationName: 'Countdown',
				subscribeOnce: true,
				input: {
					from: 100,
				},
			});
			return <div>{data?.count ? data.count : 'loading'}</div>;
		}

		renderWithClient(<Page />, queryClient);

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

describe('React Query - useUser', () => {
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
			const { data } = useUser();

			return <div>{data?.email}</div>;
		}

		renderWithClient(<Page />, queryClient);

		await waitFor(() => {
			screen.getByText('info@wundergraph.com');
		});

		scope.done();
	});
});
