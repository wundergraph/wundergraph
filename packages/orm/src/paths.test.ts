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

		it('handles multiple nested', () => {
			const actual = toSelectionSet([
				['id'],
				['status'],
				['dragon'],
				['dragon', 'diamater', 'feet'],
				['dragon', 'diamater', 'meters'],
			]);
			const expected = selectionSet([
				field('id'),
				field('status'),
				field(
					'dragon',
					undefined,
					selectionSet([field('diamater', undefined, selectionSet([field('feet'), field('meters')]))])
				),
			]);

			expect(print(actual)).toEqual(print(expected));
		});
	});
});
