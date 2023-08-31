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

describe('Live queries', () => {
	it('should respect interval', async () => {
		// Reset the call counter
		await wg.client().query({ operationName: 'functions/trigger-livequery-bug', input: { reset: true } });
		// Now start a live query, which shouldn't send more the one call per second
		const abortController = new AbortController();
		fetch(wg.url('/operations/functions/trigger-livequery-bug?wg_live'), { signal: abortController.signal });
		// Sleep for 1.1 seconds
		await new Promise((resolve) => setTimeout(resolve, 1100));
		abortController.abort();
		// Now check the call counter
		const result = await wg
			.client()
			.query({ operationName: 'functions/trigger-livequery-bug', input: { output: true } });
		// reset + 1 live query trigger + call to retrieve output = 3
		expect(parseInt(result.data!, 10)).toBe(3);
	});
});
