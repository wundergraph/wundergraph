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

const operationUrl = (operationPath: string) => {
	return wg.url(`/operations/${operationPath}`);
};

const fetchOperationUrl = (operationPath: string) => {
	return fetch(operationUrl(operationPath));
};

describe('API Cache', () => {
	it('should not have cache headers in handlers without cache', async () => {
		const resp = await fetchOperationUrl('functions/simple');
		expect(resp.status).toBe(200);
		expect(resp.headers.get('cache-control')).toBeNull();
	});

	it('should have cache headers in function handlers with cache', async () => {
		const resp = await fetchOperationUrl('functions/greeting?name=Pepe');
		expect(resp.status).toBe(200);
		const cacheControl = resp.headers.get('cache-control');
		expect(cacheControl).not.toBeNull();
		expect(cacheControl).toMatch(/public/);
		expect(cacheControl).toMatch(/max-age=60/);
		expect(cacheControl).toMatch(/stale-while-revalidate=120/);
	});
});
