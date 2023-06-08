import {
	GraphQLString,
	GraphQLInt,
	GraphQLFloat,
	GraphQLEnumType,
	GraphQLObjectType,
	GraphQLInterfaceType,
	GraphQLUnionType,
	buildSchema,
	print,
} from 'graphql';
import { field, selectionSet } from '@timkendall/tql';
import { allScalars, expandSelection } from './selections';

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

	describe.skip('expandSelection', () => {
		// @question what should the behavior be here?
		it('expands selections on object fields', () => {
			const schema = buildSchema(`
				type Query {
					foo: Foo
				}

				type Foo {
					id: ID!
					bar: Bar
				}

				type Bar {
					id: ID!
					a: String
					b: Int
					nested: Nested
				}

				type Nested {
					nestedA: String
					nestedB: Int
				}
			`);

			const type = schema.getType('Foo') as unknown as GraphQLObjectType;
			const original = selectionSet([
				field('id'),
				field('bar'),
				field(
					'bar',
					undefined,
					selectionSet([field('nested', undefined, selectionSet([field('nestedA'), field('nestedB')]))])
				),
			]);
			const expanded = expandSelection(schema, type, original);
		});
	});
});
