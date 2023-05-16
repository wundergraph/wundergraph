import { buildSchema, print, OperationTypeNode, GraphQLNamedOutputType } from 'graphql';
import { field, selectionSet, operation, document } from '@timkendall/tql';

import { Executor } from './executor';
import { OperationBuilder } from './operation-builder';

describe('OperationBuilder', () => {
	describe('select', () => {
		it('replaces the selectionSet', () => {
			const schema = buildSchema(`
        type Query {
          foo: Foo
        }

        type Foo {
          id: String
          bar: Boolean
          createdAt: Int
        }
      `);
			const executor: Executor = {
				execute: () => {
					throw new Error();
				},
			};

			const builder = new OperationBuilder({
				schema,
				executor,
				type: schema.getType('Foo')! as GraphQLNamedOutputType,
				rootType: OperationTypeNode.QUERY,
				rootField: 'foo',
				typeSelection: selectionSet([field('id'), field('bar'), field('createdAt')]),
			}).select('id', 'createdAt');

			expect(print(builder.compile()).replace(/\n/g, '')).toContain('{  foo {    id    createdAt  }');
		});
	});

	describe('where', () => {
		it('adds arguments to the selectionSet', () => {
			const schema = buildSchema('type Query { foo(id: ID!): Boolean }');
			const executor: Executor = {
				execute: () => {
					throw new Error();
				},
			};

			const builder = new OperationBuilder({
				schema,
				executor,
				type: schema.getType('Boolean')! as GraphQLNamedOutputType,
				rootType: OperationTypeNode.QUERY,
				rootField: 'foo',
				typeSelection: undefined,
			}).where({ id: 'abc' });

			expect(print(builder.compile()).replace(/\n/g, '')).toContain('query ($id_0: ID!) {  foo(id: $id_0)}');
			expect(builder.variables).toEqual({
				id_0: 'abc',
			});
		});

		it('supports nested arguments', () => {
			const schema = buildSchema(`
        type Query { 
          foo(id: ID!): Foo
        }

        type Foo {
          bars(limit: Int = 10): [Bar!]
        }

        type Bar {
          baz(skip: Boolean): Boolean
        }
      `);
			const executor: Executor = {
				execute: () => {
					throw new Error();
				},
			};

			const builder = new OperationBuilder({
				schema,
				executor,
				rootType: OperationTypeNode.QUERY,
				rootField: 'foo',
				type: schema.getType('Foo') as GraphQLNamedOutputType,
				typeSelection: selectionSet([field('bars', undefined, selectionSet([field('baz')]))]),
			}).where({ id: 'abc', bars: { limit: 10, baz: { skip: true } } });

			expect(print(builder.compile()).replace(/\n/g, '')).toContain(
				'query ($id_0: ID!, $limit_1: Int, $skip_2: Boolean) {  foo(id: $id_0) {    bars(limit: $limit_1) {      baz(skip: $skip_2)    }  }}'
			);
			expect(builder.variables).toEqual({
				id_0: 'abc',
				limit_1: 10,
				skip_2: true,
			});
		});

		it('retains already provided arguments', () => {
			const schema = buildSchema(`
        type Query { 
          foo(a: Boolean!, b: String, c: Int): Boolean
        }
      `);
			const executor: Executor = {
				execute: () => {
					throw new Error();
				},
			};

			const builder = new OperationBuilder({
				schema,
				executor,
				rootType: OperationTypeNode.QUERY,
				rootField: 'foo',
				type: schema.getType('Boolean') as GraphQLNamedOutputType,
				typeSelection: undefined,
			});

			builder.where({ a: true });
			builder.where({ b: 'foo' });
			builder.where({ c: 10 });

			expect(print(builder.compile()).replace(/\n/g, '')).toContain(
				'query ($a_0: Boolean!, $b_1: String, $c_2: Int) {  foo(a: $a_0, b: $b_1, c: $c_2)}'
			);
			expect(builder.variables).toEqual({
				a_0: true,
				b_1: 'foo',
				c_2: 10,
			});
		});
	});

	describe('compile', () => {
		it('returns a DocumentNode', () => {
			const schema = buildSchema('type Query { foo: Boolean }');
			const executor: Executor = {
				execute: () => {
					throw new Error();
				},
			};

			const builder = new OperationBuilder({
				schema,
				executor,
				type: schema.getType('Boolean')! as GraphQLNamedOutputType,
				rootType: OperationTypeNode.QUERY,
				rootField: 'foo',
				typeSelection: undefined,
			});

			// @todo `Field.as` breaks equality checks
			// expect(builder.compile()).toEqual(document([
			//   operation(OperationTypeNode.QUERY, '', selectionSet([ field('foo') ]), [])
			// ]))
			expect(print(builder.compile()).trim().replace(/\n/g, '').replace(new RegExp(' ', 'g'), '')).toMatch('{foo}');
		});
	});
});
