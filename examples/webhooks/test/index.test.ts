import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });

beforeAll(() => wg.start());

afterAll(() => wg.stop());

describe('test webhooks', () => {
	test('GitHub webhook', async () => {
		const url = `${wg.createClientConfig().baseURL ?? ''}/webhooks/github`;
		const resp = await fetch(url);
		const data = await resp.json();
		expect(data.hello).toBe('github');
	});
});
