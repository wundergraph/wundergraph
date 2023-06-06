import { GraphQLClient, gql } from 'graphql-request';
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

describe('GraphQL endpoint', () => {
	it('Should be able to call API from GraphQL endpoint', async () => {
		const client = new GraphQLClient(wg.graphqlEndpoint());
		const query = gql`
			{
				countries_country(code: "ES") {
					code
					name
					capital
				}
			}
		`;

		const data = (await client.request(query)) as any;
		expect(data?.countries_country?.name).toBe('Spain');
	});

	it('Should be able to call embedded GraphQL server from GraphQL endpoint', async () => {
		const client = new GraphQLClient(wg.graphqlEndpoint());
		const query = gql`
			{
				embedded_fromCustomContext
			}
		`;
		const data = (await client.request(query)) as any;
		expect(data?.embedded_fromCustomContext).toBe('world');
	});

	it('Should be able to prepare requests in parallel', async () => {
		const requests: Promise<unknown>[] = [];
		for (let ii = 0; ii < 100; ii++) {
			const client = new GraphQLClient(wg.graphqlEndpoint());
			const query = gql`
				{
					weather_getCityByName(name: "Madrid") {
						id
						name
					}
				}
			`;
			requests.push(client.request(query));
		}
		const resolved = await Promise.all(requests);
		for (const value of resolved) {
			const city = (value as any).weather_getCityByName;
			expect(city.id).toBe('3117735');
			expect(city.name).toBe('Madrid');
		}
	});
});
