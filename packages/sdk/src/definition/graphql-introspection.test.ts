import { introspect } from './index';
import { MockServer } from 'jest-mock-server';
import fetch from 'node-fetch';
import { getIntrospectionQuery } from 'graphql/index';

describe('Testing node-fetch HTTP client', () => {
	const accounts = new MockServer();
	const reviews = new MockServer();
	const products = new MockServer();
	const inventory = new MockServer();

	beforeAll(() => {
		accounts.start();
		reviews.start();
		products.start();
		inventory.start();
	});
	afterAll(() => {
		accounts.stop();
		reviews.stop();
		products.stop();
		inventory.stop();
	});
	beforeEach(() => {
		accounts.reset();
		reviews.reset();
		products.reset();
		inventory.reset();
	});

	const introspectionRequestBody = JSON.stringify({
		query: getIntrospectionQuery(),
		operationName: 'IntrospectionQuery',
	});

	it('Receives a status over the network', async () => {
		const route = accounts
			.get('/')
			// Look ma, plain Jest API!
			.mockImplementationOnce((ctx) => {
				// ...and plain Koa API
				ctx.status = 200;
				fetch('http://localhost:4001/graphql', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: introspectionRequestBody,
				});
			});

		// Since we did not passed any port into server constructor, server was started at random free port
		const url = accounts.getURL();

		const federatedApi = await introspect.federation({
			apiNamespace: 'federated',
			upstreams: [
				{
					// accounts
					url: 'http://localhost:4001/graphql',
				},
				{
					// reviews
					url: 'http://localhost:4002/graphql',
				},
				{
					// products
					url: 'http://localhost:4003/graphql',
				},
				{
					// inventory
					url: 'http://localhost:4004/graphql',
				},
			],
			introspection: {
				disableCache: true,
			},
		});
	});
});

/*test('federation introspection',async ()=>{
	const federatedApi = await introspect.federation({
		apiNamespace: 'federated',
		upstreams: [
			{
				url: 'http://localhost:4001/graphql',
			},
			{
				url: 'http://localhost:4002/graphql',
			},
			{
				url: 'http://localhost:4003/graphql',
			},
			{
				url: 'http://localhost:4004/graphql',
			},
		],
		introspection: {
			disableCache: true,
		}
	});

	expect(federatedApi).toMatchSnapshot();
});*/
