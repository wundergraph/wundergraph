import { GraphQLIntrospection } from '../definition';
import { assert } from 'chai';
import { replaceScalarsWithCustomScalars } from './replaceScalarsWithCustomScalars';

test('that only exact parent and field names are changed', async () => {
	const schema = `
		schema {
 			query: Query
 			mutation: Mutation
		}

		type Query {
			pokemon(id: ID!): Pokemon
		}
		
		type Mutation {
			catchPokemon(pokemon: PokemonInput!): Pokemon
		}

		scalar JSON

		type Pokemon {
			id: ID!
  		baseStats: JSON
  		baseStatAttack: Int
		}
		
		type FakePokemon {
			id: ID!
			baseStat: JSON
			baseStatAttack: Int
		}
		
		input PokemonInput {
			id: ID!
  		baseStats: JSON
  		baseStatAttack: Int
		}
		
		input FakePokemonInput {
			id: ID!
			baseStat: JSON
			baseStatAttack: Int
		}
	`;

	const introspection: GraphQLIntrospection = {
		url: '',
		schemaExtension: `
		scalar BaseStats
		
		scalar BaseStatsInput
		`,
		replaceScalarsWithCustomScalars: [
			{
				exactParentTypeName: 'Pokemon',
				exactFieldName: 'baseStats',
				exactReplacementScalarName: 'BaseStats',
			},
			{
				exactParentTypeName: 'PokemonInput',
				exactFieldName: 'baseStats',
				exactReplacementScalarName: 'BaseStats',
			},
		],
	};

	const { schemaSDL, replacementScalarFields } = replaceScalarsWithCustomScalars(schema, introspection);
	console.log(schemaSDL);
	assert.equal(replacementScalarFields.length, 2);
	assert.deepEqual(replacementScalarFields, [
		{
			typeName: 'Pokemon',
			fieldName: 'baseStats',
		},
		{
			typeName: 'PokemonInput',
			fieldName: 'baseStats',
		},
	]);
});
