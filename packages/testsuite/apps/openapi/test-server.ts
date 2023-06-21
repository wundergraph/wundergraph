import fastify from 'fastify';

const notes: Record<number, string> = {};

export const createOpenAPITestServer = (port: number) => {
	const server = fastify({
		logger: true,
	});

	server.post<{ Body: string }>('/notes/new', async (request, reply) => {
		const text = JSON.parse(request.body);
		if ((text?.length ?? 0) == 0) {
			reply.code(400).send('text cannot be empty');
			return;
		}
		const giveMePrefix = 'giveme:';
		if (text.startsWith(giveMePrefix)) {
			const status = parseInt(text.substring(giveMePrefix.length), 10);
			reply.code(status).send(`you wanted a ${status}`);
			return;
		}
		const ids = Object.keys(notes).map((v) => parseInt(v, 10));
		const maxID = ids?.length ? Math.max(...ids) : 0;
		const nextID = maxID + 1;
		notes[nextID] = text;
		reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send({ id: nextID });
	});

	server.get<{ Params: { noteID: string } }>('/notes/note/:noteID', async (request, reply) => {
		const id = parseInt(request.params.noteID, 10);
		if (isNaN(id)) {
			reply.code(400).send('noteID is not an integer');
			return;
		}
		reply.header('x-note-id', id);
		if (id > 1000) {
			reply.code(id - 1000).send(`you wanted a ${id - 1000}`);
			return;
		}
		const text = notes[id];
		if (text === undefined) {
			reply.code(404).send(`noteID ${id} not found`);
			return;
		}
		reply.code(200).header('content-type', 'application/json; charset=utf-8').send({ id, text });
	});

	server.listen({ port: port }, (err, address) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		console.log(`OpenAPI server listening at ${address}`);
	});

	return server;
};

if (require.main === module) {
	createOpenAPITestServer(8090);
}
