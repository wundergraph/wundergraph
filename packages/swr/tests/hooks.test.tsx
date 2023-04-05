import { act, waitFor, screen, render } from '@testing-library/react';
import React from 'react';
import { SWRConfig } from 'swr';

import { Client, ClientConfig } from '@wundergraph/sdk/client';
import nock from 'nock';
import fetch from 'node-fetch';

import { createHooks } from '../src';
import { InputValidationError } from '@wundergraph/sdk/client';

export function sleep(time: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, time));
}

type MockError = {
	propertyPath: string;
	message: string;
	invalidValue: object;
};

const mockErrorJson = {
	code: 'InputValidationError',
	message: 'Bad Request: Invalid input',
	errors: [
		{
			propertyPath: '/',
			message: 'error one',
			invalidValue: {},
		},
		{
			propertyPath: '/',
			message: 'error two',
			invalidValue: {},
		},
	],
	input: {},
};

const _renderWithConfig = (
	element: React.ReactElement,
	config: Parameters<typeof SWRConfig>[0]['value']
): ReturnType<typeof render> => {
	const TestSWRConfig = ({ children }: { children: React.ReactNode }) => (
		<SWRConfig value={config}>{children}</SWRConfig>
	);
	return render(element, { wrapper: TestSWRConfig });
};

export const renderWithConfig = (
	element: React.ReactElement,
	config?: Parameters<typeof _renderWithConfig>[1]
): ReturnType<typeof _renderWithConfig> => {
	const provider = () => new Map();
	return _renderWithConfig(element, { provider, ...config });
};

export const renderWithGlobalCache = (
	element: React.ReactElement,
	config?: Parameters<typeof _renderWithConfig>[1]
): ReturnType<typeof _renderWithConfig> => {
	return _renderWithConfig(element, { ...config });
};

const createClient = (overrides?: Partial<ClientConfig>) => {
	return new Client({
		sdkVersion: '1.0.0',
		baseURL: 'https://api.com',
		applicationHash: '123',
		customFetch: fetch as any,
		operationMetadata: {
			Weather: {
				requiresAuthentication: true,
			},
			SetName: {
				requiresAuthentication: true,
			},
			SetNameWithoutAuth: {
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

describe('SWR - createHooks', () => {
	const client = createClient();

	const hooks = createHooks(client);

	it('should be able to init hooks', async () => {
		expect(hooks).toBeTruthy();
	});
});

describe('SWR - useQuery', () => {
	const client = createClient();

	const { useQuery } = createHooks(client);

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

		renderWithGlobalCache(<Page />);

		await waitFor(() => {
			screen.getByText('Response: 1');
		});

		scope.done();
	});

	it('returns a ResponseError if the response is not 2xx and has a plaintext body', async () => {
		const scope = nockQuery().once().reply(400, 'Bad Request');

		function Page() {
			const { error } = useQuery({
				operationName: 'Weather',
			});

			return <div>{error?.message}</div>;
		}

		renderWithConfig(<Page />);

		await waitFor(() => {
			screen.getByText('Bad Request');
		});

		scope.done();
	});

	it('returns a ResponseError if the response is not 2xx and has no body', async () => {
		const scope = nockQuery().once().reply(400);

		function Page() {
			const { error } = useQuery({
				operationName: 'Weather',
			});

			return <div>{error?.message}</div>;
		}

		renderWithConfig(<Page />);

		await waitFor(() => {
			screen.getByText('Invalid response from server');
		});

		scope.done();
	});

	it('returns an InputValidationError if the response is 400 and has error code "InputValidationError"', async () => {
		const scope = nockQuery().once().reply(400, mockErrorJson);

		function Page() {
			const { error } = useQuery({
				operationName: 'Weather',
				input: {}, // unnecessary but for illustration
			});

			return (
				<div>
					{error?.message}
					{error instanceof InputValidationError && error.errors.map((error: MockError) => error.message)}
				</div>
			);
		}

		renderWithConfig(<Page />);

		await waitFor(() => {
			screen.getByText(/Bad Request: Invalid input/);
			screen.getByText(/error one/);
			screen.getByText(/error two/);
		});

		scope.done();
	});

	it('should be disabled', async () => {
		const scope = nockQuery().reply(200, {
			data: {
				id: '1',
			},
		});

		function Page() {
			const { isValidating } = useQuery({
				operationName: 'Weather',
				enabled: false,
			});

			return <div>{isValidating ? 'true' : 'false'}</div>;
		}

		renderWithGlobalCache(<Page />);

		screen.getByText('false');

		await act(() => sleep(150));

		screen.getByText('false');

		expect(() => scope.done()).toThrow();
	});

	it('should subscribe live query', async () => {
		// web streams not supported in node-fetch, but we check if the hook returns isLoading
		nockQuery('Weather', {
			wg_live: 'true',
		}).reply(200, {
			data: {
				id: '1',
			},
		});

		function Page() {
			const { isLoading } = useQuery({
				operationName: 'Weather',
				liveQuery: true,
			});

			return <div>{isLoading ? 'true' : 'false'}</div>;
		}

		renderWithGlobalCache(<Page />);

		screen.getByText('true');
	});
});

describe('SWR - useMutation', () => {
	const client = createClient();

	const { useMutation } = createHooks(client);

	it('should trigger mutation with auth', async () => {
		const { mutation, csrfScope } = nockMutation('SetName', { name: 'Rick Astley' }, true);

		const scope = mutation.once().reply(200, {
			data: {
				id: 'Never gonna give you up',
			},
		});

		function Page() {
			const { data, isMutating, trigger } = useMutation({
				operationName: 'SetName',
			});

			React.useEffect(() => {
				trigger({ name: 'Rick Astley' }, { throwOnError: false });
			}, []);

			return <div>{isMutating ? 'true' : data?.id}</div>;
		}

		renderWithGlobalCache(<Page />);

		screen.getByText('true');

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
			const { data, isMutating, trigger } = useMutation({
				operationName: 'SetNameWithoutAuth',
			});

			React.useEffect(() => {
				trigger({ name: 'Rick Astley' }, { throwOnError: false });
			}, []);

			return <div>{isMutating ? 'true' : data?.id}</div>;
		}

		renderWithGlobalCache(<Page />);

		screen.getByText('true');

		await waitFor(() => {
			screen.getByText('1');
		});

		expect(() => csrfScope.done()).toThrow(); // should not be called

		scope.done();
	});

	it('returns a ResponseError if the response is not 2xx and has a plaintext body', async () => {
		const { mutation, csrfScope } = nockMutation('SetNameWithoutAuth', { name: 'Rick Astley' });
		const scope = mutation.once().reply(400, 'An error');

		function Page() {
			const { data, error, isMutating, trigger } = useMutation({
				operationName: 'SetNameWithoutAuth',
			});

			React.useEffect(() => {
				trigger({ name: 'Rick Astley' }, { throwOnError: false });
			}, []);

			return (
				<div>
					{isMutating ? 'true' : data?.id}
					{error?.message}
				</div>
			);
		}

		renderWithGlobalCache(<Page />);

		screen.getByText(/true/);

		await waitFor(() => {
			screen.getByText(/An error/);
		});

		expect(() => csrfScope.done()).toThrow(); // should not be called

		scope.done();
	});

	it('returns a ResponseError if the response is not 2xx and has no body', async () => {
		const { mutation, csrfScope } = nockMutation('SetNameWithoutAuth', { name: 'Rick Astley' });
		const scope = mutation.once().reply(400);

		function Page() {
			const { data, error, isMutating, trigger } = useMutation({
				operationName: 'SetNameWithoutAuth',
			});

			React.useEffect(() => {
				trigger({ name: 'Rick Astley' }, { throwOnError: false });
			}, []);

			return (
				<div>
					{isMutating ? 'true' : data?.id}
					{error?.message}
				</div>
			);
		}

		renderWithGlobalCache(<Page />);

		screen.getByText(/true/);

		await waitFor(() => {
			screen.getByText('Invalid response from server');
		});

		expect(() => csrfScope.done()).toThrow(); // should not be called

		scope.done();
	});

	it('returns an InputValidationError if the response is not 2xx and has a json body', async () => {
		const { mutation, csrfScope } = nockMutation('SetNameWithoutAuth', { name: 'Rick Astley' });
		const scope = mutation.once().reply(400, mockErrorJson);

		function Page() {
			const { data, error, isMutating, trigger } = useMutation({
				operationName: 'SetNameWithoutAuth',
			});

			React.useEffect(() => {
				trigger({ name: 'Rick Astley' }, { throwOnError: false });
			}, []);

			return (
				<div>
					{isMutating ? 'true' : data?.id}
					{error?.message}
					{error instanceof InputValidationError && error.errors.map((error: MockError) => error.message)}
				</div>
			);
		}

		renderWithGlobalCache(<Page />);

		screen.getByText(/true/);

		await waitFor(() => {
			screen.getByText(/Bad Request: Invalid input/);
			screen.getByText(/error one/);
			screen.getByText(/error two/);
		});

		expect(() => csrfScope.done()).toThrow(); // should not be called

		scope.done();
	});
});

describe('SWR - useSubscription', () => {
	const client = createClient();

	const { useSubscription } = createHooks(client);

	it('should subscribe', async () => {
		// web streams not supported in node-fetch, but we check if the hook returns isLoading
		nockQuery('Weather', {
			wg_live: 'true',
		}).reply(200, {
			data: {
				id: '1',
			},
		});

		function Page() {
			const { data, isLoading } = useSubscription({
				operationName: 'Weather',
			});

			return <div>{isLoading ? 'true' : data?.id}</div>;
		}

		renderWithGlobalCache(<Page />);

		screen.getByText('true');

		waitFor(() => {
			screen.getByText('1');
		});
	});
});

describe('SWR - useUser', () => {
	const client = createClient();

	const { useUser } = createHooks(client);

	it('should return user', async () => {
		// web streams not supported in node-fetch, but we check if the hook returns isLoading
		const scope = nock('https://api.com')
			.matchHeader('accept', 'application/json')
			.matchHeader('content-type', 'application/json')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.get('/auth/user')
			.query({ wg_api_hash: '123' })
			.reply(200, { email: 'info@wundergraph.com' });

		function Page() {
			const { data, ...rest } = useUser();

			return <div>{data?.email}</div>;
		}

		renderWithGlobalCache(<Page />);

		await waitFor(() => {
			screen.getByText('info@wundergraph.com');
		});

		scope.done();
	});
});
