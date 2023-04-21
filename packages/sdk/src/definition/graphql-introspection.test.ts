import { introspect } from './index';
import fetch from 'node-fetch';
import nock from 'nock';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { assert } from 'chai';
import { buildSchema, lexicographicSortSchema, parse, printSchema } from 'graphql';
import { buildSubgraphSchema } from './graphql-introspection';

axios.defaults.adapter = require('axios/lib/adapters/http');

test('introspection via http', async () => {
	/*
	Uncomment this section if you want to update the test data from the real introspection endpoints.
	
	const fetchSDL = async (url: string, body: string) => {
	const introspection = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body,
		});
		return await introspection.json();
	};

	const sdlQuery = `{"query":"{_service{sdl}}"}`;
	const introspectionQuery = JSON.stringify({
		query: getIntrospectionQuery(),
		operationName: 'IntrospectionQuery',
	});

	const accountsSDL = await fetchSDL('http://localhost:4001/graphql', sdlQuery);
	const reviewsSDL = await fetchSDL('http://localhost:4002/graphql', sdlQuery);
	const productsSDL = await fetchSDL('http://localhost:4003/graphql', sdlQuery);
	const inventorySDL = await fetchSDL('http://localhost:4004/graphql', sdlQuery);
	const accountsIntrospection = await fetchSDL('http://localhost:4001/graphql', introspectionQuery);
	const reviewsIntrospection = await fetchSDL('http://localhost:4002/graphql', introspectionQuery);
	const productsIntrospection = await fetchSDL('http://localhost:4003/graphql', introspectionQuery);
	const inventoryIntrospection = await fetchSDL('http://localhost:4004/graphql', introspectionQuery);
	
	await fs.writeFile(path.join(__dirname, 'testdata','introspection.json'), JSON.stringify({
		accountsSDL,
		productsSDL,
		reviewsSDL,
		inventorySDL,
		accountsIntrospection,
		productsIntrospection,
		reviewsIntrospection,
		inventoryIntrospection,
	}, null, 2), {encoding: 'utf8', flag: 'w'});*/

	const data = await fs.readFile(path.join(__dirname, 'testdata', 'introspection.json'), { encoding: 'utf8' });
	const {
		accountsSDL,
		productsSDL,
		reviewsSDL,
		inventorySDL,
		accountsIntrospection,
		productsIntrospection,
		reviewsIntrospection,
		inventoryIntrospection,
	} = JSON.parse(data);

	const isSDL = (body: any) => body.query.includes('_service{sdl}');
	const isIntrospection = (body: any) => body.query.includes('IntrospectionQuery');

	nock('http://accounts.service')
		.post('/graphql', isSDL)
		.reply(200, accountsSDL)
		.post('/graphql', isIntrospection)
		.reply(200, accountsIntrospection)
		.persist();

	nock('http://products.service')
		.post('/graphql', isSDL)
		.reply(200, productsSDL)
		.post('/graphql', isIntrospection)
		.reply(200, productsIntrospection)
		.persist();

	nock('http://reviews.service')
		.post('/graphql', isSDL)
		.reply(200, reviewsSDL)
		.post('/graphql', isIntrospection)
		.reply(200, reviewsIntrospection)
		.persist();

	nock('http://inventory.service')
		.post('/graphql', isSDL)
		.reply(200, inventorySDL)
		.post('/graphql', isIntrospection)
		.reply(200, inventoryIntrospection)
		.persist();

	const generator = await introspect.federation({
		apiNamespace: 'federated',
		upstreams: [
			{
				url: 'http://accounts.service/graphql',
			},
			{
				url: 'http://reviews.service/graphql',
			},
			{
				url: 'http://products.service/graphql',
			},
			{
				url: 'http://inventory.service/graphql',
			},
		],
		introspection: {
			disableCache: true,
		},
	});

	const federatedApi = await generator({});
	expect(federatedApi).toMatchSnapshot();
});

test('introspection via string', async () => {
	const data = await fs.readFile(path.join(__dirname, 'testdata', 'introspection.json'), { encoding: 'utf8' });
	const { accountsSDL, productsSDL, reviewsSDL, inventorySDL } = JSON.parse(data);

	const generator = await introspect.federation({
		apiNamespace: 'federated',
		upstreams: [
			{
				url: 'http://accounts.service/graphql',
				loadSchemaFromString: accountsSDL.data._service.sdl,
			},
			{
				url: 'http://reviews.service/graphql',
				loadSchemaFromString: reviewsSDL.data._service.sdl,
			},
			{
				url: 'http://products.service/graphql',
				loadSchemaFromString: productsSDL.data._service.sdl,
			},
			{
				url: 'http://inventory.service/graphql',
				loadSchemaFromString: inventorySDL.data._service.sdl,
			},
		],
		introspection: {
			disableCache: true,
		},
	});

	const federatedApiFromString = await generator({});
	expect(federatedApiFromString).toMatchSnapshot();
});

test('build subgraph schema', async () => {
	const data = await fs.readFile(path.join(__dirname, 'testdata', 'introspection.json'), { encoding: 'utf8' });
	const { accountsSDL, productsSDL, reviewsSDL, inventorySDL } = JSON.parse(data);

	const accountsInput = accountsSDL.data._service.sdl;
	const productsInput = productsSDL.data._service.sdl;
	const reviewsInput = reviewsSDL.data._service.sdl;
	const inventoryInput = inventorySDL.data._service.sdl;

	const accountsSchema = printSchema(buildSubgraphSchema(parse(accountsInput)));
	const productsSchema = printSchema(buildSubgraphSchema(parse(productsInput)));
	const reviewsSchema = printSchema(buildSubgraphSchema(parse(reviewsInput)));
	const inventorySchema = printSchema(buildSubgraphSchema(parse(inventoryInput)));

	assert.equal(accountsSchema, prettifySchema(accountsSubgraphSchema));
	assert.equal(productsSchema, prettifySchema(productsSubgraphSchema));
	assert.equal(reviewsSchema, prettifySchema(reviewsSubgraphSchema));
	assert.equal(inventorySchema, prettifySchema(inventorySubgraphSchema));
});

const prettifySchema = (schema: string) => {
	return printSchema(lexicographicSortSchema(buildSchema(schema)));
};

const accountsSubgraphSchema = `directive @key(fields: String!) on OBJECT | INTERFACE

directive @extends on OBJECT | INTERFACE

directive @external on OBJECT | FIELD_DEFINITION

directive @requires(fields: String!) on FIELD_DEFINITION

directive @provides(fields: String!) on FIELD_DEFINITION

type Query {
  _entities(representations: [_Any!]!): [_Entity]!
  _service: _Service!
  me: User
}

union _Entity = User

scalar _Any

type _Service {
  """
  The sdl representing the federated service capabilities. Includes federation directives, removes federation types, and includes rest of full schema after schema directives have been applied
  """
  sdl: String
}

type User {
  id: ID!
  name: String
  username: String
}`;

const productsSubgraphSchema = `directive @key(fields: String!) on OBJECT | INTERFACE

directive @extends on OBJECT | INTERFACE

directive @external on OBJECT | FIELD_DEFINITION

directive @requires(fields: String!) on FIELD_DEFINITION

directive @provides(fields: String!) on FIELD_DEFINITION

type Query {
  _entities(representations: [_Any!]!): [_Entity]!
  _service: _Service!
  topProducts(first: Int = 5, random: Boolean): [Product]
}

union _Entity = Product

scalar _Any

type _Service {
  """
  The sdl representing the federated service capabilities. Includes federation directives, removes federation types, and includes rest of full schema after schema directives have been applied
  """
  sdl: String
}

type Product {
  upc: String!
  name: String
  price: Int
  weight: Int
}

type Subscription {
  updatedPrice: Product!
}

type Mutation {
  setPrice(upc: String!, price: Int!): Product
}`;

const reviewsSubgraphSchema = `directive @key(fields: String!) on OBJECT | INTERFACE

directive @extends on OBJECT | INTERFACE

directive @external on OBJECT | FIELD_DEFINITION

directive @requires(fields: String!) on FIELD_DEFINITION

directive @provides(fields: String!) on FIELD_DEFINITION

type Review {
  id: ID!
  body: String
  author: User
  product: Product
}

type User {
  id: ID!
  username: String
  reviews: [Review]
}

type Product {
  upc: String!
  reviews: [Review]
}

type Query {
  _entities(representations: [_Any!]!): [_Entity]!
  _service: _Service!
}

union _Entity = Review | User | Product

scalar _Any

type _Service {
  """
  The sdl representing the federated service capabilities. Includes federation directives, removes federation types, and includes rest of full schema after schema directives have been applied
  """
  sdl: String
}`;

const inventorySubgraphSchema = `directive @key(fields: String!) on OBJECT | INTERFACE

directive @extends on OBJECT | INTERFACE

directive @external on OBJECT | FIELD_DEFINITION

directive @requires(fields: String!) on FIELD_DEFINITION

directive @provides(fields: String!) on FIELD_DEFINITION

type Product {
  upc: String!
  weight: Int
  price: Int
  inStock: Boolean
  shippingEstimate: Int
}

type Query {
  _entities(representations: [_Any!]!): [_Entity]!
  _service: _Service!
}

union _Entity = Product

scalar _Any

type _Service {
  """
  The sdl representing the federated service capabilities. Includes federation directives, removes federation types, and includes rest of full schema after schema directives have been applied
  """
  sdl: String
}`;
