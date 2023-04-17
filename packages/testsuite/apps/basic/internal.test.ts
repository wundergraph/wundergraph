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

describe('Internal', () => {
	it('internal operation call from function', async () => {
		const client = wg.client();
		const promises = [];
		// Call this 50 times to exercise some code paths that share cached
		// buffers. If we have a race condition in there, the go race detector
		// (which we use in CI) will likely catch it.
		for (let ii = 0; ii < 50; ii++) {
			const op = client.query({
				operationName: 'nested/InternalWrapper',
			});
			promises.push(op);
		}
		const results = await Promise.all(promises);
		for (const result of results) {
			expect(result.error).toBeUndefined();
			expect(result.data?.data?.chinook_findFirstAlbum?.AlbumId).toBe(1);
		}
	});

	it('internal directory operation call from function', async () => {
		const client = wg.client();
		const promises = [];
		// Call this 50 times to exercise some code paths that share cached
		// buffers. If we have a race condition in there, the go race detector
		// (which we use in CI) will likely catch it.
		for (let ii = 0; ii < 50; ii++) {
			const op = client.query({
				operationName: 'nested/InternalDirectoryWrapper',
			});
			promises.push(op);
		}
		const results = await Promise.all(promises);
		for (const result of results) {
			expect(result.error).toBeUndefined();
			expect(result.data?.data?.chinook_findFirstAlbum?.AlbumId).toBe(1);
		}
	});
});
