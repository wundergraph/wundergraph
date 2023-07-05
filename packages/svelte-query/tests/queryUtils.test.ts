import { QueryCache, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/svelte-query';
import { Client, ClientConfig, GraphQLError, OperationsDefinition } from '@wundergraph/sdk/client';
import nock from 'nock';
import fetch from 'node-fetch';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/svelte';
import Weather from './TestComponents/WeatherWrapper.svelte';
import { createSvelteClient } from '../src/lib';
import FetchDisabledWrapper from './TestComponents/FetchDisabledWrapper.svelte';
import MutationWithAuthWrapper from './TestComponents/MutationWithAuthWrapper.svelte';
import MutationWithInvalidationWrapper from './TestComponents/MutationWithInvalidationWrapper.svelte';
import SubscriptionWrapper from './TestComponents/SubscriptionWrapper.svelte';
import UserWrapper from './TestComponents/UserWrapper.svelte';

export type Queries = {
	Weather: {
		response: { data: any };
		requiresAuthentication: false;
		liveQuery: boolean;
	};
};

export type Mutations = {
	SetNameWithoutAuth: {
		input: { name: string };
		response: { data: { id: string }; error: GraphQLError };
		requiresAuthentication: false;
	};
	SetName: {
		input: { name: string };
		response: { data: { id: string }; error: GraphQLError };
		requiresAuthentication: true;
	};
};

export type Subscriptions = {
	Countdown: {
		input: { from: number };
		response: { data: { count: number } };
		requiresAuthentication: false;
	};
};

export type LiveQueries = {};

export interface Operations
	extends OperationsDefinition<Queries, Mutations, Subscriptions, LiveQueries, string, {}, 'github'> {}

export function sleep(time: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, time));
}

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

describe('Svelte Query - createSvelteClient', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryClient.clear();
		nock.cleanAll();
	});

	const utils = createSvelteClient<Operations>(client);

	it('should be able to init utility functions', async () => {
		expect(utils).toBeTruthy();
	});

	it('should return data', async () => {
		const scope = nockQuery()
			.once()
			.reply(200, {
				data: {
					id: '1',
				},
			});

		const queryCreator = () =>
			utils.createQuery({
				operationName: 'Weather',
			});

		render(Weather, { queryClient, queryCreator });
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

		const queryCreator = () =>
			utils.createQuery({
				operationName: 'Weather',
				input: {
					forCity: 'berlin',
				},
				enabled: false,
			});

		render(FetchDisabledWrapper, { queryClient, queryCreator });

		screen.getByText('Fetched: false');

		await act(() => sleep(150));

		screen.getByText('Fetched: false');

		expect(() => scope.done()).toThrow();
	});
});

describe('Svelte Query - createMutation', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryClient.clear();
		nock.cleanAll();
	});

	const { createMutation, createQuery, queryKey } = createSvelteClient<Operations>(client);

	it('should trigger mutation with auth', async () => {
		const { mutation, csrfScope } = nockMutation('SetName', { name: 'Rick Astley' }, true);

		const scope = mutation.once().reply(200, {
			data: {
				id: 'Never gonna give you up',
			},
		});

		const mutationCreator = () =>
			createMutation({
				operationName: 'SetName',
			});

		render(MutationWithAuthWrapper, {
			queryClient,
			mutationCreator,
		});

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

		const mutationCreator = () =>
			createMutation({
				operationName: 'SetNameWithoutAuth',
			});

		render(MutationWithAuthWrapper, {
			queryClient,
			mutationCreator,
		});

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

		const queryCache = new QueryCache();
		const queryClient = new QueryClient({ queryCache });

		const queryCreator = () =>
			createQuery({
				operationName: 'Weather',
			});

		const mutationCreator = () =>
			createMutation({
				operationName: 'SetNameWithoutAuth',
				onSuccess: () => {
					queryClient.invalidateQueries(queryKey({ operationName: 'Weather' }));
				},
			});

		render(MutationWithInvalidationWrapper, { queryClient, queryCreator, mutationCreator });

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

describe('Svelte Query - createSubscription', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryCache.clear();
	});

	afterAll(() => {
		queryCache.clear();
	});

	const { createSubscription } = createSvelteClient<Operations>(client);

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

		const subscriptionCreator = () =>
			createSubscription({
				operationName: 'Countdown',
				subscribeOnce: true,
				input: {
					from: 100,
				},
			});

		render(SubscriptionWrapper, { queryClient, subscriptionCreator });

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

describe('Svelte Query - getUser', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryCache.clear();
	});

	const { getUser } = createSvelteClient<Operations>(client);

	it('should return user', async () => {
		const scope = nock('https://api.com')
			.matchHeader('accept', 'application/json')
			.matchHeader('content-type', 'application/json')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.get('/auth/user')
			.query({ wg_api_hash: '123' })
			.reply(200, { email: 'info@wundergraph.com' });

		const userGetter = () => getUser();

		render(UserWrapper, { queryClient, userGetter });

		await waitFor(() => {
			screen.getByText('info@wundergraph.com');
		});

		scope.done();
	});
});
