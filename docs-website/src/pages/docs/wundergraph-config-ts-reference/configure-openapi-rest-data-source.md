---
title: Configure OpenAPI-/REST Datasource
description: The OpenAPI-/REST data source introspects an OpenAPI Specification and generates a GraphQL schema from it.
---

The OpenAPI-/REST data source introspects an OpenAPI Specification and generates a GraphQL schema from it.

## Example Configuration

```typescript
// wundergraph.config.ts
const jsp = introspect.openApiV2({
  id: 'jsp',
  apiNamespace: 'jsp',
  source: {
    kind: 'file',
    filePath: '../json_placeholder.json',
  },
});
configureWunderGraphApplication({
  apis: [jsp],
});
```

## Limitations of the OpenAPI-/REST data source

OpenAPI Specifications use JSON Schema to describe inputs and outputs of operations.
Naturally, JSON Schema is way more expressive and flexible than GraphQL,
which means, not all JSON Schema features can be mapped to GraphQL.

### JSON Schema `oneOf`, `anyOf`, and `allOf`

JSON Schema allows to define multiple possible types for a field using `oneOf` or `anyOf`.
These can be mapped to GraphQL using Union types for responses,
and the `@oneOf` directive for inputs.

For GraphQL to be able to distinguish between the different types,
the OpenAPI Specification must provide a discriminator field.

So, if you're using `oneOf` in your OpenAPI Specification,
make sure to provide a discriminator field,
otherwise the resolver engine will not properly resolve the field.

The `anyOf` feature is not supported for inputs.

The `allOf` feature is interpreted as a simple merge of the different schemas,
which means, the resulting GraphQL schema will contain all fields of all schemas.

### JSON Schema `additionalProperties`

JSON Schema allows to define additional properties for objects using `additionalProperties`.
This feature is not supported by GraphQL and will be ignored.
This is because all fields need to be defined in the GraphQL Schema,
otherwise it's not possible to use them in a selection set.

### JSON Schema `any`

JSON Schema allows to define a field using an empty schema,
which means that any JSON value is valid for this field.
Such fields are mapped to the GraphQL `JSON` scalar.
The limitation here is that GraphQL doesn't allow to query fields on scalars,
which means, you can't select fields on `any` fields.

As a possible solution, you can use a Schema Extension to replace the JSON scalar field with a custom object type.
More on this topic can be found in the [Schema Extension](/docs/wundergraph-config-ts-reference/schema-extension-configuration#rest-api-with-arbitrary-json-type) section.

### JSON Schema `maps`

JSON Schema allows to define maps using the `additionalProperties` keyword.
GraphQL doesn't support maps, which means, the `additionalProperties` keyword is ignored.

## Overriding the base URL

Sometimes, it's important to be able to override the base URL of the OpenAPI Specification.
In this case, you can use the `baseUrl` option:

```typescript
// wundergraph.config.ts
const jsp = introspect.openApiV2({
  apiNamespace: 'jsp',
  source: {
    kind: 'file',
    filePath: '../json_placeholder.json',
  },
  baseURL: 'https://jsonplaceholder.typicode.com',
});
```

## Dynamically overriding the base URL

Other use cases require to dynamically override the base URL,
e.g. when the accountID is part of the URL.
This is possible using the following templating syntax.

```typescript
// wundergraph.config.ts
const jsp = introspect.openApi({
  apiNamespace: 'jsp',
  source: {
    kind: 'file',
    filePath: '../json_placeholder.json',
  },
  baseURL: 'https://jsonplaceholder.typicode.com/{accountID}/',
});
```

Using the template `{accountID}` as part of the baseURL adds the `accountID` field to all generated root fields of the resulting GraphQL schema.
This means, for each operation, you have to provide the `accountID` argument.
Here's an example schema:

```graphql
type Query {
  jsp_getPosts(accountID: String!): [jsp_Post]
  jsp_getUsers(accountID: String!): [jsp_User]
  jsp_getUser(accountID: String!, id: Int!): jsp_User
  jsp_getPost(accountID: String!, id: Int!): jsp_Post
```
