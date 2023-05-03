import { GraphQLIntrospection } from '../definition';
import { replaceCustomScalars } from './replaceCustomScalars';
import { assert } from 'chai';

test('replaceCustomScalars', async () => {
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
				inputTypeReplacement: 'LocationInput',
			},
			{
				entityName: 'Landpad',
				fieldName: 'geo',
				responseTypeReplacement: 'Geography',
				inputTypeReplacement: 'GeographyInput',
			},
			{
				entityName: 'Capsule',
				fieldName: 'location',
				responseTypeReplacement: 'Location',
				inputTypeReplacement: 'LocationInput',
			},
		],
	};

	const { customScalarTypeFields } = replaceCustomScalars(schema, introspection);
	assert.equal(customScalarTypeFields.length, 3);
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
			typeName: 'Capsule',
			fieldName: 'location',
		},
	]);
});
