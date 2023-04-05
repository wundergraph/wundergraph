import {
	internalPathRegex,
	LoadOperationsOutput,
	operationResponseToJSONSchema,
	operationVariablesToJSONSchema,
	ParsedOperations,
	parseGraphQLOperations,
} from './operations';
import { assert } from 'chai';
import { buildSchema, OperationDefinitionNode, parse } from 'graphql';
import { JSONSchema7 as JSONSchema } from 'json-schema';
import { ClaimType, OperationExecutionEngine, OperationType } from '@wundergraph/protobuf';
import * as fs from 'fs';
import path from 'path';

const MyReviews = `
query {
    me {
        name
        reviews {
            id
            body
        }
    }
}`;

const CreatePet = `
mutation ($petInput: PetInput!) {
    postPets(petInput: $petInput){
        name
    }
}`;

const NewPets = `
subscription @internalOperation {
    newPets {
        name
    }
}`;

test('parseGraphQLOperations', () => {
	const operations: LoadOperationsOutput = {
		graphql_operation_files: [
			{
				operation_name: 'MyReviews',
				api_mount_path: 'MyReviews',
				content: MyReviews,
				file_path: 'MyReviews.graphql',
			},
			{
				operation_name: 'CreatePet',
				api_mount_path: 'CreatePet',
				content: CreatePet,
				file_path: 'CreatePet.graphql',
			},
			{
				operation_name: 'NewPets',
				api_mount_path: 'NewPets',
				content: NewPets,
				file_path: 'NewPets.graphql',
			},
		],
	};
	const actual = parseGraphQLOperations(testSchema, operations);
	expect(actual).toMatchSnapshot();
});

const GetName = `
query GetName {
    name: me @transform(get: "name") {
        name
    }
}`;

const GetReviews = `
query GetReviews {
    myReviews: me @transform(get: "reviews") {
        name
        reviews {
            id
            body
        }
    }
}`;

const TopProducts = `
query TopProducts{
    topProducts {
        upc
        name
        price
        reviews {
            id
            body
            userName: author @transform(get: "name") {
                name
            }
            productNames: author @transform(get: "reviews.product.name") {
                reviews {
                    product {
                        name
                    }
                }
            }
        }
    }
}`;

const expectedTransformOperations: ParsedOperations = {
	operations: [
		{
			Name: 'GetName',
			PathName: 'GetName',
			Content: 'query GetName{name:me{name}}',
			OperationType: OperationType.QUERY,
			ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
			VariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			InterpolationVariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			InternalVariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			InjectedVariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			ResponseSchema: {
				type: 'object',
				properties: {
					data: {
						type: 'object',
						properties: {
							name: {
								type: 'string',
							},
						},
						additionalProperties: false,
					},
				},
				additionalProperties: false,
			},
			AuthenticationConfig: {
				required: false,
			},
			AuthorizationConfig: {
				claims: [],
				roleConfig: {
					requireMatchAll: [],
					requireMatchAny: [],
					denyMatchAll: [],
					denyMatchAny: [],
				},
			},
			HooksConfiguration: {
				preResolve: false,
				postResolve: false,
				mutatingPreResolve: false,
				mutatingPostResolve: false,
				mockResolve: {
					enable: false,
					subscriptionPollingIntervalMillis: 0,
				},
				httpTransportOnResponse: false,
				httpTransportOnRequest: false,
				customResolve: false,
			},
			VariablesConfiguration: {
				injectVariables: [],
			},
			Internal: false,
			PostResolveTransformations: [
				{
					kind: 'get',
					depth: 3,
					get: {
						from: ['data', 'name', 'name'],
						to: ['data', 'name'],
					},
				},
			],
		},
		{
			Name: 'GetReviews',
			PathName: 'GetReviews',
			Content: 'query GetReviews{myReviews:me{name reviews{id body}}}',
			OperationType: OperationType.QUERY,
			ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
			VariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			InterpolationVariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			InternalVariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			InjectedVariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			ResponseSchema: {
				type: 'object',
				properties: {
					data: {
						type: 'object',
						properties: {
							myReviews: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										id: {
											type: 'string',
										},
										body: {
											type: 'string',
										},
									},
									additionalProperties: false,
									required: ['id'],
								},
							},
						},
						additionalProperties: false,
					},
				},
				additionalProperties: false,
			},
			AuthenticationConfig: {
				required: false,
			},
			AuthorizationConfig: {
				claims: [],
				roleConfig: {
					requireMatchAll: [],
					requireMatchAny: [],
					denyMatchAll: [],
					denyMatchAny: [],
				},
			},
			HooksConfiguration: {
				preResolve: false,
				postResolve: false,
				mutatingPreResolve: false,
				mutatingPostResolve: false,
				mockResolve: {
					enable: false,
					subscriptionPollingIntervalMillis: 0,
				},
				httpTransportOnResponse: false,
				httpTransportOnRequest: false,
				customResolve: false,
			},
			VariablesConfiguration: {
				injectVariables: [],
			},
			Internal: false,
			PostResolveTransformations: [
				{
					kind: 'get',
					depth: 3,
					get: {
						from: ['data', 'myReviews', 'reviews'],
						to: ['data', 'myReviews'],
					},
				},
			],
		},
		{
			Name: 'TopProducts',
			PathName: 'TopProducts',
			Content:
				'query TopProducts{topProducts{upc name price reviews{id body userName:author{name}productNames:author{reviews{product{name}}}}}}',
			OperationType: OperationType.QUERY,
			ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
			VariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			InterpolationVariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			InternalVariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			InjectedVariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			ResponseSchema: {
				type: 'object',
				properties: {
					data: {
						type: 'object',
						properties: {
							topProducts: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										upc: {
											type: 'string',
										},
										name: {
											type: 'string',
										},
										price: {
											type: 'integer',
										},
										reviews: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													id: {
														type: 'string',
													},
													body: {
														type: 'string',
													},
													userName: {
														type: 'string',
													},
													productNames: {
														type: 'string',
													},
												},
												additionalProperties: false,
												required: ['id'],
											},
										},
									},
									additionalProperties: false,
									required: ['upc'],
								},
							},
						},
						additionalProperties: false,
					},
				},
				additionalProperties: false,
			},
			AuthenticationConfig: {
				required: false,
			},
			AuthorizationConfig: {
				claims: [],
				roleConfig: {
					requireMatchAll: [],
					requireMatchAny: [],
					denyMatchAll: [],
					denyMatchAny: [],
				},
			},
			HooksConfiguration: {
				preResolve: false,
				postResolve: false,
				mutatingPreResolve: false,
				mutatingPostResolve: false,
				mockResolve: {
					enable: false,
					subscriptionPollingIntervalMillis: 0,
				},
				httpTransportOnResponse: false,
				httpTransportOnRequest: false,
				customResolve: false,
			},
			VariablesConfiguration: {
				injectVariables: [],
			},
			Internal: false,
			PostResolveTransformations: [
				{
					kind: 'get',
					depth: 7,
					get: {
						from: ['data', 'topProducts', '[]', 'reviews', '[]', 'userName', 'name'],
						to: ['data', 'topProducts', '[]', 'reviews', '[]', 'userName'],
					},
				},
				{
					kind: 'get',
					depth: 10,
					get: {
						from: ['data', 'topProducts', '[]', 'reviews', '[]', 'productNames', 'reviews', '[]', 'product', 'name'],
						to: ['data', 'topProducts', '[]', 'reviews', '[]', 'productNames'],
					},
				},
			],
		},
	],
};

test('parseTransformOperations', () => {
	const transformOperations: LoadOperationsOutput = {
		graphql_operation_files: [
			{
				operation_name: 'GetName',
				api_mount_path: 'GetName',
				file_path: 'GetName.graphql',
				content: GetName,
			},
			{
				operation_name: 'GetReviews',
				api_mount_path: 'GetReviews',
				file_path: 'GetReviews.graphql',
				content: GetReviews,
			},
			{
				operation_name: 'TopProducts',
				api_mount_path: 'TopProducts',
				file_path: 'TopProducts.graphql',
				content: TopProducts,
			},
		],
	};
	const actual = parseGraphQLOperations(testSchema, transformOperations);
	assert.equal(pretty(actual), pretty(expectedTransformOperations));
});

const fromClaimSchema = `
schema {
    query: Query
    mutation: Mutation
}
type Query {
    user(email: String!): User
}
type Mutation {
    createUser(email: String!): User
}
type User {
    email: String!
}
directive @fromClaim(name: Claim) on VARIABLE_DEFINITION
enum Claim {
  EMAIL
  EMAIL_VERIFIED
  NAME
  NICKNAME
  LOCATION
  PROVIDER
}
`;

const fromClaimOperations = `
mutation (
    $email: String! @fromClaim(name: EMAIL)
) {
    createUser(email: $email) {
        email
    }
}
`;

const fromClaimParsed: ParsedOperations = {
	operations: [
		{
			Name: 'CreateUser',
			PathName: 'CreateUser',
			Content: 'mutation($email:String!@fromClaim(name:EMAIL)){createUser(email:$email){email}}',
			OperationType: OperationType.MUTATION,
			ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
			VariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			InterpolationVariablesSchema: {
				type: 'object',
				properties: {},
				additionalProperties: false,
			},
			InternalVariablesSchema: {
				type: 'object',
				properties: {
					email: {
						type: 'string',
					},
				},
				additionalProperties: false,
				required: ['email'],
			},
			InjectedVariablesSchema: {
				type: 'object',
				properties: {
					email: {
						type: 'string',
					},
				},
				additionalProperties: false,
				required: ['email'],
			},
			ResponseSchema: {
				type: 'object',
				properties: {
					data: {
						type: 'object',
						properties: {
							createUser: {
								type: 'object',
								properties: {
									email: {
										type: 'string',
									},
								},
								additionalProperties: false,
								required: ['email'],
							},
						},
						additionalProperties: false,
					},
				},
				additionalProperties: false,
			},
			AuthenticationConfig: {
				required: true,
			},
			AuthorizationConfig: {
				claims: [
					{
						variablePathComponents: ['email'],
						claimType: ClaimType.EMAIL,
					},
				],
				roleConfig: {
					requireMatchAll: [],
					requireMatchAny: [],
					denyMatchAll: [],
					denyMatchAny: [],
				},
			},
			HooksConfiguration: {
				preResolve: false,
				postResolve: false,
				mutatingPreResolve: false,
				mutatingPostResolve: false,
				mockResolve: {
					enable: false,
					subscriptionPollingIntervalMillis: 0,
				},
				httpTransportOnResponse: false,
				httpTransportOnRequest: false,
				customResolve: false,
			},
			VariablesConfiguration: {
				injectVariables: [],
			},
			Internal: false,
		},
	],
};

test('parse operations with fromClaim directive', () => {
	const operations: LoadOperationsOutput = {
		graphql_operation_files: [
			{
				operation_name: 'CreateUser',
				api_mount_path: 'CreateUser',
				file_path: 'CreateUser.graphql',
				content: fromClaimOperations,
			},
		],
	};
	const actual = parseGraphQLOperations(fromClaimSchema, operations);
	assert.equal(pretty(actual), pretty(fromClaimParsed));
});

test('parse operations with jsonSchema directive', () => {
	const operations: LoadOperationsOutput = {
		graphql_operation_files: [
			{
				operation_name: 'nested_JsonSchemaQuery',
				api_mount_path: 'nested/JsonSchemaQuery',
				file_path: 'nested/JsonSchemaQuery.graphql',
				content: jsonSchemaDirectiveOperation,
			},
		],
	};
	const actual = parseGraphQLOperations(jsonSchemaDirectiveSchema, operations, {
		keepFromClaimVariables: true,
	});
	assert.equal(pretty(actual), pretty(jsonSchemaDirectiveParsed));
});

const jsonSchemaDirectiveOperation = `
query (
    $nullableStringWithTitle: String @jsonSchema(title: "someTitle")
    $stringWithTitle: String! @jsonSchema(title: "someTitle")
    $stringWithDescription: String! @jsonSchema(description: "someDescription")
    $intWithMultipleOf: Int! @jsonSchema(multipleOf: 10)
    $intWithMaximum: Int! @jsonSchema(maximum: 10)
    $intWithExclusiveMaximum: Int! @jsonSchema(exclusiveMaximum: 10)
    $intWithMinimum: Int! @jsonSchema(minimum: 1)
    $intWithExclusiveMinimum: Int! @jsonSchema(exclusiveMinimum: 1)
    $stringWithMaxLength: String! @jsonSchema(maxLength: 3)
    $stringWithMinLength: String! @jsonSchema(minLength: 5)
    $stringWithPattern: String! @jsonSchema(pattern: "foo")
    $arrayWithMaxItems: [String]! @jsonSchema(maxItems: 5)
    $arrayWithMinItems: [String]! @jsonSchema(minItems: 2)
    $arrayWithUniqueItems: [String]! @jsonSchema(uniqueItems: true)
    $email: String! @jsonSchema(commonPattern: EMAIL)
    $domain: String! @jsonSchema(commonPattern: DOMAIN)
) {
    root(input: {
        nullableStringWithTitle: $nullableStringWithTitle
        stringWithTitle: $stringWithTitle
        stringWithDescription: $stringWithDescription
        intWithMultipleOf: $intWithMultipleOf
        intWithMaximum: $intWithMaximum
        intWithExclusiveMaximum: $intWithExclusiveMaximum
        intWithMinimum: $intWithMinimum
        intWithExclusiveMinimum: $intWithExclusiveMinimum
        stringWithMaxLength: $stringWithMaxLength
        stringWithMinLength: $stringWithMinLength
        stringWithPattern: $stringWithPattern
        arrayWithMaxItems: $arrayWithMaxItems
        arrayWithMinItems: $arrayWithMinItems
        arrayWithUniqueItems: $arrayWithUniqueItems
        email: $email
        domain: $domain
    })
}`;

const jsonSchemVariablesSchema: JSONSchema = {
	type: 'object',
	properties: {
		nullableStringWithTitle: {
			type: ['string', 'null'],
			title: 'someTitle',
		},
		stringWithTitle: {
			type: 'string',
			title: 'someTitle',
		},
		stringWithDescription: {
			type: 'string',
			description: 'someDescription',
		},
		intWithMultipleOf: {
			type: 'integer',
			multipleOf: 10,
		},
		intWithMaximum: {
			type: 'integer',
			maximum: 10,
		},
		intWithExclusiveMaximum: {
			type: 'integer',
			exclusiveMaximum: 10,
		},
		intWithMinimum: {
			type: 'integer',
			minimum: 1,
		},
		intWithExclusiveMinimum: {
			type: 'integer',
			exclusiveMinimum: 1,
		},
		stringWithMaxLength: {
			type: 'string',
			maxLength: 3,
		},
		stringWithMinLength: {
			type: 'string',
			minLength: 5,
		},
		stringWithPattern: {
			type: 'string',
			pattern: 'foo',
		},
		arrayWithMaxItems: {
			type: 'array',
			items: {
				type: ['string', 'null'],
			},
			maxItems: 5,
		},
		arrayWithMinItems: {
			type: 'array',
			items: {
				type: ['string', 'null'],
			},
			minItems: 2,
		},
		arrayWithUniqueItems: {
			type: 'array',
			items: {
				type: ['string', 'null'],
			},
			uniqueItems: true,
		},
		email: {
			type: 'string',
			pattern:
				'(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])',
		},
		domain: {
			type: 'string',
			pattern: '^([a-z0-9]+(-[a-z0-9]+)*\\.)+[a-z]{2,}$',
		},
	},
	additionalProperties: false,
	required: [
		'stringWithTitle',
		'stringWithDescription',
		'intWithMultipleOf',
		'intWithMaximum',
		'intWithExclusiveMaximum',
		'intWithMinimum',
		'intWithExclusiveMinimum',
		'stringWithMaxLength',
		'stringWithMinLength',
		'stringWithPattern',
		'arrayWithMaxItems',
		'arrayWithMinItems',
		'arrayWithUniqueItems',
		'email',
		'domain',
	],
};

const jsonSchemaDirectiveParsed: ParsedOperations = {
	operations: [
		{
			Name: 'nested_JsonSchemaQuery',
			PathName: 'nested/JsonSchemaQuery',
			Content: `query($nullableStringWithTitle:String@jsonSchema(title:"someTitle")$stringWithTitle:String!@jsonSchema(title:"someTitle")$stringWithDescription:String!@jsonSchema(description:"someDescription")$intWithMultipleOf:Int!@jsonSchema(multipleOf:10)$intWithMaximum:Int!@jsonSchema(maximum:10)$intWithExclusiveMaximum:Int!@jsonSchema(exclusiveMaximum:10)$intWithMinimum:Int!@jsonSchema(minimum:1)$intWithExclusiveMinimum:Int!@jsonSchema(exclusiveMinimum:1)$stringWithMaxLength:String!@jsonSchema(maxLength:3)$stringWithMinLength:String!@jsonSchema(minLength:5)$stringWithPattern:String!@jsonSchema(pattern:"foo")$arrayWithMaxItems:[String]!@jsonSchema(maxItems:5)$arrayWithMinItems:[String]!@jsonSchema(minItems:2)$arrayWithUniqueItems:[String]!@jsonSchema(uniqueItems:true)$email:String!@jsonSchema(commonPattern:EMAIL)$domain:String!@jsonSchema(commonPattern:DOMAIN)){root(input:{nullableStringWithTitle:$nullableStringWithTitle stringWithTitle:$stringWithTitle stringWithDescription:$stringWithDescription intWithMultipleOf:$intWithMultipleOf intWithMaximum:$intWithMaximum intWithExclusiveMaximum:$intWithExclusiveMaximum intWithMinimum:$intWithMinimum intWithExclusiveMinimum:$intWithExclusiveMinimum stringWithMaxLength:$stringWithMaxLength stringWithMinLength:$stringWithMinLength stringWithPattern:$stringWithPattern arrayWithMaxItems:$arrayWithMaxItems arrayWithMinItems:$arrayWithMinItems arrayWithUniqueItems:$arrayWithUniqueItems email:$email domain:$domain})}`,
			OperationType: OperationType.QUERY,
			ExecutionEngine: OperationExecutionEngine.ENGINE_GRAPHQL,
			VariablesSchema: jsonSchemVariablesSchema,
			InterpolationVariablesSchema: jsonSchemVariablesSchema,
			InternalVariablesSchema: jsonSchemVariablesSchema,
			InjectedVariablesSchema: jsonSchemVariablesSchema,
			ResponseSchema: {
				type: 'object',
				properties: {
					data: {
						type: 'object',
						properties: {
							root: {
								type: 'string',
							},
						},
						additionalProperties: false,
						required: ['root'],
					},
				},
				additionalProperties: false,
			},
			AuthenticationConfig: {
				required: false,
			},
			AuthorizationConfig: {
				claims: [],
				roleConfig: {
					requireMatchAll: [],
					requireMatchAny: [],
					denyMatchAll: [],
					denyMatchAny: [],
				},
			},
			HooksConfiguration: {
				preResolve: false,
				postResolve: false,
				mutatingPreResolve: false,
				mutatingPostResolve: false,
				mockResolve: {
					enable: false,
					subscriptionPollingIntervalMillis: 0,
				},
				httpTransportOnResponse: false,
				httpTransportOnRequest: false,
				customResolve: false,
			},
			VariablesConfiguration: {
				injectVariables: [],
			},
			Internal: false,
		},
	],
};

const jsonSchemaDirectiveSchema = `

type Query {
    root(input: RootInput):String!
}

input RootInput {
    nullableStringWithTitle: String
    stringWithTitle: String!
    intWithMultipleOf: Int!
    intWithMaximum: Int!
    intWithExclusiveMaximum: Int!
    intWithMinimum: Int!
    intWithExclusiveMinimum: Int!
    stringWithMinLength: String!
    stringWithPattern: String!
    stringWithMaxLength: String!
    arrayWithMaxItems: [String]!
    arrayWithUniqueItems: [String]!
    arrayWithMinItems: [String]!
    email: String!
    domain: String!
    stringWithDescription: String!
}

directive @jsonSchema (
  """
  The value of both of these keywords MUST be a string.

  Both of these keywords can be used to decorate a user interface with
  information about the data produced by this user interface.  A title
  will preferably be short, whereas a description will provide
  explanation about the purpose of the instance described by this
  schema.
  """
  title: String
  """
  The value of both of these keywords MUST be a string.

  Both of these keywords can be used to decorate a user interface with
  information about the data produced by this user interface.  A title
  will preferably be short, whereas a description will provide
  explanation about the purpose of the instance described by this
  schema.
  """
  description: String
  """
  The value of "multipleOf" MUST be a number, strictly greater than 0.

  A numeric instance is valid only if division by this keyword's value
  results in an integer.
  """
  multipleOf: Int
  """
  The value of "maximum" MUST be a number, representing an inclusive
  upper limit for a numeric instance.

  If the instance is a number, then this keyword validates only if the
  instance is less than or exactly equal to "maximum".
  """
  maximum: Int
  """
  The value of "exclusiveMaximum" MUST be number, representing an
  exclusive upper limit for a numeric instance.

  If the instance is a number, then the instance is valid only if it
  has a value strictly less than (not equal to) "exclusiveMaximum".
  """
  exclusiveMaximum: Int
  """
  The value of "minimum" MUST be a number, representing an inclusive
  lower limit for a numeric instance.

  If the instance is a number, then this keyword validates only if the
  instance is greater than or exactly equal to "minimum".
  """
  minimum: Int
  """
  The value of "exclusiveMinimum" MUST be number, representing an
  exclusive lower limit for a numeric instance.

  If the instance is a number, then the instance is valid only if it
  has a value strictly greater than (not equal to) "exclusiveMinimum".
  """
  exclusiveMinimum: Int
  """
  The value of this keyword MUST be a non-negative integer.

  A string instance is valid against this keyword if its length is less
  than, or equal to, the value of this keyword.

  The length of a string instance is defined as the number of its
  characters as defined by RFC 7159 [RFC7159].
  """
  maxLength: Int
  """
  The value of this keyword MUST be a non-negative integer.

  A string instance is valid against this keyword if its length is
  greater than, or equal to, the value of this keyword.

  The length of a string instance is defined as the number of its
  characters as defined by RFC 7159 [RFC7159].

  Omitting this keyword has the same behavior as a value of 0.
  """
  minLength: Int
  """
  The value of this keyword MUST be a string.  This string SHOULD be a
  valid regular expression, according to the ECMA 262 regular
  expression dialect.

  A string instance is considered valid if the regular expression
  matches the instance successfully.  Recall: regular expressions are
  not implicitly anchored.
  """
  pattern: String
  """
  The value of this keyword MUST be a non-negative integer.

  An array instance is valid against "maxItems" if its size is less
  than, or equal to, the value of this keyword.
  """
  maxItems: Int
  """
  The value of this keyword MUST be a non-negative integer.

  An array instance is valid against "minItems" if its size is greater
  than, or equal to, the value of this keyword.

  Omitting this keyword has the same behavior as a value of 0.
  """
  minItems: Int
  """
  The value of this keyword MUST be a boolean.

  If this keyword has boolean value false, the instance validates
  successfully.  If it has boolean value true, the instance validates
  successfully if all of its elements are unique.

  Omitting this keyword has the same behavior as a value of false.
  """
  uniqueItems: Boolean
  commonPattern: COMMON_REGEX_PATTERN
) on VARIABLE_DEFINITION

enum COMMON_REGEX_PATTERN {
    EMAIL
    DOMAIN
}`;

const testSchema = `type Query {
  me: User
  topProducts(first: Int = 5): [Product]
  nullableComplex(input: ComplexInput): User
  nonNullComplex(input: ComplexInput!): User
  nonNullMixed(input: ComplexInput!, a: Int!): User
}

directive @internalOperation on QUERY | MUTATION | SUBSCRIPTION

directive @transform(
    get: String
) on FIELD

type Mutation {
    postPets(petInput: PetInput!): Pet
}

type Subscription {
    newPets: Pet
}

type Pet {
    id: ID!
    name: String
}

input PetInput {
    id: ID!
    name: String
}

enum EnumInput {
    A
    B
}

input ComplexInput {
    nullableString: String
    nullableStringWithDefault: String = "foo"
    nonNullString: String!
    nonNullStringWithDefault: String! = "bar"
    nullableBoolean: Boolean
    nonNullBoolean: Boolean!
    nullableFloat: Float
    nonNullFloat: Float!
    nullableInt: Int
    nonNullInt: Int!
    nullableInput: NestedInput
    nonNullInput: NestedInput!
    nullableEnum: EnumInput
    nonNullEnum: EnumInput!
    nullableListOfNullableString: [String]
    nonNullListOfNullableString: [String]!
    nonNullListOfNonNullString: [String!]!
}

input NestedInput {
    nullableString: String
}

type User {
  id: ID!
  name: String
  username: String
  reviews: [Review]
}

type Product {
  upc: String!
  name: String
  price: Int
  weight: Int
  reviews: [Review]
  inStock: Boolean
  shippingEstimate: Int
}

type Review {
  id: ID!
  body: String
  author: User
  product: Product
}
`;

test('operationVariablesToJSONSchema', () => {
	subTest(testSchema, [
		{
			query: `query Q($a: Int){topProducts(first: $a){upc}}`,
		},
		{
			query: `query Q($a: ComplexInput){nullableComplex(input: $a){id}}`,
		},
	]);
});

const pretty = (input: any) => {
	return JSON.stringify(input, null, '  ');
};

interface TestCase {
	query: string;
}

const subTest = (rawSchema: string, testCase: TestCase[]) => {
	const schema = buildSchema(rawSchema);
	testCase.forEach((testCase, i) => {
		const queryDocument = parse(testCase.query);
		const operation = queryDocument.definitions.find(
			(node) => node.kind === 'OperationDefinition'
		) as OperationDefinitionNode;
		const actual = operationResponseToJSONSchema(schema, queryDocument, operation, []);
		expect(pretty(actual)).toMatchSnapshot(`testCase_${i}_responseJSONSchema`);
		const actualVariables = operationVariablesToJSONSchema(schema, operation, [], false, false, []);
		expect(pretty(actualVariables)).toMatchSnapshot(`testCase_${i}_variablesJSONSchema`);
	});
};

test('complex schema operations', () => {
	subTest(complexSchema, [
		{
			query: `mutation CreateNamespace($name: String! $personal: Boolean!) {
                        namespaceCreate(input: {name: $name, personal: $personal}){
                            ... on NamespaceCreated {
                                namespace {
                                    id
                                    name
                                }
                            }
                            ... on Error {
                                code
                                message
                            }
                        }
                    }`,
		},
	]);
});

test('complex operations with variables', () => {
	const rawSchema = fs.readFileSync(path.resolve(__dirname, './testdata/wundergraph.schema.graphql.file'));
	const schema = rawSchema.toString('utf-8');

	subTest(schema, [
		{
			query: `
            query FirstAPI($id: String!) {
                findFirstapi(where: {id: {equals: $id}}) {
                    id
                    name
                    namespace {
                        id
                        name
                    }
                }
            }`,
		},
		{
			query: `
            query FirstNamespace($id: StringFilter!) {
                findFirstnamespace(where: {id: $id}) {
                    id
                    name
                    api {
                        id
                        name
                        created_at
                    }
                }
            }`,
		},
		{
			query: `
            query FirstNamespace($where: namespaceWhereInput) {
                findFirstnamespace(where: $where) {
                    id
                    name
                    api {
                        id
                        name
                        created_at
                    }
                }
            }`,
		},
	]);
});

const complexSchema = `
input CreateNamespace {
  name: String!
  personal: Boolean!
}

input NamespaceUpdateMembership {
  namespaceID: ID!
  memberID: ID!
  newMembership: Membership!
}

union DeleteApiResponse = Success | Error

type ApiUpdated {
  api: Api!
}

input DeleteDeployment {
  deploymentID: ID!
}

union AdminConfigResponse = Error | AdminConfig

input NamespaceRemoveMember {
  namespaceID: ID!
  memberID: ID!
}

type User {
  id: ID!
  name: String!
  email: String!
  namespaces: [Namespace!]!
  accessTokens: [AccessToken!]!
}

input DeleteApi {
  id: ID!
}

union NamespaceUpdateMembershipResponse = NamespaceMembershipUpdated | Error

type NamespaceMembershipUpdated {
  namespace: Namespace!
}

type EnvironmentUpdated {
  environment: Environment!
}

union CreateNamespaceResponse = NamespaceCreated | Error

type Namespace {
  id: ID!
  name: String!
  members: [Member!]!
  apis: [Api!]!
  environments: [Environment!]!
  personal: Boolean!
}

input UpdateEnvironment {
  environmentID: ID!
  edgeIDs: [ID!]
}

input DeleteEnvironment {
  environmentID: ID!
}

enum ApiVisibility {
  public
  private
  namespace
}

type Member {
  user: User!
  membership: Membership!
}

union DeleteAccessTokenResponse = Success | Error

input CreateApi {
  apiName: String!
  namespaceID: String!
  visibility: ApiVisibility!
  markdownDescription: String!
}

union CreateApiResponse = ApiCreated | Error

union UpdateApiResponse = ApiUpdated | Error

input CreateOrUpdateDeployment {
  apiID: ID!
  name: String
  config: JSON!
  environmentIDs: [ID!]!
}

union CreateOrUpdateDeploymentResponse = DeploymentCreated | DeploymentUpdated | Error

union CreateEnvironmentResponse = EnvironmentCreated | Error

input DeleteAccessToken {
  id: ID!
}

union CreateAccessTokenResponse = AccessTokenCreated | Error

input UpdateApi {
  id: ID!
  apiName: String!
  config: JSON!
  visibility: ApiVisibility!
  markdownDescription: String!
}

type Success {
  message: String!
}

scalar JSON

type AdminConfig {
  WunderNodeImageTag: String!
}

input NamespaceAddMember {
  namespaceID: ID!
  newMemberEmail: String!
  membership: Membership
}

input DeleteNamespace {
  namespaceID: ID!
}

type AccessTokenCreated {
  token: String!
  accessToken: AccessToken!
}

union NamespaceAddMemberResponse = NamespaceMemberAdded | Error

type Api {
  id: ID!
  name: String!
  visibility: ApiVisibility!
  deployments: [Deployment!]!
  markdownDescription: String!
}

union DeleteDeploymentResponse = Success | Error

type Query {
  user: User
  edges: [Edge!]!
  admin_Config: AdminConfigResponse!
}

type NamespaceMemberRemoved {
  namespace: Namespace!
}

type NamespaceMemberAdded {
  namespace: Namespace!
}

union DeleteNamespaceResponse = Success | Error

enum Membership {
  owner
  maintainer
  viewer
  guest
}

input CreateAccessToken {
  name: String!
}

union DeleteEnvironmentResponse = Success | Error

scalar Time

type ApiCreated {
  api: Api!
}

enum EnvironmentKind {
  Personal
  Team
  Business
}

type Edge {
  id: ID!
  name: String!
  location: String!
}

union NamespaceRemoveMemberResponse = NamespaceMemberRemoved | Error

type NamespaceCreated {
  namespace: Namespace!
}

union UpdateEnvironmentResponse = EnvironmentUpdated | Error

type Deployment {
  id: ID!
  name: String!
  config: JSON!
  environments: [Environment!]!
}

type Error {
  code: ErrorCode!
  message: String!
}

type Mutation {
  accessTokenCreate(input: CreateAccessToken!): CreateAccessTokenResponse!
  accessTokenDelete(input: DeleteAccessToken!): DeleteAccessTokenResponse!
  apiCreate(input: CreateApi!): CreateApiResponse!
  apiUpdate(input: UpdateApi!): UpdateApiResponse!
  apiDelete(input: DeleteApi!): DeleteApiResponse!
  deploymentCreateOrUpdate(input: CreateOrUpdateDeployment!): CreateOrUpdateDeploymentResponse!
  deploymentDelete(input: DeleteDeployment!): DeleteDeploymentResponse!
  environmentCreate(input: CreateEnvironment!): CreateEnvironmentResponse!
  environmentUpdate(input: UpdateEnvironment!): UpdateEnvironmentResponse!
  environmentDelete(input: DeleteEnvironment!): DeleteEnvironmentResponse!
  namespaceCreate(input: CreateNamespace!): CreateNamespaceResponse!
  namespaceDelete(input: DeleteNamespace!): DeleteNamespaceResponse!
  namespaceAddMember(input: NamespaceAddMember!): NamespaceAddMemberResponse!
  namespaceRemoveMember(input: NamespaceRemoveMember!): NamespaceRemoveMemberResponse!
  namespaceUpdateMembership(input: NamespaceUpdateMembership!): NamespaceUpdateMembershipResponse!
  admin_setWunderNodeImageTag(imageTag: String!): AdminConfigResponse!
}

type AccessToken {
  id: ID!
  name: String!
  createdAt: Time!
}

type EnvironmentCreated {
  environment: Environment!
}

type DeploymentUpdated {
  deployment: Deployment!
}

enum ErrorCode {
  Internal
  AuthenticationRequired
  Unauthorized
  NotFound
  Conflict
  UserAlreadyHasPersonalNamespace
  TeamPlanInPersonalNamespace
  InvalidName
  UnableToDeployEnvironment
  InvalidWunderGraphConfig
  ApiEnvironmentNamespaceMismatch
  UnableToUpdateEdgesOnPersonalEnvironment
}

type Environment {
  id: ID!
  name: String
  primary: Boolean!
  kind: EnvironmentKind!
  edges: [Edge!]
  primaryHostName: String!
  hostNames: [String!]!
}

type DeploymentCreated {
  deployment: Deployment!
}

input CreateEnvironment {
  namespace: ID!
  name: String
  primary: Boolean!
  kind: EnvironmentKind!
  edges: [ID!]
}`;

test('internalPathRegex', () => {
	const regex = RegExp(internalPathRegex);
	const publicPaths = ['foo.ts', 'bar.graphql', 'nested/bat.ts', 'internal.graphql', 'nested/internal.ts'];
	const internalPaths = ['internal/foo.ts', 'internal/bar.graphql', 'nested/internal/bat.ts'];

	publicPaths.forEach((path) => {
		expect(regex.test(path)).toBe(false);
	});

	internalPaths.forEach((path) => {
		expect(regex.test(path)).toBe(true);
	});
});
