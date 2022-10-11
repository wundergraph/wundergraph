---
title: GraphQl Hasura subscriptions Example
pageTitle: WunderGraph - Examples - GraphQl Hasura subscriptions
description:
---

[Check the example](https://github.com/wundergraph/wundergraph/tree/main/examples/graphql-hasura-subscriptions)

## Configuration

- Go to: https://hasura.io/learn/graphql/graphiql

You will need to complete a simple signup form (just mail and password) to get access to the
GraphiQL interface, and obtain token.

- Set the authorization header, using the token you obtained from the previous step,
  replace `Secret` with your token:

````bash
```typescript
const hasura = introspect.graphql({
  apiNamespace: 'hasura',
  url: 'https://hasura.io/learn/graphql',
  headers: (builder) => builder.addStaticHeader('Authorization', 'Secret'),
});
````

## Getting started

```shell
npm install && npm start
```

## Check results

```shell
curl -N http://localhost:9991/app/main/operations/Users
```

```shell
curl -N http://localhost:9991/app/main/operations/Todo
```

## SSE output

```shell
 curl -N http://localhost:9991/app/main/operations/Users\?wg_sse\=true
```

## Playground

Use https://hasura.io/learn/graphql/graphiql to add new users and todos, and explore schema.
Add new operations to the `.wundergraph/operations` folder and run `npm start` to see the results.
