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
	test('it works', async () => {
		const client = wg.client();
		expect((await client.query({ operationName: 'HelloS1' })).data?.s1_hello).toStrictEqual([`hello I'm 1`]);
		expect((await client.query({ operationName: 'HelloS2' })).data?.s2_hello).toStrictEqual([`hello I'm 2`]);
		expect((await client.query({ operationName: 'HelloS3' })).data?.s3_hello).toStrictEqual([`hello I'm 3`]);
	});
});
