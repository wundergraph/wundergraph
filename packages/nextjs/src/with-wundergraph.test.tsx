import { render, screen, waitFor } from '@testing-library/react';
import { Client, ClientConfig } from '@wundergraph/sdk/client';

import nock from 'nock';
import fetch from 'node-fetch';
import React from 'react';

import { serialize } from '@wundergraph/sdk/internal';
import { userSWRKey } from '@wundergraph/swr';
import { SWRConfig } from 'swr';
import { useWunderGraphContext } from './context';
import { createWunderGraphNext } from './create-wundergraph';

const renderWithWunderGraph = (element: React.ReactElement, config?: any) => {
	const Wrapper = ({ children }: { children: React.ReactNode }) => children;

	const WithWunderGraph = config.withWunderGraph(Wrapper);

	return render(
		<WithWunderGraph ssrCache={config.ssrCache || {}} user={config.user}>
			<SWRConfig value={config.swrConfig}>{element}</SWRConfig>
		</WithWunderGraph>
	);
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
		.query({ wg_api_hash: '123', wg_variables: '{}', ...wgParams });
};

describe('Next.js SWR', () => {
	const client = createClient();

	let provider: Map<string, any>;

	beforeEach(() => {
		provider = new Map();
	});

	it('ssr cache should be empty', async () => {
		const { useQuery, withWunderGraph } = createWunderGraphNext({
			client,
			ssr: true,
		});

		let ssrCache = {};

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

			return <div>Response: {data?.id ? data.id : 'none'}</div>;
		}

		renderWithWunderGraph(<Page />, {
			withWunderGraph,
			ssrCache,
			swrConfig: { provider: () => provider },
		});

		screen.getByText('Response: none');

		await waitFor(() => {
			screen.getByText('Response: 1');
		});

		scope.done();
	});

	it('should return fallback data from ssr cache', async () => {
		const { useQuery, withWunderGraph } = createWunderGraphNext({
			client,
			ssr: true,
		});

		let ssrCache = {
			[serialize({ operationName: 'Weather' })]: { id: 1 },
		};

		const scope = nockQuery()
			.once()
			.reply(200, {
				data: {
					id: '2',
				},
			});

		function Page() {
			const { data } = useQuery({
				operationName: 'Weather',
			});

			return <div>Response: {data?.id ? data.id : 'none'}</div>;
		}

		renderWithWunderGraph(<Page />, {
			withWunderGraph,
			ssrCache,
			swrConfig: { provider: () => provider },
		});

		screen.getByText('Response: 1');

		await waitFor(() => {
			screen.getByText('Response: 2');
		});

		scope.done();
	});

	it('should get fallback user from ssr cache', async () => {
		const { useUser, withWunderGraph } = createWunderGraphNext({
			client,
			ssr: true,
		});

		let ssrCache = {
			[userSWRKey]: { userId: 1 },
		};

		function Page() {
			const { data } = useUser();

			return <div>User: {data?.userId}</div>;
		}

		renderWithWunderGraph(<Page />, {
			withWunderGraph,
			ssrCache,
			swrConfig: { provider: () => provider },
		});

		screen.getByText('User: 1');
	});

	it('should match context user from ssr cache', async () => {
		const { useUser, withWunderGraph } = createWunderGraphNext({
			client,
			ssr: true,
		});

		const user = { userId: 1 };

		let ssrCache = {
			[userSWRKey]: user,
		};

		function Page() {
			const context = useWunderGraphContext();

			const { data } = useUser();
			return <div>User: {context?.user?.userId === data?.userId ? 'matches' : ''}</div>;
		}

		renderWithWunderGraph(<Page />, {
			withWunderGraph,
			ssrCache,
			user,
			swrConfig: { provider: () => provider },
		});

		screen.getByText('User: matches');
	});

	it('should return subscription fallback data from ssr cache', async () => {
		const { useSubscription, withWunderGraph } = createWunderGraphNext({
			client,
			ssr: true,
		});

		let ssrCache = {
			[serialize({ operationName: 'Weather', subscription: true })]: { id: 1 },
		};

		function Page() {
			const { data } = useSubscription({
				operationName: 'Weather',
			});

			return <div>Response: {data?.id ? data.id : 'none'}</div>;
		}

		renderWithWunderGraph(<Page />, {
			withWunderGraph,
			ssrCache,
			swrConfig: { provider: () => provider },
		});

		screen.getByText('Response: 1');
	});

	it('should support isolated swr cache', async () => {
		const { useSubscription, withWunderGraph } = createWunderGraphNext({
			client,
			ssr: true,
		});

		const key = serialize({ operationName: 'Weather', subscription: true });

		let ssrCache = {
			[key]: { id: 1 },
		};

		function Foo() {
			const { data } = useSubscription({
				operationName: 'Weather',
			});

			return <div>Response: {data?.id ? data.id : 'none'}</div>;
		}

		function Page() {
			return (
				<div>
					<Foo />
					<SWRConfig value={{ provider: () => new Map([[key, { data: { id: '2' } }]]) }}>
						<Foo />
					</SWRConfig>
					:
					<SWRConfig value={{ provider: () => new Map([[key, { data: { id: '3' } }]]) }}>
						<Foo />
					</SWRConfig>
				</div>
			);
		}

		renderWithWunderGraph(<Page />, {
			withWunderGraph,
			ssrCache,
			swrConfig: { provider: () => provider },
		});

		screen.getByText('Response: 1');

		screen.getByText('Response: 2');

		screen.getByText('Response: 3');
	});

	it('context returns client', async () => {
		const { withWunderGraph } = createWunderGraphNext({
			client,
		});

		function Page() {
			const context = useWunderGraphContext();
			return <div>Client: {context?.client ? 'true' : 'false'}</div>;
		}

		renderWithWunderGraph(<Page />, {
			withWunderGraph,
		});

		screen.getByText('Client: true');
	});
});
