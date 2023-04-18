import { beforeAll, describe, expect, it } from 'vitest';
import { createTestServer } from './.wundergraph/generated/testing';

const wg = createTestServer({
	dir: __dirname,
});

beforeAll(async () => {
	await wg.start();

	return async () => {
		await wg.stop();
	};
});

describe('test recursive operation calls hooks', () => {
	it('rescursive call', async () => {
		const client = wg.client();
		const directResult = await client.query({
			operationName: 'Continents',
		});
		const recursiveResult = await client.query({
			operationName: 'RecursiveContinents',
		});

		expect(directResult.error).toBe(undefined);
		expect(recursiveResult.error).toBe(undefined);

		// RecursiveContinents should end up calling Continents' mockResolve hook
		const directData = directResult.data!.countries_continents;
		const recursiveData = recursiveResult.data!.countries_continents;
		expect(directData.length).toBe(recursiveData.length);
		expect(directData[0].code).toBe(recursiveData[0].code);
		expect(directData[0].name).toBe(recursiveData[0].name);
	});
});

describe('preResolve chain', () => {
	it('preResolve failure is reported', async () => {
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

	it('mutatingPreResolve failure is reported', async () => {
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

	it('customResolve failure is reported', async () => {
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

	it('customResolve', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'CustomResolve',
			input: {
				s: 'initial',
			},
		});
		expect(result?.data?.echo_string).toBe('customResolved');
	});

	it('customResolve skip', async () => {
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

	it('mutatingPreResolve with mockResolve is called', async () => {
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
	it('mutatingPostResolve', async () => {
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
	it('Infinite recursion fails', async () => {
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
