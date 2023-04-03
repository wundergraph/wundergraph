import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer();

beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('test recursive operation calls hooks', () => {
	test('rescursive call', async () => {
		const client = wg.client();
		const directResult = await client.query({
			operationName: 'Continents',
		});
		const recursiveResult = await client.query({
			operationName: 'RecursiveContinents',
		});

		// RecursiveContinents should end up calling Continents' mockResolve hook
		const directData = directResult.data!.countries_continents;
		const recursiveData = recursiveResult.data!.countries_continents;
		expect(directData.length).toBe(recursiveData.length);
		expect(directData[0].code).toBe(recursiveData[0].code);
		expect(directData[0].name).toBe(recursiveData[0].name);
	});
});

describe('preResolve chain', () => {
	test('preResolve failure is reported', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'PreResolveFailure',
			input: {
				s: 'initial',
			},
		});
		expect(result.data).toBeUndefined();
		expect(result.error?.message).toMatch(/preResolve.*failed/i);
	});
	test('mutatingPreResolve failure is reported', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'MutatingPreResolveFailure',
			input: {
				s: 'initial',
			},
		});
		expect(result.data).toBeUndefined();
		expect(result.error?.message).toMatch(/mutatingPreResolve.*failed/i);
	});
	test('customResolve failure is reported', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'CustomResolveFailure',
			input: {
				s: 'initial',
			},
		});
		expect(result.data).toBeUndefined();
		expect(result.error?.message).toMatch(/customResolve.*failed/i);
	});
	test('customResolve', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'CustomResolve',
			input: {
				s: 'initial',
			},
		});
		expect(result?.data?.echo_string).toBe('customResolved');
	});
	test('customResolve skip', async () => {
		const skipped = 'skipped';
		const client = wg.client();
		const result = await client.query({
			operationName: 'CustomResolveSkip',
			input: {
				s: skipped,
			},
		});
		expect(result?.data?.echo_string).toBe(`string: ${skipped}`);
	});
	test('mutatingPreResolve with mockResolve is called', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'PreResolveChain',
			input: {
				s: 'initial',
			},
		});
		expect(result.data?.echo_string).toBe('initial.mutatingPreResolve.mockResolve');
	});
});

describe('postResolve chain', () => {
	test('mutatingPostResolve', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'MutatingPostResolve',
			input: {
				s: 'initial',
			},
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.echo_string).toBe('initial.mockResolve.mutatingPostResolve');
	});
});

describe('prevent infinite recursion', () => {
	test('Infinite recursion fails', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'Infinite',
			input: {
				s: 'initial',
			},
		});

		expect(result.error).toBeDefined();
		expect(result.data).toBeUndefined();
	});
});
