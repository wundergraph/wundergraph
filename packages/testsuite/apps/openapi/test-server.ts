import fastify from 'fastify';

export const createOpenAPITestServer = (port: number) => {
	const notes: Record<number, string> = {};
	const server = fastify({
		logger: true,
	});

	server.get<{ Params: { numberToShow: number } }>('/notes/reminders/:numberToShow', async (request, reply) => {
		const remindersToShow = request.params.numberToShow;
		const reminders = [
			{
				id: 1,
				date: 20823,
				time: 9000,
				what: 'Haircut appointment',
			},
			{
				id: 2,
				date: 251223,
				time: 1300,
				what: 'Christmas Day Dinner',
			},
			{
				id: 3,
				date: 311299,
				time: 2359,
				what: 'Retirement starts',
			},
		];
		const maxNumber = reminders.length;
		if (remindersToShow < 1 || remindersToShow > maxNumber) {
			reply.code(400).send(`Please enter a number between 1 and ${maxNumber}`);
			return;
		}
		const slicedReminders = reminders.slice(0, remindersToShow);
		reply.code(200).header('content-type', 'application/json; charset=utf-8').send([slicedReminders]);
	});

	server.post<{ Body: string }>('/notes/new', async (request, reply) => {
		let text: string;
		try {
			text = JSON.parse(request.body);
		} catch {
			text = request.body;
		}
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
		const jsonData = [
			{
				id: 1,
				name: 'data1',
				date: 10823,
			},
			{
				id: 2,
				name: 'data2',
				date: 10823,
			},
		];
		reply.code(200).header('content-type', 'application/json; charset=utf-8').send({ id, text, jsonData });
	});

	server.delete<{ Params: { noteID: string } }>('/notes/note/:noteID', async (request, reply) => {
		const id = parseInt(request.params.noteID, 10);
		if (isNaN(id)) {
			reply.code(400).send('noteID is not an integer');
			return;
		}
		reply.header('x-note-id', id);
		if (notes[id] === undefined) {
			reply.code(404).send(`noteID ${id} not found`);
			return;
		}
		delete notes[id];
		reply.code(204);
	});

	server.get('/notes/all', async (request, reply) => {
		const ids = Object.keys(notes).map((id) => parseInt(id, 10));
		const response: { id: number; text: string }[] = [];
		for (const id of ids) {
			response.push({
				id,
				text: notes[id],
			});
		}
		reply.code(200).header('content-type', 'application/json; charset=utf-8').send(response);
	});

	server.get('/time', async (request, reply) => {
		const now = new Date();
		const response = {
			hours: now.getHours(),
			minutes: now.getMinutes(),
			seconds: now.getSeconds(),
		};
		reply.code(200).header('content-type', 'application/json; charset=utf-8').send(response);
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
