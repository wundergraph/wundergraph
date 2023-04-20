import { print } from 'graphql';
import { field, selectionSet } from '@timkendall/tql';

import { toSelectionSet } from './paths';

describe('paths', () => {
	describe('toSelectionSet', () => {
		it('maps to a SelectionSet', () => {
			const actual = toSelectionSet([['foo', 'bar', 'baz']]);
			const expected = selectionSet([
				field('foo', undefined, selectionSet([field('bar', undefined, selectionSet([field('baz')]))])),
			]);

			expect(print(actual)).toEqual(print(expected));
		});
	});
});
