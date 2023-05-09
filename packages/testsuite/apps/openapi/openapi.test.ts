import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createTestServer } from './.wundergraph/generated/testing';
import { createOpenAPITestServer } from './test-server';
import { ResponseError, getHttpResponseError } from '@wundergraph/sdk/client';

const wg = createTestServer({
	dir: __dirname,
});

beforeAll(async () => {
	createOpenAPITestServer(8090);
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
});
