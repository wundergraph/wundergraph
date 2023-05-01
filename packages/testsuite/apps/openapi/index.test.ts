import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createTestServer } from './.wundergraph/generated/testing';
import { createOpenAPITestServer } from './testserver';
import { ResponseError } from '@wundergraph/sdk/client';

const wg = createTestServer({
	dir: __dirname,
});

beforeAll(async () => {
	createOpenAPITestServer(8091);
	await wg.start();
});

afterAll(() => wg.stop());

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
	expect(error.http?.statusCode).toBe(statusCode);
	expect(error.http?.text).toBe(`you wanted a ${statusCode}`);
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
	expect(error.http?.statusCode).toBe(statusCode);
	expect(error.http?.text).toBe(`you wanted a ${statusCode}`);
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

		const queryResult = await wg.client().query({
			operationName: 'NoteByID',
			input: {
				id: id,
			},
		});

		expect(queryResult.error).toBeUndefined();
		expect(queryResult.data?.notes_noteByID?.id ?? 0).toBe(id);
		expect(queryResult.data?.notes_noteByID?.text ?? '').toBe(text);
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
		expect(error.http?.statusCode).toBe(404);
		expect(error.http?.text).toBe(`noteID ${id} not found`);
		expect(error.http?.headers?.['x-note-id']).toBe(id.toString());
	});

	test('handle declared 400', async () => await expectHttpStatusCodeInQuery(400));
	test('handle declared 500', async () => await expectHttpStatusCodeInQuery(500));

	test('handle undeclared 400', async () => await expectHttpStatusCodeInMutation(400));
	test('handle undeclared 404', async () => await expectHttpStatusCodeInMutation(404));
	test('handle undeclared 500', async () => await expectHttpStatusCodeInMutation(500));
});
