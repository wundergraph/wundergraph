import { GraphQLIntrospection } from '../definition';
import { replaceCustomScalars } from './replaceCustomScalars';
import { assert } from 'chai';

describe('replaceCustomScalars Tests', () => {
	test('that scalars are replaced', async () => {
		const schema = `
		schema {
 			query: Query
 			mutation: Mutation
		}

		type Query {
			landpad(id: ID!): Landpad
		}
		
		type Mutation {
			createLandpad(landpad: LandpadInput!): Landpad
		}

		scalar JSON
		scalar hasura_geography

		type Landpad {
  		attempted_landings: String
  		details: String
  		full_name: String
  		id: ID
  		landing_type: String
  		location: JSON
  		status: String
  		successful_landings: String
  		wikipedia: String
  		geo: hasura_geography
		}
		
		type Pod {
		 	id: ID
		 	geo: hasura_geography
		 	location: String
		} 	
		
		type Capsule {
		  id: ID
		  location: JSON
		}
		
		input LandpadInput {
			attempted_landings: String
			details: String
			full_name: String
			id: ID
			landing_type: String
			location: JSON
			status: String
			successful_landings: String
			wikipedia: String
			geo: hasura_geography
		}
	`;

		const introspection: GraphQLIntrospection = {
			url: '',
			schemaExtension: `
		type Location {
		  latitude: Float
		  longitude: Float
		  name: String
		  region: String
		}
		input LocationInput {
		  latitude: Float
		  longitude: Float
		  name: String
		  region: String
		}
		type Geography {
		  lat: Float
		  lng: Float
		}
		type AnotherGeography {
		  lat: Float
		  lng: Float
		}
		input GeographyInput {
		  lat: Float
		  lng: Float
		}
		`,
			replaceCustomScalarTypeFields: [
				{
					entityName: 'Landpad',
					fieldName: 'location',
					responseTypeReplacement: 'Location',
				},
				{
					entityName: 'LandpadInput',
					fieldName: 'location',
					responseTypeReplacement: 'LocationInput',
				},
				{
					entityName: 'Landpad',
					fieldName: 'geo',
					responseTypeReplacement: 'Geography',
				},
				{
					entityName: 'LandpadInput',
					fieldName: 'geo',
					responseTypeReplacement: 'GeographyInput',
				},
				{
					entityName: 'Capsule',
					fieldName: 'location',
					responseTypeReplacement: 'Location',
				},
				{
					entityName: 'Pod',
					fieldName: 'geo',
					responseTypeReplacement: 'AnotherGeography',
				},
			],
		};

		const { schemaSDL, customScalarTypeFields } = replaceCustomScalars(schema, introspection);
		console.log(schemaSDL);
		assert.equal(customScalarTypeFields.length, 6);
		assert.deepEqual(customScalarTypeFields, [
			{
				typeName: 'Landpad',
				fieldName: 'location',
			},
			{
				typeName: 'Landpad',
				fieldName: 'geo',
			},
			{
				typeName: 'Pod',
				fieldName: 'geo',
			},
			{
				typeName: 'Capsule',
				fieldName: 'location',
			},
			{
				typeName: 'LandpadInput',
				fieldName: 'location',
			},
			{
				typeName: 'LandpadInput',
				fieldName: 'geo',
			},
		]);
	});

	test('that only exact parent type and field names are changed', async () => {
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
		
		interface Friend {
			power: JSON
		}
		
		interface Creature {
			baseStats: JSON
		}

		type Pokemon implements Creature & Friend {
			id: ID!
  		baseStats: JSON
  		power: JSON
  		baseStatAttack: Int
		}
		
		type FakePokemon {
			id: ID!
			baseStat: JSON
			notpower: JSON
			baseStatAttack: Int
		}
		
		input PokemonInput {
			id: ID!
  		baseStats: JSON
  		power: JSON
  		baseStatAttack: Int
		}
		
		input FakePokemonInput {
			id: ID!
			baseStat: JSON
			notpower: JSON
			baseStatAttack: Int
		}
	`;

		const introspection: GraphQLIntrospection = {
			url: '',
			schemaExtension: `
		type BaseStats {
			hp: Int
			attack: Int
			defence: Int
			specialAttack: Int
			specialDefence: Int
			speed: Int
		}
		
		scalar BaseStatsInput {
			hp: Int
			attack: Int
			defence: Int
			specialAttack: Int
			specialDefence: Int
			speed: Int
		}
		
		type Power {
			level: Int
			hasMaxEVs: Boolean
		}
		`,
			replaceCustomScalarTypeFields: [
				{
					entityName: 'Pokemon',
					fieldName: 'baseStats',
					responseTypeReplacement: 'BaseStats',
				},
				{
					entityName: 'Pokemon',
					fieldName: 'power',
					responseTypeReplacement: 'Power',
				},
				{
					entityName: 'PokemonInput',
					fieldName: 'baseStats',
					responseTypeReplacement: 'BaseStats',
				},
				{
					entityName: 'PokemonInput',
					fieldName: 'power',
					responseTypeReplacement: 'PowerInput',
				},
			],
		};

		const { schemaSDL, customScalarTypeFields } = replaceCustomScalars(schema, introspection);
		console.log(schemaSDL);
		assert.equal(customScalarTypeFields.length, 6);
		assert.deepEqual(customScalarTypeFields, [
			{
				typeName: 'Pokemon',
				fieldName: 'baseStats',
			},
			{
				typeName: 'Pokemon',
				fieldName: 'power',
			},
			{
				typeName: 'PokemonInput',
				fieldName: 'baseStats',
			},
			{
				typeName: 'PokemonInput',
				fieldName: 'power',
			},
			{
				typeName: 'Friend',
				fieldName: 'power',
			},
			{
				typeName: 'Creature',
				fieldName: 'baseStats',
			},
		]);
	});

	test('that non-changes are ignored', async () => {
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
	
		type Power {
			level: Int
			hasMaxEVs: boolean
		}

		type Pokemon {
			id: ID!
  		baseStats: JSON
  		power: Power
  		baseStatAttack: Int
		}
	`;

		const introspection: GraphQLIntrospection = {
			url: '',
			schemaExtension: '',
			replaceCustomScalarTypeFields: [
				{
					entityName: 'Pokemon',
					fieldName: 'power',
					responseTypeReplacement: 'Power',
				},
			],
		};

		const { schemaSDL, customScalarTypeFields } = replaceCustomScalars(schema, introspection);
		console.log(schemaSDL);
		assert.equal(customScalarTypeFields.length, 0);
		assert.deepEqual(customScalarTypeFields, []);
	});
});
