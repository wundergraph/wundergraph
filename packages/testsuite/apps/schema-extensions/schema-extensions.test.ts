import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createSchemaExtensionsTestServer } from './graphql-server';
import { createTestServer } from './.wundergraph/generated/testing';

describe('replaceCustomScalars E2E Tests', () => {
	const yogaServer = createSchemaExtensionsTestServer(4000);
	const wg = createTestServer({
		dir: __dirname,
	});

	beforeAll(async () => {
		await yogaServer.start();
		await wg.start();
	});

	afterAll(() => {
		yogaServer.stop();
		wg.stop();
	});

	test('that custom scalars are replaced and can be selected', async () => {
		const result = await wg.client().query({
			operationName: 'Characters',
		});

		expect(result.error).toBeUndefined();
		const characters = result.data?.pocket_characters;
		expect(characters).toBeDefined();
		expect(characters).toEqual([
			{
				badgeNumber: 1,
				details: {
					name: 'Brock',
					age: 15,
				},
				teamData: {
					highestLevel: 12,
					typeSpeciality: 'rock',
				},
			},
			{
				starter: 'water',
				details: {
					name: 'Gary',
					age: 10,
				},
				teamData: {
					highestLevel: 65,
					typeSpeciality: 'N/A',
				},
			},
			{
				details: {
					name: 'Professor Oak',
					age: 50,
				},
			},
		]);
	});
});
