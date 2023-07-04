import { expectTypeOf, test } from 'vitest';
import { CharactersResponseData, CreateFriendResponseData, JSONValue } from './.wundergraph/generated/models';

test('output types are properly replaced', () => {
	const attributes: Required<CharactersResponseData['pocket_characters'][number]>['attributes'] = {};
	expectTypeOf(attributes).toEqualTypeOf<JSONValue>;
});

test('input types are properly replaced', () => {
	const hair: Required<CreateFriendResponseData['pocket_createFriend']>['hair'] = {};
	expectTypeOf(hair).toEqualTypeOf<JSONValue>;
});
