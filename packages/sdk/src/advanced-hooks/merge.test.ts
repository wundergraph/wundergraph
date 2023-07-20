import { mergeGraphQLData } from './merge';

describe('GraphQL merging', () => {
	it('should merge arrays', () => {
		const a = 'a';
		const b = 'b';
		const c = 'c';

		const merged = mergeGraphQLData([{ r: [a] }, { r: [b] }, { r: [c] }]);
		expect(merged).toStrictEqual({ r: [a, b, c] });
	});

	it('should group arrays of objects by key', () => {
		const id = 'id';
		const id1 = 'id1';
		const id2 = 'id2';
		const g11 = 'g11';
		const g12 = 'g12';
		const g21 = 'g21';
		const g22 = 'g22';
		const a = 'a';
		const b = 'b';
		const c = 'c';

		const merged = mergeGraphQLData(
			[
				{
					not_a_group: [a],
					groups: { id: id1, elements: [g11] },
				},
				{
					not_a_group: [b],
					groups: { id: id1, elements: [g12] },
				},
				{
					not_a_group: [c],
					groups: { id: id2, elements: [g21, g22] },
				},
			],
			{ groupBy: id }
		);
		expect(merged).toStrictEqual({
			not_a_group: [a, b, c],
			groups: [
				{ id: id1, elements: [g11, g12] },
				{ id: id2, elements: [g21, g22] },
			],
		});
	});
});
