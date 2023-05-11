import { buildSchema } from 'graphql';

import { Executor, OperationCreator } from '../src';

describe('e2e', () => {
	//
	// all of this would be code-generated
	//

	// @note ideally this is code-generated as type system definition AST objects
	const schema = buildSchema(`
    type Query {
      simple: Boolean
      getCityByName(
        name: String!
        country: String
      ): City
    }

    type City {
      id: String
      name: String
      country: String
      coord(
        required: String!
      ): Coordinates
    }

    type Coordinates {
      x: Int!
      y: Int!
      zs(
        foo: String
      ): [String!]!
    }
  `);

	interface Schema {
		Query: Query;
		City: City;
		Coordinates: Coordinates;
	}

	interface Query {
		simple(): boolean;
		getCityByName(variables: { name: string; country?: string | null }): City;
	}

	interface City {
		__typename(): 'City';
		id(): string | null;
		name(): string | null;
		country(): string | null;
		coord(variables: { required: string }): Coordinates | null;
	}

	interface Coordinates {
		x(): number;
		y(): number;
		zs(variables: { foo?: string }): Array<string>;
	}

	it('supports scalar queries', async () => {
		const executor: Executor = {
			execute(_document, _variables) {
				return Promise.resolve({
					simple: true,
				}) as any;
			},
		};
		const { query } = new OperationCreator<{ schema: Schema; executor: typeof executor }>({
			schema,
			executor,
			namespace: 'foo',
		});

		const result = await query('simple').exec();
		expect(result).toBe(true);
	});

	it('supports object type queries', async () => {
		const executor: Executor = {
			execute(_document, _variables) {
				return Promise.resolve({
					getCityByName: {
						id: '001',
						name: 'Los Angeles',
						coord: {
							x: 0,
							y: 1,
							zs: ['a'],
						},
					},
				}) as any;
			},
		};
		const { query } = new OperationCreator<{ schema: Schema; executor: typeof executor }>({
			schema,
			executor,
			namespace: 'foo',
		});

		const result = await query('getCityByName')
			.select('id', 'name', 'coord.x', 'coord.y', 'coord.zs')
			.where({ name: 'abc', coord: { required: '', zs: { foo: 'bar' } } })
			.exec();

		expect(result).toEqual({
			id: '001',
			name: 'Los Angeles',
			coord: {
				x: 0,
				y: 1,
				zs: ['a'],
			},
		});
	});
});
