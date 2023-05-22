import crypto from 'crypto';

import { beforeAll, describe, expect, it } from 'vitest';
import { createTestServer } from './.wundergraph/generated/testing';

const WEBHOOK_SECRET = 'hunter2';

const wg = createTestServer({
	dir: __dirname,
	env: {
		WEBHOOK_SECRET: WEBHOOK_SECRET,
	},
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

	it('Should be able to call the webhook with a verifier', async () => {
		const body = 'hello';
		const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
		const resp = await fetch(wg.url('/webhooks/verified'), {
			method: 'POST',
			body,
			headers: {
				'X-Signature': signature,
			},
		});
		expect(resp.status).toBe(200);
		expect(await resp.json()).toStrictEqual({ hello: 'world' });
	});

	it('Should not be able to call the webhook with a verifier without a signature', async () => {
		const resp = await fetch(wg.url('/webhooks/verified'));
		expect(resp.status).toBe(401);
	});

	it('Should not be able to call the webhook with a verifier with a wrong signature', async () => {
		const body = 'hello';
		// Miscalculate the signature
		const signedBody = body + body;
		const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(signedBody).digest('hex');
		const resp = await fetch(wg.url('/webhooks/verified'), {
			method: 'POST',
			body,
			headers: {
				'X-Signature': signature,
			},
		});
		expect(resp.status).toBe(401);
	});
});
