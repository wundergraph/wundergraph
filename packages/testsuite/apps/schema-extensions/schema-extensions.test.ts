import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createSchemaExtensionsTestServer } from './graphql-server';
import { createTestServer } from './.wundergraph/generated/testing';

describe('replaceCustomScalars Tests', () => {
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

	describe('GraphQL Introspection Tests', () => {
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

		test('that custom scalars inputs are replaced and can be selected', async () => {
			const id = '1337';
			const name = 'Heart of the Cards';
			const age = 23;

			const result = await wg.client().mutate({
				operationName: 'CreateFriend',
				input: {
					input: {
						id,
						details: {
							name,
							age,
						},
					},
				},
			});

			expect(result.error).toBeUndefined();
			const friend = result.data?.pocket_createFriend;
			expect(friend).toBeDefined();
			expect(friend).toEqual({
				id,
				details: {
					name,
					age,
				},
			});
		});
	});

	describe('Prisma Introspection Tests', () => {
		test('that custom scalars (including inputs) are replaced and can be selected', async () => {
			const likes = ['cats', 'food'];
			const dislikes = ['blue cheese'];
			const upsertResult = await wg.client().mutate({
				operationName: 'UpsertUser',
				input: {
					id: 99,
					preferences: {
						likes,
						dislikes,
					},
				},
			});

			expect(upsertResult.error).toBeUndefined();
			const upsertedUser = upsertResult.data?.prisma_upsertOneUser;
			expect(upsertedUser).toBeDefined();
			expect(upsertedUser).toEqual({
				id: 1,
				preferences: {
					likes,
					dislikes,
				},
			});

			const getResult = await wg.client().query({
				operationName: 'FindUniqueUser',
				input: {
					id: 1,
				},
			});

			expect(getResult.error).toBeUndefined();
			const user = getResult.data?.prisma_findUniqueUser;
			expect(user).toBeDefined();
			expect(user).toEqual({
				id: 1,
				preferences: {
					likes,
					dislikes,
				},
			});
		});
	});
});
