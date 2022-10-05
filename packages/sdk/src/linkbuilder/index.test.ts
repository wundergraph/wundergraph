import { FieldInfo, queryTypeFields, sourceFieldStep } from './index';
import { buildSchema } from 'graphql';
import { assert } from 'chai';

test('queryTypeFields', () => {
	const schema = buildSchema(`
        type Query {
            a: String!
            b(a: Int): Int!
            c(input: UserInput! a: String): User
        }
        type User {
            a: String
        }
        input UserInput {
            id: ID!
        }
    `);
	const actual = queryTypeFields(schema);
	const expected: FieldInfo[] = [
		{
			typeName: 'Query',
			fieldName: 'a',
			fieldType: 'String!',
			arguments: [],
		},
		{
			typeName: 'Query',
			fieldName: 'b',
			fieldType: 'Int!',
			arguments: [
				{
					name: 'a',
					type: 'Int',
				},
			],
		},
		{
			typeName: 'Query',
			fieldName: 'c',
			fieldType: 'User',
			arguments: [
				{
					name: 'input',
					type: 'UserInput!',
				},
				{
					name: 'a',
					type: 'String',
				},
			],
		},
	];
	assert.equal(JSON.stringify(actual, null, '  '), JSON.stringify(expected, null, '  '));
});

test('linkBuilder', () => {
	interface TargetTypes {
		Country: 'code' | 'name';
		User: 'id' | 'name' | 'username';
	}

	interface SourceFields {
		user: {
			name: null;
			age: null;
		};
		country: {
			code: null;
		};
		continent: {
			id: null;
		};
	}

	const linkDefinition = sourceFieldStep<SourceFields, TargetTypes>()
		.source('user')
		.target('User', 'userUser')
		.argument('age', 'fieldArgument', 'userAge')
		.argument('name', 'objectField', 'username')
		.build();
});
