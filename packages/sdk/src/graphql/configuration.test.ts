import { configuration, GraphQLConfiguration } from './configuration';
import { assert } from 'chai';
import { parse } from 'graphql';
import { ArgumentRenderConfiguration, ArgumentSource } from '@wundergraph/protobuf';
import { ArgumentReplacement } from '../transformations/transformSchema';

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
	{
		schema:
			'schema { query: Query } type Query { jsonReturn: JSON jsonInput(field: JSON): String jsonListReturn: [JSON] jsonListInput(input: [JSON]): String } scalar JSON',
		config: {
			RootNodes: [
				{
					typeName: 'Query',
					fieldNames: ['jsonReturn', 'jsonInput', 'jsonListReturn', 'jsonListInput'],
				},
			],
			ChildNodes: [],
			Fields: [
				{
					typeName: 'Query',
					fieldName: 'jsonInput',
					argumentsConfiguration: [
						{
							name: 'field',
							sourceType: 1,
							sourcePath: [],
							renderConfiguration: 0,
							renameTypeTo: '',
						},
					],
					disableDefaultFieldMapping: false,
					path: [],
					requiresFields: [],
					unescapeResponseJson: false,
				},
				{
					typeName: 'Query',
					fieldName: 'jsonListInput',
					argumentsConfiguration: [
						{
							name: 'input',
							sourceType: 1,
							sourcePath: [],
							renderConfiguration: 0,
							renameTypeTo: '',
						},
					],
					disableDefaultFieldMapping: false,
					path: [],
					requiresFields: [],
					unescapeResponseJson: false,
				},
				{
					typeName: 'Query',
					fieldName: 'jsonReturn',
					argumentsConfiguration: [],
					disableDefaultFieldMapping: false,
					path: [],
					requiresFields: [],
					unescapeResponseJson: true,
				},
				{
					typeName: 'Query',
					fieldName: 'jsonListReturn',
					argumentsConfiguration: [],
					disableDefaultFieldMapping: false,
					path: [],
					requiresFields: [],
					unescapeResponseJson: true,
				},
			],
			Types: [],
		},
		argumentReplacements: [],
	},
	{
		schema: 'type Query { me: User } type User {  id: ID!  username: String! }',
		serviceSDL: 'extend type Query { me: User } type User @key(fields: "id") { id: ID! username: String! }',
		config: {
			RootNodes: [
				{
					typeName: 'Query',
					fieldNames: ['me'],
				},
				{
					typeName: 'User',
					fieldNames: ['id', 'username'],
				},
			],
			ChildNodes: [
				{
					typeName: 'User',
					fieldNames: ['id', 'username'],
				},
			],
			Fields: [
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
		argumentReplacements: [],
	},
	{
		schema:
			'type Product {  reviews: [Review]  upc: String! }  type Query  type Review {  author: User!  body: String!  product: Product! } type User {  id: ID!  reviews: [Review]  username: String! }',
		serviceSDL:
			'type Review {    body: String!    author: User! @provides(fields: "username")    product: Product! }  extend type User @key(fields: "id") {   id: ID! @external    username: String! @external    reviews: [Review] } extend type Product @key(fields: "upc") {    upc: String! @external    reviews: [Review] }',
		config: {
			RootNodes: [
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
					fieldNames: ['body', 'author', 'product'],
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
		argumentReplacements: [],
	},
	{
		schema:
			'schema {   query: Query } type Product {      upc: String!      weight: Int      price: Int      inStock: Boolean      shippingEstimate: Int } scalar _Any type Entity {      findProductByUpc(upc: String!): Product! } type Query {      _entities(representations: [_Any!]!): [_Entity]!      _service: _Service! } scalar _FieldSet union _Entity = Product type _Service {      sdl: String }',
		serviceSDL:
			'extend type Product @key(fields: "upc") {     upc: String! @external     weight: Int @external     price: Int @external     inStock: Boolean     shippingEstimate: Int @requires(fields: "price weight") } ',
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
		argumentReplacements: [],
	},
	{
		schema:
			'schema {   query: Query } scalar _FieldSet union _Entity = Product | Review | User type Entity {      findProductByUpc(upc: String!): Product!      findReviewByID(id: ID!): Review!      findUserByID(id: ID!): User! } type Product {      upc: String!      reviews: [Review] } type Query {      _entities(representations: [_Any!]!): [_Entity]!      _service: _Service! } scalar _Any type _Service {      sdl: String } type Review {      id: ID!      body: String      author: User      product: Product } type User {      id: ID!      username: String      reviews: [Review] }',
		serviceSDL:
			'type Review @key(fields: "id") {   id: ID!   body: String   author: User @provides(fields: "username")   product: Product }  extend type User @key(fields: "id") {   id: ID! @external   username: String @external   reviews: [Review] }  extend type Product @key(fields: "upc") {   upc: String! @external   reviews: [Review] } ',
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
		argumentReplacements: [],
	},
];

describe('configuration', () => {
	it.each(tests)(
		'testCase: %#',
		({ schema: tSchema, serviceSDL: tServiceSDL, argumentReplacements: tArgumentReplacements, config }) => {
			const schema = parse(tSchema);
			const serviceSDL = tServiceSDL === undefined ? undefined : parse(tServiceSDL);
			const nodes = configuration(schema, undefined, serviceSDL, tArgumentReplacements);
			assert.equal(pretty(nodes), pretty(config));
		}
	);
});

const pretty = (input: any) => {
	return JSON.stringify(input, null, '  ');
};
