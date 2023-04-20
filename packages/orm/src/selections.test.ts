import {
	GraphQLString,
	GraphQLInt,
	GraphQLFloat,
	GraphQLEnumType,
	GraphQLObjectType,
	GraphQLInterfaceType,
	GraphQLUnionType,
} from 'graphql';

import { allScalars } from './selections';

describe('selections', () => {
	describe('allScalars', () => {
		it('returns a selectionSet', () => {
			// @todo add GraphQLNullable and GraphQLList types
			const object = new GraphQLObjectType({
				name: 'Foo',
				fields: {
					string: { type: GraphQLString },
					int: { type: GraphQLInt },
					float: { type: GraphQLFloat },
					enum: { type: new GraphQLEnumType({ name: 'enumA', values: { A: { value: 'A' } } }) },
					object: { type: new GraphQLObjectType({ name: 'bar', fields: {} }) },
					interface: { type: new GraphQLInterfaceType({ name: 'interfaceA', fields: {} }) },
					union: {
						type: new GraphQLUnionType({
							name: 'unionA',
							types: () => [new GraphQLObjectType({ name: 'foo', fields: {} })],
						}),
					},
				},
			});

			const selectionSet = allScalars(object);
			expect(selectionSet.selections.length).toBe(3);
		});
	});
});
