import { render, screen, waitFor } from '@testing-library/react';
import { Client, ClientConfig } from '@wundergraph/sdk/client';
import { createHooks } from '@wundergraph/swr';
import nock from 'nock';
import fetch from 'node-fetch';
import React from 'react';
import { SWRConfig } from 'swr';
import { WunderGraphProvider } from './context';
import { SSRMiddleWare } from './ssr-middleware';

const createClient = (overrides?: Partial<ClientConfig>) => {
	return new Client({
		sdkVersion: '1.0.0',
		baseURL: 'https://api.com',
		applicationHash: '123',
		applicationPath: 'app',
		customFetch: fetch as any,
		operationMetadata: {
			Weather: {
				requiresAuthentication: false,
			},
		},
		...overrides,
	});
};

const _renderWithConfig = (
	element: React.ReactElement,
	config: Parameters<typeof SWRConfig>[0]['value'],
	value?: any
): ReturnType<typeof render> => {
	const TestMiddleware = ({ children }: { children: React.ReactNode }) => (
		<WunderGraphProvider value={value}>
			<SWRConfig value={config}>{children}</SWRConfig>
		</WunderGraphProvider>
	);
	return render(element, { wrapper: TestMiddleware });
};

export const renderWithConfig = (
	element: React.ReactElement,
	config?: Parameters<typeof _renderWithConfig>[1],
	value?: any
): ReturnType<typeof _renderWithConfig> => {
	const provider = () => new Map();
	return _renderWithConfig(element, { provider, ...config }, value);
};

export const renderWithGlobalCache = (
	element: React.ReactElement,
	config?: Parameters<typeof _renderWithConfig>[1],
	value?: any
): ReturnType<typeof _renderWithConfig> => {
	return _renderWithConfig(element, { ...config }, value);
};

const nockQuery = (operationName = 'Weather', wgParams = {}) => {
	return nock('https://api.com')
		.matchHeader('accept', 'application/json')
		.matchHeader('content-type', 'application/json')
		.matchHeader('WG-SDK-Version', '1.0.0')
		.get('/app/operations/' + operationName)
		.query({ wg_api_hash: '123', wg_variables: '{}', ...wgParams });
};

describe('SSR Middleware', () => {
	const client = createClient();
	const { useQuery } = createHooks(client);

	it('ssr cache should be empty when ssr is disabled', async () => {
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

			return <div>Response: {data?.id}</div>;
		}

		renderWithGlobalCache(<Page />, { use: [SSRMiddleWare] }, { ssrCache, ssr: false, client });

		await waitFor(() => {
			screen.getByText('Response: 1');
		});

		expect(ssrCache).toEqual({});

		scope.done();
	});
});
