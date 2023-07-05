import { expectTypeOf, test } from 'vitest';
import { CharactersResponseData, CreateFriendResponseData, JSONObject } from './.wundergraph/generated/models';

test('output types are properly replaced', () => {
	const attributes: CharactersResponseData['pocket_characters'][number]['attributes'] = {};
	expectTypeOf(attributes).toEqualTypeOf<JSONObject>();
});

test('input types are properly replaced', () => {
	const hair: CreateFriendResponseData['pocket_createFriend']['hair'] = {};
	expectTypeOf(hair).toEqualTypeOf<JSONObject>();
});
