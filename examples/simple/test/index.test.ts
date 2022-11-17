import { describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { Server } from '@wundergraph/sdk/testing';

import { createClient } from '../.wundergraph/generated/client';

describe('add', () => {
	const wg = new Server({ fetch: fetch as any });

	test(
		'country by code',
		wg.test(async () => {
			const client = createClient({ customFetch: fetch as any });
			const result = await client.query({
				operationName: 'Countries',
				input: {
					filter: {
						code: { eq: 'AD' },
					},
				},
			});
			const andorra = result.data?.countries_countries[0];
			expect(andorra?.name).toBe('Andorra');
		})
	);

	test(
		'continents',
		wg.test(async () => {
			const client = createClient({ customFetch: fetch as any });
			const result = await client.query({
				operationName: 'Continents',
			});
			expect(result.data?.countries_continents.length).toBe(7);
		})
	);
});
