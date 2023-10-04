import path from 'path';
import fs from 'fs/promises';

import fastify from 'fastify';

export const createOpenApiSpecServer = (port: number) => {
	const server = fastify({
		logger: true,
	});

	server.get('/api.yaml', async (request, reply) => {
		if (request.headers['x-foo'] !== 'Bar') {
			throw new Error(`missing expected header X-Foo: Bar`);
		}
		reply.header('Content-Type', 'text/plain');
		const filePath = path.join(__dirname, '.wundergraph', 'api.yaml');
		const data = await fs.readFile(filePath, 'utf-8');
		reply.send(data);
	});

	server.listen({ port: port }, (err, address) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(`OpenAPI Spec server listening at ${address}`);
	});

	return server;
};

if (require.main === module) {
	createOpenApiSpecServer(8091);
}
