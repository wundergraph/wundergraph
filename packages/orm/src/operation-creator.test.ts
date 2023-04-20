import { buildSchema, GraphQLSchema, OperationTypeNode } from 'graphql';

import { Executor } from './executor';
import { OperationCreator } from './operation-creator';
import { OperationBuilder } from './operation-builder';

describe('OperationCreator', () => {
	describe.each([
		['query', OperationTypeNode.QUERY, 'Query'],
		['mutate', OperationTypeNode.MUTATION, 'Mutation'],
		['subscribe', OperationTypeNode.SUBSCRIPTION, 'Subscription'],
	])('%s', (method, operation, typeName) => {
		it("throws if the schema doesn't support the operation", () => {
			const schema = new GraphQLSchema({
				/* empty */
			});
			const executor: Executor = {
				execute: () => {
					throw new Error();
				},
			};
			const creator = new OperationCreator({ schema, executor });

			expect(() => (creator as any)[method]('')).toThrowError(`Schema does not support operation type "${operation}".`);
		});

		it("throws if the operation doesn't support the field", () => {
			const schema = buildSchema(`type ${typeName} { foo: Boolean }`);
			const executor: Executor = {
				execute: () => {
					throw new Error();
				},
			};
			const field = 'bar';
			const creator = new OperationCreator({ schema, executor });

			expect(() => (creator as any)[method](field)).toThrowError(
				`Schema does not support field "${field}" on operation "${operation}".`
			);
		});

		// it.each([
		//   'Boolean',
		//   'Boolean!',
		//   '[Boolean]',
		//   '[Boolean!]',
		//   '[[Boolean]]'
		// ])('unwraps root types', (type) => {
		//   // @todo
		// })

		it('returns a OperationBuilder', () => {
			const schema = buildSchema(`type ${typeName} { foo: Boolean }`);
			const executor: Executor = {
				execute: () => {
					throw new Error();
				},
			};
			const field = 'foo';
			const creator = new OperationCreator({ schema, executor });
			const builder = (creator as any)[method](field);

			expect(builder).toBeInstanceOf(OperationBuilder);
			expect(builder.config).toEqual({
				schema,
				executor: expect.anything(),
				rootType: operation,
				rootField: field,
				type: schema.getType('Boolean')!,
				typeSelection: undefined, // no selection on scalar or enum types
			});
		});
	});
});
