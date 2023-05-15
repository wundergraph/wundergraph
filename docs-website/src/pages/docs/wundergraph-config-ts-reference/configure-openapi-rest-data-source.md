---
title: Configure OpenAPI-/REST Datasource
description: The OpenAPI-/REST data source introspects an OpenAPI Specification and generates a GraphQL schema from it.
---

The OpenAPI-/REST data source introspects an OpenAPI Specification and generates a GraphQL schema from it.

## Example Configuration

```typescript
// wundergraph.config.ts
const jsp = introspect.openApi({
  apiNamespace: 'jsp',
  source: {
    kind: 'file',
    filePath: '../json_placeholder.json',
  },
  introspection: {
    pollingIntervalSeconds: 2,
  },
  requestTimeoutSeconds: 10, // optional
});
configureWunderGraphApplication({
  apis: [jsp],
});
```

WunderGraph will automatically cache the introspection result in the local file-system.

If you intend to frequently change the OpenAPI Specification,
e.g. during development,
you should specify the `pollingIntervalSeconds` to 5 seconds for example.

## overriding the base URL

Sometimes, it's important to be able to override the base URL of the OpenAPI Specification.
In this case, you can use the `baseUrl` option:

```typescript
// wundergraph.config.ts
const jsp = introspect.openApi({
  apiNamespace: 'jsp',
  source: {
    kind: 'file',
    filePath: '../json_placeholder.json',
  },
  baseURL: 'https://jsonplaceholder.typicode.com',
});
```

## dynamically overriding the base URL

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
