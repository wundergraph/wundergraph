import { OperationsClient } from './operations-client';
import { createServer } from 'http';
import { AddressInfo } from 'net';

describe('Operations Client', () => {
	test('Should be able to make a request with default fetch implementation', (done) => {
		const mock = {
			data: {
				id: '1',
			},
		};

		const server = createServer((req, res) => {
			expect(req.url).toEqual('/operations/Weather');
			res.end(JSON.stringify(mock));
		});

		server.listen(0, async () => {
			const client = new OperationsClient({
				baseURL: `http://localhost:${(server.address() as AddressInfo).port}`,
				clientRequest: {},
			});
			const { data, error } = await client.query({
				operationName: 'Weather',
			});

			expect(data).toEqual(mock.data);
			expect(error).toBeUndefined();

			server.closeAllConnections();

			server.close(done);
		});
	});

	test('Should be able to make a subscription request (web-streams)', (done) => {
		const mock = {
			data: {
				id: '1',
			},
		};

		const server = createServer((req, res) => {
			expect(req.url).toEqual('/operations/Events');
			res.end(JSON.stringify(mock) + '\n\n');
		});

		server.listen(0, async () => {
			const client = new OperationsClient({
				baseURL: `http://localhost:${(server.address() as AddressInfo).port}`,
				clientRequest: {},
			});
			const updates = await client.subscribe({
				operationName: 'Events',
			});

			for await (const { data, error } of updates) {
				expect(data).toEqual(mock.data);
				expect(error).toBeUndefined();
			}

			server.closeAllConnections();

			server.close(done);
		});
	});
});
