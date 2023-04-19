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

describe('Webhooks', () => {
	it('Should be able to call the webhook endpoint', async () => {
		const resp = await fetch(wg.url('/webhooks/simple'));
		expect(resp.status).toBe(200);
		expect(resp.headers.get('myresponseheadervar')).toBe('test');
		expect(await resp.json()).toMatchInlineSnapshot(`
			{
			  "myResponseBodyVar": "world",
			}
		`);
	});

	it('Should be able to call the webhook with input', async () => {
		const resp = await fetch(wg.url('/webhooks/simple-with-input'), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				hello: 'hello',
			}),
		});
		expect(resp.status).toBe(200);
		expect(await resp.json()).toMatchInlineSnapshot(`
			{
			  "hello": "hello",
			}
		`);
	});
});
