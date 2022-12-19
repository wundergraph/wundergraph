import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import fetch from 'node-fetch';
import { createTestServer } from '../.wundergraph/generated/testing';

const wg = createTestServer({ fetch: fetch as any });
beforeAll(() => wg.start());
afterAll(() => wg.stop());

describe('Test OpenAPI', () => {
	test('create a note', async () => {
		const result = await wg.client().mutate({
			operationName: 'NewNote',
			input: {
				text: 'my first note',
			},
		});
		expect(result.error).toBeFalsy();
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
		expect(mutateResult.error).toBeFalsy();
		const id = mutateResult.data?.notes_newNote?.id ?? 0;

		const queryResult = await wg.client().query({
			operationName: 'NoteByID',
			input: {
				id: id,
			},
		});

		expect(queryResult.error).toBeFalsy();
		expect(queryResult.data?.notes_noteByID?.id ?? 0).toBe(id);
		expect(queryResult.data?.notes_noteByID?.text ?? '').toBe(text);
	});
});
