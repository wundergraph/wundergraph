import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createGraphQLTestServers } from './servers';
import { createTestServer } from './.wundergraph/generated/testing';

const graphQLServers = createGraphQLTestServers();
const wg = createTestServer({
	dir: __dirname,
});

beforeAll(async () => {
	await Promise.all(graphQLServers.map((s) => s.start()));
	await wg.start();
});

afterAll(async () => {
	await wg.stop();
	await Promise.all(graphQLServers.map((s) => s.stop()));
});

describe('test dynamic router', () => {
	const alice = `hello I'm Alice`;
	const bob = `hello I'm Bob`;
	const mallory = `hello I'm Mallory`;
	test('direct queries to origin', async () => {
		const client = wg.client();
		expect((await client.query({ operationName: 'Hello1' })).data?.origin1_hello).toStrictEqual([alice]);
		expect((await client.query({ operationName: 'Hello2' })).data?.origin2_hello).toStrictEqual([bob]);
		expect((await client.query({ operationName: 'Hello3' })).data?.origin3_hello).toStrictEqual([mallory]);
	});
	test('query all origins at the same time', async () => {
		const client = wg.client();
		const result = await client.query({ operationName: 'HelloAll' });
		expect(result.data?.hello).toStrictEqual([alice, bob, mallory]);
	});
});
