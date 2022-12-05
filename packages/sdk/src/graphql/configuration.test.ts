import { configuration, GraphQLConfiguration } from './configuration';
import { assert } from 'chai';
import { parse } from 'graphql';
import { ArgumentRenderConfiguration, ArgumentSource } from '@wundergraph/protobuf';
import { ArgumentReplacement } from './schema';

const tests: {
	schema: string;
	serviceSDL?: string;
	argumentReplacements: ArgumentReplacement[];
	config: GraphQLConfiguration;
}[] = [
	{
		schema:
			'schema {   query: Query } union _Entity = User type Entity {      findUserByID(id: ID!): User! } type User {      id: ID!      name: String      username: String } scalar _Any scalar _FieldSet type Query {      me: User      _entities(representations: [_Any!]!): [_Entity]!      _service: _Service! } type _Service {      sdl: String }',
		serviceSDL:
			'type Query @extends {   me: User } type User @key(fields: "id") {   id: ID!   name: String   username: String } ',
		argumentReplacements: [],
		config: {
			RootNodes: [
				{
					typeName: 'Query',
					fieldNames: ['me'],
				},
				{
					typeName: 'User',
					fieldNames: ['id', 'name', 'username'],
				},
			],
			ChildNodes: [
				{
					typeName: 'User',
					fieldNames: ['id', 'name', 'username'],
				},
			],
			Fields: [
				{
					typeName: 'User',
					fieldName: 'name',
					requiresFields: ['id'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
				{
					typeName: 'User',
					fieldName: 'username',
					requiresFields: ['id'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
			],
			Types: [],
		},
	},
	{
		schema:
			'schema {   query: Query } union _Entity = Product type Entity {      findProductByUpc(upc: String!): Product! } scalar _FieldSet type Product {      upc: String!      name: String      price: Int      weight: Int } scalar _Any type Query {      topProducts(first: Int = 5): [Product]      _entities(representations: [_Any!]!): [_Entity]!      _service: _Service! } type _Service {      sdl: String }',
		serviceSDL:
			'type Query @extends {   topProducts(first: Int = 5): [Product] }  type Product @key(fields: "upc") {   upc: String!   name: String   price: Int   weight: Int } ',
		argumentReplacements: [],
		config: {
			RootNodes: [
				{
					typeName: 'Query',
					fieldNames: ['topProducts'],
				},
				{
					typeName: 'Product',
					fieldNames: ['upc', 'name', 'price', 'weight'],
				},
			],
			ChildNodes: [
				{
					typeName: 'Product',
					fieldNames: ['upc', 'name', 'price', 'weight'],
				},
			],
			Fields: [
				{
					typeName: 'Query',
					fieldName: 'topProducts',
					argumentsConfiguration: [
						{
							name: 'first',
							sourceType: ArgumentSource.FIELD_ARGUMENT,
							sourcePath: [],
							renderConfiguration: ArgumentRenderConfiguration.RENDER_ARGUMENT_DEFAULT,
							renameTypeTo: '',
						},
					],
					disableDefaultFieldMapping: false,
					path: [],
					requiresFields: [],
					unescapeResponseJson: false,
				},
				{
					typeName: 'Product',
					fieldName: 'name',
					requiresFields: ['upc'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
				{
					typeName: 'Product',
					fieldName: 'price',
					requiresFields: ['upc'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
				{
					typeName: 'Product',
					fieldName: 'weight',
					requiresFields: ['upc'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
			],
			Types: [],
		},
	},
	{
		schema:
			'schema {   query: Query } union _Entity = Product type Entity {      findProductByUpc(upc: String!): Product! } scalar _FieldSet type Product {      upc: String!      name: String      price: Int      weight: Int } scalar _Any type Query {      topProducts(first: Int = 5): [Product]      _entities(representations: [_Any!]!): [_Entity]!      _service: _Service! } type _Service {      sdl: String }',
		serviceSDL:
			'type Query @extends {   topProducts(first: Int = 5): [Product] }  type Product @key(fields: "upc") {   upc: String!   name: String   price: Int   weight: Int } ',
		argumentReplacements: [
			{
				fieldName: 'topProducts',
				typeName: 'Query',
				argName: 'first',
				renameTypeTo: 'second',
			},
		],
		config: {
			RootNodes: [
				{
					typeName: 'Query',
					fieldNames: ['topProducts'],
				},
				{
					typeName: 'Product',
					fieldNames: ['upc', 'name', 'price', 'weight'],
				},
			],
			ChildNodes: [
				{
					typeName: 'Product',
					fieldNames: ['upc', 'name', 'price', 'weight'],
				},
			],
			Fields: [
				{
					typeName: 'Query',
					fieldName: 'topProducts',
					argumentsConfiguration: [
						{
							name: 'first',
							sourceType: ArgumentSource.FIELD_ARGUMENT,
							sourcePath: [],
							renderConfiguration: ArgumentRenderConfiguration.RENDER_ARGUMENT_DEFAULT,
							renameTypeTo: 'second',
						},
					],
					disableDefaultFieldMapping: false,
					path: [],
					requiresFields: [],
					unescapeResponseJson: false,
				},
				{
					typeName: 'Product',
					fieldName: 'name',
					requiresFields: ['upc'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
				{
					typeName: 'Product',
					fieldName: 'price',
					requiresFields: ['upc'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
				{
					typeName: 'Product',
					fieldName: 'weight',
					requiresFields: ['upc'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
			],
			Types: [],
		},
	},
	{
		schema:
			'schema {   query: Query } scalar _FieldSet union _Entity = Product | Review | User type Entity {      findProductByUpc(upc: String!): Product!      findReviewByID(id: ID!): Review!      findUserByID(id: ID!): User! } type Product {      upc: String!      reviews: [Review] } type Query {      _entities(representations: [_Any!]!): [_Entity]!      _service: _Service! } scalar _Any type _Service {      sdl: String } type Review {      id: ID!      body: String      author: User      product: Product } type User {      id: ID!      username: String      reviews: [Review] }',
		serviceSDL:
			'type Review @key(fields: "id") {   id: ID!   body: String   author: User @provides(fields: "username")   product: Product }  type User @extends @key(fields: "id") {   id: ID! @external   username: String @external   reviews: [Review] }  type Product @extends @key(fields: "upc") {   upc: String! @external   reviews: [Review] } ',
		argumentReplacements: [],
		config: {
			RootNodes: [
				{
					typeName: 'Review',
					fieldNames: ['id', 'body', 'author', 'product'],
				},
				{
					typeName: 'User',
					fieldNames: ['reviews'],
				},
				{
					typeName: 'Product',
					fieldNames: ['reviews'],
				},
			],
			ChildNodes: [
				{
					typeName: 'Review',
					fieldNames: ['id', 'body', 'author', 'product'],
				},
				{
					typeName: 'User',
					fieldNames: ['id'],
				},
				{
					typeName: 'Product',
					fieldNames: ['upc'],
				},
			],
			Fields: [
				{
					typeName: 'Review',
					fieldName: 'body',
					requiresFields: ['id'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
				{
					typeName: 'Review',
					fieldName: 'author',
					requiresFields: ['id'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
				{
					typeName: 'Review',
					fieldName: 'product',
					requiresFields: ['id'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
				{
					typeName: 'User',
					fieldName: 'reviews',
					requiresFields: ['id'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
				{
					typeName: 'Product',
					fieldName: 'reviews',
					requiresFields: ['upc'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
			],
			Types: [],
		},
	},
	{
		schema:
			'schema {   query: Query } type Product {      upc: String!      weight: Int      price: Int      inStock: Boolean      shippingEstimate: Int } scalar _Any type Entity {      findProductByUpc(upc: String!): Product! } type Query {      _entities(representations: [_Any!]!): [_Entity]!      _service: _Service! } scalar _FieldSet union _Entity = Product type _Service {      sdl: String }',
		serviceSDL:
			'type Product @extends @key(fields: "upc") {     upc: String! @external     weight: Int @external     price: Int @external     inStock: Boolean     shippingEstimate: Int @requires(fields: "price weight") } ',
		argumentReplacements: [],
		config: {
			RootNodes: [
				{
					typeName: 'Product',
					fieldNames: ['inStock', 'shippingEstimate'],
				},
			],
			ChildNodes: [
				{
					typeName: 'Product',
					fieldNames: ['upc'],
				},
			],
			Fields: [
				{
					typeName: 'Product',
					fieldName: 'inStock',
					requiresFields: ['upc'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
				{
					typeName: 'Product',
					fieldName: 'shippingEstimate',
					requiresFields: ['upc'],
					argumentsConfiguration: [],
					path: [],
					disableDefaultFieldMapping: false,
					unescapeResponseJson: false,
				},
			],
			Types: [],
		},
	},
];

test('configuration', () => {
	tests.forEach((t, i) => {
		const schema = parse(t.schema);
		const serviceSDL = t.serviceSDL === undefined ? undefined : parse(t.serviceSDL);
		const nodes = configuration(schema, serviceSDL, t.argumentReplacements);
		assert.equal(pretty(nodes), pretty(t.config), 'testCase: ' + i);
	});
});

const pretty = (input: any) => {
	return JSON.stringify(input, null, '  ');
};
