import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createTestServer } from './.wundergraph/generated/testing';
import { createOpenAPITestServer } from './test-server';
import { getHttpResponseError, ResponseError } from '@wundergraph/sdk/client';

const httpServer = createOpenAPITestServer(8090);
const wg = createTestServer({
	dir: __dirname,
});

beforeAll(async () => {
	await wg.start();
});

afterAll(async () => {
	await httpServer.close();
	await wg.stop();
});

const expectHttpStatusCodeInQuery = async (statusCode: number) => {
	const result = await wg.client().query({
		operationName: 'NoteByID',
		input: {
			id: 1000 + statusCode,
		},
	});

	expect(result.error).toBeDefined();
	expect(result.error).toBeInstanceOf(ResponseError);
	const error = result.error! as ResponseError;
	const httpError = getHttpResponseError(error);
	expect(httpError).toBeDefined();
	expect(httpError?.statusCode).toBe(statusCode);
	expect(httpError?.text).toBe(`you wanted a ${statusCode}`);
};

const expectHttpStatusCodeInMutation = async (statusCode: number) => {
	const result = await wg.client().mutate({
		operationName: 'NewNote',
		input: {
			text: `giveme:${statusCode}`,
		},
	});

	expect(result.error).toBeDefined();
	expect(result.error).toBeInstanceOf(ResponseError);
	const error = result.error! as ResponseError;
	const httpError = getHttpResponseError(error);
	expect(httpError).toBeDefined();
	expect(httpError?.statusCode).toBe(statusCode);
	expect(httpError?.text).toBe(`you wanted a ${statusCode}`);
};

describe('Test correct responses', () => {
	test('create a note', async () => {
		const result = await wg.client().mutate({
			operationName: 'NewNote',
			input: {
				text: 'my first note',
			},
		});
		expect(result.error).toBeUndefined();
		expect(result.data?.notes_newNote?.id ?? 0).not.toBe(0);
	});

	test('create a note, read it back', async () => {
		const text = 'not my first note anymore';
		const mutateResult = await wg.client().mutate({
			operationName: 'NewNote',
			input: {
				text: text,
			},
		});
		expect(mutateResult.error).toBeUndefined();
		const id = mutateResult.data?.notes_newNote?.id ?? 0;

		const byNumberResult = await wg.client().query({
			operationName: 'NoteByID',
			input: {
				id: id,
			},
		});

		const jsonData = [
			{ id: 1, name: 'data1', date: 10823 },
			{ id: 2, name: 'data2', date: 10823 },
		];

		expect(byNumberResult.error).toBeUndefined();
		const note = byNumberResult.data?.notes_noteByID;
		expect(note).toBeDefined();
		expect(note!.id ?? 0).toBe(id);
		expect(note!.text ?? '').toBe(text);
		expect(note!.jsonData ?? '').toStrictEqual(jsonData);

		const byString = await wg.client().query({
			operationName: 'NoteByID',
			input: {
				id: id.toString(),
			},
		});

		expect(byString.error).toBeUndefined();
		expect(byString.data?.notes_noteByID?.id ?? 0).toBe(id);
		expect(byString.data?.notes_noteByID?.text ?? '').toBe(text);
	});
});

describe('Test subscriptions', () => {
	// This test checks all notes, so it needs a dedicated server
	const httpServer = createOpenAPITestServer(8091);
	const wg = createTestServer({
		dir: __dirname,
		env: {
			OPENAPI_URL: 'http://localhost:8091',
		},
	});

	beforeAll(async () => {
		await wg.start();
	});

	afterAll(async () => {
		await httpServer.close();
		await wg.stop();
	});
	test('subscription with tail deletion via jsonpatch', async () => {
		const client = wg.client();
		// Create 100 notes, to ensure the payload is bigger than
		// the patch
		const n = 100;
		const ids: (string | number)[] = [];
		for (let ii = 0; ii < n; ii++) {
			const result = await client.mutate({
				operationName: 'NewNote',
				input: {
					text: ii.toString(),
				},
			});
			expect(result.error).toBeUndefined();
			ids.push(result.data!.notes_newNote!.id!);
		}

		// Count the current notes
		const result = await client.query({ operationName: 'AllNotes' });
		expect(result.error).toBeUndefined();
		expect(result.data?.notes_all?.length).toBeGreaterThanOrEqual(n);

		// Now start the live query
		let expectedNotesLength = result.data!.notes_all!.length;
		const abort = new AbortController();
		let triggers = 0;
		const query = client.subscribe(
			{ operationName: 'AllNotes', liveQuery: true, abortSignal: abort.signal },
			(resp) => {
				expect(resp.data?.notes_all?.length).toBe(expectedNotesLength);
				triggers++;
			}
		);
		// Await for the initial trigger
		await new Promise((r) => setTimeout(r, 2000));
		// Now delete the last note
		expect(triggers).toBe(1);
		expectedNotesLength -= 1;
		await client.mutate({ operationName: 'DeleteNote', input: { id: ids[ids.length - 1] } });
		// Wait for the live query to trigger again (minimum interval is 1s, which is what we set in the config)
		await new Promise((r) => setTimeout(r, 2000));
		expect(triggers).toBe(2);
		abort.abort();
		const last = await query;
		if (last) {
			expect(last?.data?.notes_all?.length).toBe(expectedNotesLength);
		}
	});
});

describe('Test error responses', () => {
	test('handle 404 in query', async () => {
		const id = 42;
		const result = await wg.client().query({
			operationName: 'NoteByID',
			input: {
				id,
			},
		});

		expect(result.error).toBeDefined();
		expect(result.error).toBeInstanceOf(ResponseError);
		const error = result.error! as ResponseError;
		const httpError = getHttpResponseError(error);
		expect(httpError).toBeDefined();
		expect(httpError?.statusCode).toBe(404);
		expect(httpError?.text).toBe(`noteID ${id} not found`);
		expect(httpError?.headers?.['x-note-id']).toBe(id.toString());
	});

	test('handle declared 400', async () => await expectHttpStatusCodeInQuery(400));
	test('handle declared 500', async () => await expectHttpStatusCodeInQuery(500));

	test('handle undeclared 400', async () => await expectHttpStatusCodeInMutation(400));
	test('handle undeclared 404', async () => await expectHttpStatusCodeInMutation(404));
	test('handle undeclared 500', async () => await expectHttpStatusCodeInMutation(500));

	test('return timeout as 504', async () => {
		const wg = createTestServer({
			dir: __dirname,
			env: {
				// This timeouts instead of failing to connect
				OPENAPI_URL: 'http://1.2.3.4:8080',
			},
		});
		await wg.start();

		const result = await wg.client().query({
			operationName: 'NoteByID',
			input: {
				id: 1,
			},
		});

		expect(result.error).toBeDefined();
		expect(result.error?.statusCode).toBe(504);

		await wg.stop();
	});

	test('that root field response types can be replaced and selected on successfully', async () => {
		const numberToShow = 2;
		const result = await wg.client().query({
			operationName: 'Reminders',
			input: {
				numberToShow,
			},
		});

		expect(result.error).toBeUndefined();
		const responseJson = result.data.notes_reminders;
		expect(responseJson).toHaveLength(numberToShow);
		expect(responseJson).toStrictEqual([
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
		]);
	});
});
