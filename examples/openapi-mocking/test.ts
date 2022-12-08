import test from 'ava';

import { WunderGraphTestServer } from './.wundergraph/generated/testing';

const wg = new WunderGraphTestServer();

test.before(async (t) => {
	await wg.start();
});

test.after(async (t) => {
	await wg.stop();
});

test('create a note', async (t) => {
	const result = await wg.client().mutate({
		operationName: 'NewNote',
		input: {
			text: 'my first note',
		},
	});
	t.falsy(result.error);
	t.not(result.data?.notes_newNote?.id ?? 0, 0, 'new note id should not be zero');
});

test('create a note, read it back', async (t) => {
	const text = 'not my first note anymore';
	const mutateResult = await wg.client().mutate({
		operationName: 'NewNote',
		input: {
			text: text,
		},
	});
	t.falsy(mutateResult.error);
	const id = mutateResult.data?.notes_newNote?.id ?? 0;

	const queryResult = await wg.client().query({
		operationName: 'NoteByID',
		input: {
			id: id,
		},
	});

	t.falsy(queryResult.error);
	t.is(queryResult.data?.notes_noteByID?.id ?? 0, id);
	t.is(queryResult.data?.notes_noteByID?.text ?? '', text);
});
