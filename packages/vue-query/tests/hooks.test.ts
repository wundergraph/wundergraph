import { waitFor, screen, render, fireEvent } from '@testing-library/vue';
import { QueryCache, QueryClient, useQueryClient, VueQueryPlugin } from '@tanstack/vue-query';

import { Client, ClientConfig, OperationsDefinition, ResponseError } from '@wundergraph/sdk/client';
import nock from 'nock';
import fetch from 'node-fetch';

import { createHooks } from '../src';
import { defineComponent, Component, h, onMounted } from 'vue';

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

const renderWithPlugin = (component: Component) => {
	return render(component, { global: { plugins: [VueQueryPlugin] } });
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
		.get(`/operations/${operationName}`)
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
		.post(`/operations/${operationName}`, wgParams)
		.query({ wg_api_hash: '123' });

	if (authenticated) {
		mutation.matchHeader('x-csrf-token', 'csrf');
	}

	return {
		csrfScope,
		mutation,
	};
};

describe('Vue Query - createHooks', () => {
	const client = createClient();

	const hooks = createHooks<Operations>(client);

	it('should be able to init hooks', async () => {
		expect(hooks).toBeTruthy();
	});
});

describe('Vue Query - useQuery', () => {
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

		const component = defineComponent({
			setup() {
				const { data } = useQuery({
					operationName: 'Weather',
				});
				return { data };
			},
			render() {
				return h('div', null, `Response: ${this.data?.id}`);
			},
		});

		renderWithPlugin(component);

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

		const component = defineComponent({
			setup() {
				const { isFetched } = useQuery({
					operationName: 'Weather',
					input: {
						forCity: 'berlin',
					},
					enabled: false,
				});
				return { isFetched };
			},
			render() {
				return h('div', null, `Fetched: ${this.isFetched ? 'true' : 'false'}`);
			},
		});

		renderWithPlugin(component);

		screen.getByText('Fetched: false');
		expect(() => scope.done()).toThrow();
	});
});

describe('Vue Query - useMutation', () => {
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

		const component = defineComponent({
			setup() {
				const { data, mutate } = useMutation({
					operationName: 'SetName',
				});

				onMounted(() => {
					mutate({ name: 'Rick Astley' });
				});

				return { data };
			},
			render() {
				return h('div', null, this.data?.id);
			},
		});

		renderWithPlugin(component);

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

		const component = defineComponent({
			setup() {
				const { data, mutate } = useMutation({
					operationName: 'SetNameWithoutAuth',
				});

				onMounted(() => {
					mutate({ name: 'Rick Astley' });
				});

				return { data };
			},
			render() {
				return h('div', null, this.data?.id);
			},
		});

		renderWithPlugin(component);

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

		const component = defineComponent({
			setup() {
				const queryClient = useQueryClient();

				const { data } = useQuery({
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

				return { data, onClick };
			},
			render() {
				return h('div', null, [h('div', null, this.data?.name), h('button', { onClick: this.onClick }, 'submit')]);
			},
		});

		renderWithPlugin(component);

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

describe('Vue Query - useSubscription', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryClient.clear();
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

		const component = defineComponent({
			setup() {
				const { data } = useSubscription({
					operationName: 'Countdown',
					subscribeOnce: true,
					input: {
						from: 100,
					},
				});
				return { data };
			},
			render() {
				return h('div', null, this.data?.count ? this.data.count : 'loading');
			},
		});

		renderWithPlugin(component);

		screen.getByText('loading');
		screen.debug();
		await waitFor(
			() => {
				screen.getByText('100');
			},
			{
				timeout: 10000,
			}
		);
		screen.debug();
		scope.done();
	}, 10000);
});

describe('Vue Query - useUser', () => {
	const client = createClient();

	const queryCache = new QueryCache();
	const queryClient = new QueryClient({ queryCache });

	beforeEach(() => {
		queryClient.clear();
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

		const component = defineComponent({
			setup() {
				const { data } = useUser();

				return { data };
			},
			render() {
				return h('div', null, this.data?.email);
			},
		});

		renderWithPlugin(component);

		await waitFor(() => {
			screen.getByText('info@wundergraph.com');
		});

		scope.done();
	});
});
