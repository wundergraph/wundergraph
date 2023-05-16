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

const fetchOperationUrl = (operationPath: string, init?: RequestInit) => {
	return fetch(operationUrl(operationPath), init);
};

describe('API Cache', () => {
	it('should have default cache headers in handlers without cache configuration', async () => {
		const resp = await fetchOperationUrl('functions/simple');
		expect(resp.status).toBe(200);
		expect(resp.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
	});

	it('should disable cache headers when explicitly disabled', async () => {
		const resp = await fetchOperationUrl('functions/user');
		expect(resp.status).toBe(200);
		expect(resp.headers.get('cache-control')).toBeNull();
	});

	it('should have mark response as private when request is authenticated', async () => {
		const resp = await fetchOperationUrl('functions/simple', { headers: { Authorization: 'Bearer Token' } });
		expect(resp.status).toBe(200);
		expect(resp.headers.get('cache-control')).toBe('private, max-age=0, must-revalidate');
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

	it('should override default headers with handler', async () => {
		const resp = await fetchOperationUrl('CountryByFilter');
		expect(resp.status).toBe(200);
		const cacheControl = resp.headers.get('cache-control');
		expect(cacheControl).not.toBeNull();
		expect(cacheControl).toMatch(/public/);
		expect(cacheControl).toMatch(/max-age=0/);
		expect(cacheControl).toMatch(/stale-while-revalidate=0/);
		expect(cacheControl).not.toMatch(/must-revalidate/);
	});

	it('should allow omitting some cache header values', async () => {
		const resp = await fetchOperationUrl('with-hyphen/country-code-with-hyphen');
		expect(resp.status).toBe(200);
		const cacheControl = resp.headers.get('cache-control');
		expect(cacheControl).not.toBeNull();
		expect(cacheControl).toMatch(/public/);
		expect(cacheControl).toMatch(/max-age=0/);
		expect(cacheControl).not.toMatch(/stale-while-revalidate/);
		expect(cacheControl).toMatch(/must-revalidate/);
	});
});
