import {
	AuthorizationError,
	Client,
	ClientConfig,
	InputValidationError,
	OperationRequestOptions,
	ResponseError,
} from './index';
import nock from 'nock';
import fetch from 'node-fetch';
import { QueryRequestOptions } from './types';

const newClient = (overrides?: Partial<ClientConfig>) => {
	return new Client({
		sdkVersion: '1.0.0',
		baseURL: 'https://api.com',
		applicationHash: '123',
		customFetch: fetch as any,
		operationMetadata: {
			Weather: {
				requiresAuthentication: true,
			},
			CreateWeather: {
				requiresAuthentication: true,
			},
			CreateWeatherWithoutAuth: {
				requiresAuthentication: false,
			},
		},
		...overrides,
	});
};

describe('Client', () => {
	const mockErrorJson = {
		message: 'Bad Request: Invalid input',
		errors: [
			{
				propertyPath: '/',
				message: 'some error message',
				invalidValue: {},
			},
		],
		input: {},
	};

	describe('Utility', () => {
		test('Should be able to set extra headers', async () => {
			const client = newClient({
				extraHeaders: {
					'X-Test-From-Constructor': 'extra-header',
				},
			});

			const scope = nock('https://api.com')
				.matchHeader('accept', 'application/json')
				.matchHeader('content-type', 'application/json')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.matchHeader('X-Test', 'test')
				.matchHeader('X-Test-From-Constructor', 'extra-header')
				.get('/operations/Weather')
				.query({ wg_api_hash: '123' })
				.once()
				.reply(200, {
					data: {
						id: '1',
					},
				});

			client.setExtraHeaders({
				'X-Test': 'test',
			});

			const resp = await client.query({
				operationName: 'Weather',
			});

			scope.done();

			expect(resp.data).toEqual({ id: '1' });
			expect(resp.error).toBeUndefined();
		});

		test('Should be able to build the cache key for an operation', async () => {
			const cacheKey = Client.buildCacheKey({
				operationName: 'Weather',
				input: { lat: 1 },
			});

			expect(cacheKey).toEqual('#operationName:"Weather",input:#lat:1,,');
		});
	});

	describe('Query', () => {
		test('Should be able to fire a simple query operation', async () => {
			const client = newClient();

			const scope = nock('https://api.com')
				.matchHeader('accept', 'application/json')
				.matchHeader('content-type', 'application/json')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.get('/operations/Weather')
				.query({ wg_api_hash: '123' })
				.once()
				.reply(200, {
					data: {
						id: '1',
					},
				});

			const resp = await client.query({
				operationName: 'Weather',
			});

			scope.done();

			expect(resp.data).toEqual({ id: '1' });
			expect(resp.error).toBeUndefined();
		});

		test('Should be able to pass input', async () => {
			const client = newClient();

			const scope = nock('https://api.com')
				.matchHeader('accept', 'application/json')
				.matchHeader('content-type', 'application/json')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.get('/operations/Weather')
				.query({
					wg_api_hash: '123',
					wg_variables: JSON.stringify({
						lat: 1,
					}),
				})
				.once()
				.reply(200, {
					data: {
						id: '1',
					},
				});

			const resp = await client.query<OperationRequestOptions<'Weather', { lat: number }>, { id: number }>({
				operationName: 'Weather',
				input: {
					lat: 1,
				},
			});

			scope.done();

			expect(resp.data?.id).toEqual('1');
			expect(resp.error).toBeUndefined();
		});

		test('Should set an error when origin return error', async () => {
			const client = newClient();

			const scope = nock('https://api.com')
				.matchHeader('accept', 'application/json')
				.matchHeader('content-type', 'application/json')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.get('/operations/Weather')
				.query({ wg_api_hash: '123' })
				.once()
				.reply(200, {
					errors: [
						{
							message: 'Error',
						},
						{
							message: 'Error2',
						},
					],
				});

			const resp = await client.query<QueryRequestOptions<'Weather'>>({
				operationName: 'Weather',
			});

			scope.done();

			expect(resp.error).toBeInstanceOf(ResponseError);
			expect(resp.error.message).toBe('Error');
			expect(resp.error.code).toBe('ResponseError');
			expect(resp.error.statusCode).toBe(200);
			expect(resp.error.errors).toEqual([
				{
					message: 'Error',
				},
				{
					message: 'Error2',
				},
			]);
			expect(resp.data).toBeUndefined();
		});

		test('Should set correct error code when origin returns a custom typescript operation error', async () => {
			const client = newClient();

			const scope = nock('https://api.com')
				.matchHeader('accept', 'application/json')
				.matchHeader('content-type', 'application/json')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.get('/operations/Weather')
				.query({ wg_api_hash: '123' })
				.once()
				.reply(200, {
					errors: [
						{
							message: 'Error',
							code: 'NotFound',
						},
					],
				});

			const resp = await client.query<QueryRequestOptions<'Weather'>>({
				operationName: 'Weather',
			});

			scope.done();

			expect(resp.error).toBeInstanceOf(ResponseError);
			expect(resp.error.message).toBe('Error');
			expect(resp.error.code).toBe('NotFound');
			expect(resp.error.statusCode).toBe(200);
			expect(resp.error.errors).toEqual([
				{
					message: 'Error',
					code: 'NotFound',
				},
			]);
			expect(resp.data).toBeUndefined();
		});

		test('Should return ResponseError when request fails with no response body', async () => {
			const client = newClient();

			nock('https://api.com').get('/operations/Weather').query({ wg_api_hash: '123' }).once().reply(500);

			const resp = await client.query<QueryRequestOptions<'Weather'>>({
				operationName: 'Weather',
			});

			expect(resp.error).toBeInstanceOf(ResponseError);
			expect(resp.error.code).toBe('ResponseError');
			expect(resp.error.statusCode).toBe(500);
			expect(resp.error.message).toBe('Invalid response from server');
			expect(resp.error.errors).toBeUndefined();
			expect(resp.data).toBeUndefined();
		});

		test('Should return InputValidationError when response body contains errors', async () => {
			const client = newClient();

			nock('https://api.com').get('/operations/Weather').query({ wg_api_hash: '123' }).once().reply(400, mockErrorJson);

			const resp = await client.query<QueryRequestOptions<'Weather'>>({
				operationName: 'Weather',
			});

			expect(resp.error).toBeInstanceOf(InputValidationError);
			expect(resp.error.code).toBe('InputValidationError');
			expect(resp.error.statusCode).toBe(400);
			expect(resp.error.message).toBe('Bad Request: Invalid input');
			expect(resp.error.errors).toEqual([{ invalidValue: {}, message: 'some error message', propertyPath: '/' }]);
			expect(resp.data).toBeUndefined();
		});

		test('Should return ResponseError when response body is plaintext', async () => {
			const client = newClient();
			const errorText = 'Some error text';

			nock('https://api.com').get('/operations/Weather').query({ wg_api_hash: '123' }).once().reply(400, errorText);

			const resp = await client.query<QueryRequestOptions<'Weather'>>({
				operationName: 'Weather',
			});

			expect(resp.error).toBeInstanceOf(ResponseError);
			expect(resp.error.code).toBe('ResponseError');
			expect(resp.error.statusCode).toBe(400);
			expect(resp.error.message).toBe('Invalid response from server');
			expect(resp.error.errors).toBeUndefined();
			expect(resp.data).toBeUndefined();
		});
	});

	describe('Mutation', () => {
		test('Should be able to fire a simple mutation operation', async () => {
			const client = newClient();

			const csrfScope = nock('https://api.com')
				.matchHeader('accept', 'text/plain')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.get('/auth/cookie/csrf')
				.reply(200, 'csrf');

			const apiScope = nock('https://api.com')
				.matchHeader('accept', 'application/json')
				.matchHeader('content-type', 'application/json')
				.matchHeader('x-csrf-token', 'csrf')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.post('/operations/CreateWeather')
				.query({ wg_api_hash: '123' })
				.once()
				.reply(200, {
					data: {
						id: '1',
					},
				});

			const resp = await client.mutate({
				operationName: 'CreateWeather',
			});

			csrfScope.done();
			apiScope.done();

			expect(resp.data).toEqual({ id: '1' });
			expect(resp.error).toBeUndefined();
		});

		test('Should make a CSRF call for authenticated mutations', async () => {
			const client = newClient();

			const csrfScope = nock('https://api.com')
				.matchHeader('accept', 'text/plain')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.get('/auth/cookie/csrf')
				.reply(200, 'csrf');

			const apiScope = nock('https://api.com')
				.matchHeader('accept', 'application/json')
				.matchHeader('content-type', 'application/json')
				.matchHeader('x-csrf-token', 'csrf')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.post('/operations/CreateWeather')
				.query({ wg_api_hash: '123' })
				.once()
				.reply(200, {
					data: {
						id: '1',
					},
				});

			const resp = await client.mutate({
				operationName: 'CreateWeather',
			});

			csrfScope.done();
			apiScope.done();

			expect(resp.data).toEqual({ id: '1' });
			expect(resp.error).toBeUndefined();
		});

		test('Should be able pass input', async () => {
			const client = newClient();

			const csrfScope = nock('https://api.com')
				.matchHeader('accept', 'text/plain')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.get('/auth/cookie/csrf')
				.reply(200, 'csrf');

			const apiScope = nock('https://api.com')
				.matchHeader('accept', 'application/json')
				.matchHeader('content-type', 'application/json')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.post('/operations/CreateWeather', { lat: 1 })
				.query({ wg_api_hash: '123' })
				.once()
				.reply(200, {
					data: {
						id: '1',
					},
				});

			const resp = await client.mutate<OperationRequestOptions<'CreateWeather'>, { id: number }>({
				operationName: 'CreateWeather',
				input: { lat: 1 },
			});

			csrfScope.done();
			apiScope.done();

			expect(resp.data?.id).toEqual('1');
			expect(resp.error).toBeUndefined();
		});

		test('Should set an error when origin return error', async () => {
			const client = newClient();

			const csrfScope = nock('https://api.com')
				.matchHeader('accept', 'text/plain')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.get('/auth/cookie/csrf')
				.reply(200, 'csrf');

			const apiScope = nock('https://api.com')
				.matchHeader('accept', 'application/json')
				.matchHeader('content-type', 'application/json')
				.matchHeader('WG-SDK-Version', '1.0.0')
				.post('/operations/CreateWeather')
				.query({ wg_api_hash: '123' })
				.once()
				.reply(200, {
					errors: [
						{
							message: 'Error',
						},
					],
				});

			const resp = await client.mutate({
				operationName: 'CreateWeather',
			});

			csrfScope.done();
			apiScope.done();

			expect(resp.error).toBeInstanceOf(ResponseError);
			expect(resp.error.code).toBe('ResponseError');
			expect(resp.error.statusCode).toBe(200);
			expect(resp.error.message).toBe('Error');
			expect(resp.error.errors).toEqual([
				{
					message: 'Error',
				},
			]);
			expect(resp.data).toBeUndefined();
		});
	});

	test('Should return ResponseError when request fails with no response body', async () => {
		const client = newClient();

		const csrfScope = nock('https://api.com')
			.matchHeader('accept', 'text/plain')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.get('/auth/cookie/csrf')
			.reply(200, 'csrf');

		const apiScope = nock('https://api.com')
			.matchHeader('accept', 'application/json')
			.matchHeader('content-type', 'application/json')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.post('/operations/CreateWeather')
			.query({ wg_api_hash: '123' })
			.once()
			.reply(500);

		const resp = await client.mutate({
			operationName: 'CreateWeather',
		});

		csrfScope.done();
		apiScope.done();

		expect(resp.error).toBeInstanceOf(ResponseError);
		expect(resp.error.code).toBe('ResponseError');
		expect(resp.error.statusCode).toBe(500);
		expect(resp.error.message).toBe('Invalid response from server');
		expect(resp.error.errors).toBeUndefined();
		expect(resp.data).toBeUndefined();
	});

	test('Should return InputValidationError when response body contains errors', async () => {
		const client = newClient();

		const csrfScope = nock('https://api.com')
			.matchHeader('accept', 'text/plain')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.get('/auth/cookie/csrf')
			.reply(200, 'csrf');

		const apiScope = nock('https://api.com')
			.matchHeader('accept', 'application/json')
			.matchHeader('content-type', 'application/json')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.post('/operations/CreateWeather')
			.query({ wg_api_hash: '123' })
			.once()
			.reply(400, mockErrorJson);

		const resp = await client.mutate({
			operationName: 'CreateWeather',
		});

		csrfScope.done();
		apiScope.done();

		expect(resp.error).toBeInstanceOf(ResponseError);
		expect(resp.error.code).toBe('InputValidationError');
		expect(resp.error.statusCode).toBe(400);
		expect(resp.error.message).toBe('Bad Request: Invalid input');
		expect(resp.error.errors).toEqual([{ invalidValue: {}, message: 'some error message', propertyPath: '/' }]);
		expect(resp.data).toBeUndefined();
	});

	test('Should return ResponseError when response body is plaintext', async () => {
		const client = newClient();
		const errorText = 'Error text';

		const csrfScope = nock('https://api.com')
			.matchHeader('accept', 'text/plain')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.get('/auth/cookie/csrf')
			.reply(200, 'csrf');

		const apiScope = nock('https://api.com')
			.matchHeader('accept', 'application/json')
			.matchHeader('content-type', 'application/json')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.post('/operations/CreateWeather')
			.query({ wg_api_hash: '123' })
			.once()
			.reply(400, errorText);

		const resp = await client.mutate({
			operationName: 'CreateWeather',
		});

		csrfScope.done();
		apiScope.done();

		expect(resp.error).toBeInstanceOf(ResponseError);
		expect(resp.error.code).toBe('ResponseError');
		expect(resp.error.statusCode).toBe(400);
		expect(resp.error.message).toBe('Invalid response from server');
		expect(resp.error.errors).toBeUndefined();
		expect(resp.data).toBeUndefined();
	});

	test('Should return AuthorizationError when server responds with 401', async () => {
		const client = newClient();

		const csrfScope = nock('https://api.com')
			.matchHeader('accept', 'text/plain')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.get('/auth/cookie/csrf')
			.reply(200, 'csrf');

		const apiScope = nock('https://api.com')
			.matchHeader('accept', 'application/json')
			.matchHeader('content-type', 'application/json')
			.matchHeader('WG-SDK-Version', '1.0.0')
			.post('/operations/CreateWeather')
			.query({ wg_api_hash: '123' })
			.once()
			.reply(401, 'Not authorized');

		const resp = await client.mutate({
			operationName: 'CreateWeather',
		});

		expect(resp.error).toBeInstanceOf(AuthorizationError);
		expect(resp.error.code).toBe('AuthorizationError');
		expect(resp.error.statusCode).toBe(401);
		expect(resp.error.message).toBe('Not authorized');
		expect(resp.error.errors).toBeUndefined();
		expect(resp.data).toBeUndefined();

		csrfScope.done();
		apiScope.done();

		expect(resp.data).toBeUndefined();
	});
});
