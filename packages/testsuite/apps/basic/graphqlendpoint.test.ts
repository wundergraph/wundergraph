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
});
