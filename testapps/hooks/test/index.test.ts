import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer();

beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('test recursive operation calls hooks', () => {
	// test('valid token', async () => {
	// 	const client = wg.client();
	// 	const result = await client.query({
	// 		operationName: 'RecursiveContinents',
	// 	});
	// 	console.log(result);
	// });
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
	test('mutatingPreResolve is called', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'PreResolveChain',
			input: {
				s: 'initial',
			},
		});
	});
});
