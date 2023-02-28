import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer();

// TODO: Remove this once the secret refactor is done
process.env['WG_SECURE_COOKIE_HASH_KEY'] = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env['WG_SECURE_COOKIE_BLOCK_KEY'] = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env['WG_CSRF_TOKEN_SECRET'] = 'aaaaaaaaaaa';

beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('functions', () => {
	test('internal operation call from  function', async () => {
		const client = wg.client();
		const result = await client.query({
			operationName: 'nested/InternalWrapper',
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.data?.chinook_findFirstAlbum?.AlbumId).toBe(1);
	});
});
