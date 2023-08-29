import path from 'path';

import execa from 'execa';
import { beforeAll, expect, describe, it } from 'vitest';

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

describe('Subscriptions', () => {
	it('should run a subscription to the end', async () => {
		const client = wg.client();
		const items: { hello: string }[] = [];
		await client.subscribe({ operationName: 'subscriptions/counter', input: { count: 3, delay: 10 } }, (item) => {
			items.push(item.data!);
		});
		expect(items).toStrictEqual([{ hello: '0' }, { hello: '1' }, { hello: '2' }]);
	});

	it('should receive duplicates on subscriptions', async () => {
		const client = wg.client();
		const items: { hello: string }[] = [];
		await client.subscribe(
			{ operationName: 'subscriptions/counter', input: { count: 10, delay: 0, repeat: true } },
			(item) => {
				items.push(item.data!);
			}
		);
		expect(items).toStrictEqual(Array(10).fill({ hello: 'hello' }));
	});

	it('should omit duplicates with deduplication', async () => {
		const wg = createTestServer({
			dir: __dirname,
			fetch: (url, info: any) => {
				if (typeof url == 'string' && url.includes('/operations/')) {
					url += '&wg_deduplicate';
				}
				return fetch(url, info);
			},
		});

		await wg.start();

		const items: { hello: string }[] = [];
		await wg
			.client()
			.subscribe({ operationName: 'subscriptions/counter', input: { count: 5, delay: 50, repeat: true } }, (item) => {
				items.push(item.data!);
			});
		expect(items).toStrictEqual(Array(1).fill({ hello: 'hello' }));
		await wg.stop();
	});

	it('should ignore pings from the server', async () => {
		const items: { hello: string }[] = [];
		// XXX: The delay should be higher than the server ping time configured in wundergraph.config.ts
		await wg.client().subscribe({ operationName: 'subscriptions/counter', input: { count: 2, delay: 300 } }, (item) => {
			items.push(item.data!);
		});
		expect(items).toStrictEqual([{ hello: '0' }, { hello: '1' }]);
	});
});
