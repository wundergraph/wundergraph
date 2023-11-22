import {
	applyNamespaceToDirectiveConfiguration,
	applyNamespaceToExistingRootFieldConfigurations,
	applyNameSpaceToFieldConfigurations,
	applyNameSpaceToGraphQLSchema,
	applyNameSpaceToTypeFields,
	generateTypeConfigurationsForNamespace,
} from './namespacing';
import { buildSchema, parse, print } from 'graphql';
import { assert } from 'chai';
import { DirectiveConfiguration, FieldConfiguration, TypeConfiguration, TypeField } from '@wundergraph/protobuf';

test('apply namespace to starwars schema', () => {
	const actual = applyNameSpaceToGraphQLSchema(starWarsSchema, ['api_hero'], 'api');
	const expected = print(parse(renamedStarWarsSchema));
	assert.equal(actual, expected);
});

test('apply undefined namespace to starwars schema', () => {
	const actual = applyNameSpaceToGraphQLSchema(starWarsSchema, ['api_hero'], undefined);
	const expected = print(parse(starWarsSchema));
	assert.equal(actual, expected);
});

test('apply namespace to directive configuration', () => {
	const schema = buildSchema(starWarsSchema);
	const actual = applyNamespaceToDirectiveConfiguration(schema, 'api');
	const expected: DirectiveConfiguration[] = [
		{
			directiveName: 'api_customFormat',
			renameTo: 'customFormat',
		},
		{
			directiveName: 'api_some',
			renameTo: 'some',
		},
	];
	assert.equal(JSON.stringify(actual, null, '  '), JSON.stringify(expected, null, '  '));
});

test('apply undefined namespace to directive configuration', () => {
	const schema = buildSchema(starWarsSchema);
	const actual = applyNamespaceToDirectiveConfiguration(schema, undefined);
	const expected: DirectiveConfiguration[] = [];
	assert.equal(JSON.stringify(actual, null, '  '), JSON.stringify(expected, null, '  '));
});

test('apply namespace to type fields', () => {
	const schema = buildSchema(starWarsSchema);
	const input: TypeField[] = [
		{
			typeName: 'Query',
			fieldNames: ['hero', 'droid'],
		},
		{
			typeName: 'Mutation',
			fieldNames: ['createReview'],
		},
		{
			typeName: 'Subscription',
			fieldNames: ['remainingJedis'],
		},
		{
			typeName: 'Review',
			fieldNames: ['id', 'stars'],
		},
		{
			typeName: 'Starship',
			fieldNames: ['name', 'length'],
		},
	];
	const actual = applyNameSpaceToTypeFields(input, schema, 'api');
	const expected: TypeField[] = [
		{
			typeName: 'Query',
			fieldNames: ['api_hero', 'api_droid'],
		},
		{
			typeName: 'Mutation',
			fieldNames: ['api_createReview'],
		},
		{
			typeName: 'Subscription',
			fieldNames: ['api_remainingJedis'],
		},
		{
			typeName: 'api_Review',
			fieldNames: ['id', 'stars'],
		},
		{
			typeName: 'api_Starship',
			fieldNames: ['name', 'length'],
		},
	];
	assert.equal(JSON.stringify(actual, null, '  '), JSON.stringify(expected, null, '  '));
});

test('apply undefined namespace to type fields', () => {
	const schema = buildSchema(starWarsSchema);
	const input: TypeField[] = [
		{
			typeName: 'Query',
			fieldNames: ['hero', 'droid'],
		},
		{
			typeName: 'Mutation',
			fieldNames: ['createReview'],
		},
		{
			typeName: 'Subscription',
			fieldNames: ['remainingJedis'],
		},
		{
			typeName: 'Review',
			fieldNames: ['id', 'stars'],
		},
		{
			typeName: 'Starship',
			fieldNames: ['name', 'length'],
		},
	];
	const actual = applyNameSpaceToTypeFields(input, schema, undefined);
	assert.equal(JSON.stringify(actual, null, '  '), JSON.stringify(input, null, '  '));
});

test('apply namespace to field configurations', () => {
	const schema = buildSchema(starWarsSchema);
	const input: FieldConfiguration[] = [
		{
			typeName: 'Query',
			fieldName: 'api_hero',
			disableDefaultFieldMapping: false,
			path: ['api_hero'],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Query',
			fieldName: 'droid',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Starship',
			fieldName: 'name',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
	];
	const actual = applyNameSpaceToFieldConfigurations(input, schema, ['api_hero'], 'api');
	const expected: FieldConfiguration[] = [
		{
			typeName: 'Query',
			fieldName: 'api_hero',
			disableDefaultFieldMapping: false,
			path: ['api_hero'],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Query',
			fieldName: 'api_droid',
			disableDefaultFieldMapping: false,
			path: ['droid'],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'api_Starship',
			fieldName: 'name',
			disableDefaultFieldMapping: false,
			path: ['name'],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Query',
			fieldName: 'api_search',
			disableDefaultFieldMapping: false,
			path: ['search'],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Query',
			fieldName: 'api_stringList',
			disableDefaultFieldMapping: false,
			path: ['stringList'],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Query',
			fieldName: 'api_nestedStringList',
			disableDefaultFieldMapping: false,
			path: ['nestedStringList'],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Mutation',
			fieldName: 'api_createReview',
			disableDefaultFieldMapping: false,
			path: ['createReview'],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Subscription',
			fieldName: 'api_remainingJedis',
			disableDefaultFieldMapping: false,
			path: ['remainingJedis'],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
	];
	assert.equal(JSON.stringify(actual, null, '  '), JSON.stringify(expected, null, '  '));
});

test('apply undefined namespace to field configurations', () => {
	const schema = buildSchema(starWarsSchema);
	const input: FieldConfiguration[] = [
		{
			typeName: 'Query',
			fieldName: 'api_hero',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Query',
			fieldName: 'droid',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Starship',
			fieldName: 'name',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
	];
	const actual = applyNameSpaceToFieldConfigurations(input, schema, ['api_hero'], undefined);
	assert.equal(JSON.stringify(actual, null, '  '), JSON.stringify(input, null, '  '));
});

test('apply namespace to existing root field configurations', () => {
	const schema = buildSchema(starWarsSchema);
	const input: FieldConfiguration[] = [
		{
			typeName: 'Query',
			fieldName: 'hero',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Query',
			fieldName: 'droid',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Starship',
			fieldName: 'name',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
	];
	const actual = applyNamespaceToExistingRootFieldConfigurations(input, schema, 'api');
	const expected: FieldConfiguration[] = [
		{
			typeName: 'Query',
			fieldName: 'api_hero',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Query',
			fieldName: 'api_droid',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'api_Starship',
			fieldName: 'name',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
	];
	assert.equal(JSON.stringify(actual, null, '  '), JSON.stringify(expected, null, '  '));
});

test('apply undefined namespace to existing root field configurations', () => {
	const schema = buildSchema(starWarsSchema);
	const input: FieldConfiguration[] = [
		{
			typeName: 'Query',
			fieldName: 'api_hero',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Query',
			fieldName: 'droid',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
		{
			typeName: 'Starship',
			fieldName: 'name',
			disableDefaultFieldMapping: false,
			path: [],
			argumentsConfiguration: [],
			requiresFields: [],
			unescapeResponseJson: false,
		},
	];
	const actual = applyNamespaceToExistingRootFieldConfigurations(input, schema, undefined);
	assert.equal(JSON.stringify(actual, null, '  '), JSON.stringify(input, null, '  '));
});

test('generate type configurations for namespace', () => {
	const actual = generateTypeConfigurationsForNamespace(starWarsSchema, 'api');
	const expected: TypeConfiguration[] = [
		{
			typeName: 'api_SearchResult',
			renameTo: 'SearchResult',
		},
		{
			typeName: 'api_Heroes',
			renameTo: 'Heroes',
		},
		{
			typeName: 'api_ReviewInput',
			renameTo: 'ReviewInput',
		},
		{
			typeName: 'api_Review',
			renameTo: 'Review',
		},
		{
			typeName: 'api_Episode',
			renameTo: 'Episode',
		},
		{
			typeName: 'api_Character',
			renameTo: 'Character',
		},
		{
			typeName: 'api_Human',
			renameTo: 'Human',
		},
		{
			typeName: 'api_Droid',
			renameTo: 'Droid',
		},
		{
			typeName: 'api_Starship',
			renameTo: 'Starship',
		},
	];
	assert.equal(JSON.stringify(actual, null, '  '), JSON.stringify(expected, null, '  '));
});

test('generate type configurations for undefined namespace', () => {
	const actual = generateTypeConfigurationsForNamespace(starWarsSchema);
	const expected: TypeConfiguration[] = [];
	assert.equal(JSON.stringify(actual, null, '  '), JSON.stringify(expected, null, '  '));
});

const starWarsSchema = `
union SearchResult = Human | Droid | Starship

scalar DateTime
scalar JSON

directive @customFormat on FIELD
directive @skip on FIELD
directive @include on FIELD
directive @deprecated on FIELD
directive @specifiedBy on SCALAR
directive @some on FIELD_DEFINITION

schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
}

interface Heroes {
    api_hero: Character
}

type Query implements Heroes {
    api_hero: Character @some
    droid(id: ID!): Droid
    search(name: String!): SearchResult
	stringList: [String]
	nestedStringList: [String]
}

type Mutation {
	createReview(episode: Episode!, review: ReviewInput!): Review
}

type Subscription {
    remainingJedis: Int!
}

input ReviewInput {
    stars: Int!
    commentary: String
}

type Review {
    id: ID!
    stars: Int!
    commentary: String
}

enum Episode {
    NEWHOPE
    EMPIRE
    JEDI
}

interface Character {
    name: String!
    friends: [Character]
}

type Human implements Character {
    name: String!
    height: String!
    friends: [Character]
}

type Droid implements Character {
    name: String!
    primaryFunction: String!
    friends: [Character]
}

type Starship {
    name: String!
    length: Float!
}`;

const renamedStarWarsSchema = `
union api_SearchResult = api_Human | api_Droid | api_Starship

scalar DateTime
scalar JSON

directive @api_customFormat on FIELD
directive @skip on FIELD
directive @include on FIELD
directive @deprecated on FIELD
directive @specifiedBy on SCALAR
directive @api_some on FIELD_DEFINITION

schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
}

interface api_Heroes {
    api_hero: api_Character
}

type Query implements api_Heroes {
    api_hero: api_Character @api_some
    api_droid(id: ID!): api_Droid
    api_search(name: String!): api_SearchResult
	api_stringList: [String]
	api_nestedStringList: [String]
}

type Mutation {
	api_createReview(episode: api_Episode!, review: api_ReviewInput!): api_Review
}

type Subscription {
    api_remainingJedis: Int!
}

input api_ReviewInput {
    stars: Int!
    commentary: String
}

type api_Review {
    id: ID!
    stars: Int!
    commentary: String
}

enum api_Episode {
    NEWHOPE
    EMPIRE
    JEDI
}

interface api_Character {
    name: String!
    friends: [api_Character]
}

type api_Human implements api_Character {
    name: String!
    height: String!
    friends: [api_Character]
}

type api_Droid implements api_Character {
    name: String!
    primaryFunction: String!
    friends: [api_Character]
}

type api_Starship {
    name: String!
    length: Float!
}`;
