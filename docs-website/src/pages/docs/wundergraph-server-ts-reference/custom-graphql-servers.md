---
title: Custom GraphQL Servers
pageTitle: WunderGraph - Custom GraphQL Servers
description:
---

The Custom GraphQL Servers feature allows you to extend your Virtual Graph with any graphql-js compatible GraphQL server implementation.

We'll show you two examples,
one using the "code-first" approach,
the second one using "schema-first",
but you are free to use any GraphQL library you want.

When defining a custom GraphQL server,
it's automatically added to the Virtual Graph.
This means, it's automatically protected by WunderGraph.

If you have existing GraphQL server implementations,
this feature is a great way to migrate to WunderGraph,
as you don't have to start from scratch.

## Injected Context with user information

One benefit of adding your GraphQL server in `wundergraph.server.ts` as a custom GraphQL server is that WunderGraph automatically injects the request context into the resolvers.
If you'd like to implement a resolver that requires the `email` or `name` of the user,
this information is available in the context.

The entrypoint to the WunderGraph Context is `ctx.wundergraph`.
Available properties are:

- `ctx.wundergraph.user`: The user information, if the user is authenticated
- `ctx.wundergraph.log`: The logger instance
- `ctx.wundergraph.clientRequest`: The original client request, including headers
- `ctx.wundergraph.operations`: The operations client, used to call other (internal) operations
- `ctx.wundergraph.internalClient`: The internal WunderGraph client, _deprecated_

The internal client is very powerful, as it allows you to call all defined WunderGraph Operations.
E.g. if you've connected WunderGraph to a database and defined a few "internal" Operations,
you're able to call these from the GraphQL resolvers.

## Schema-first Example

```typescript
// wundergraph.server.ts
import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { GraphQLExecutionContext } from './generated/wundergraph.server';
import {
  buildSchema,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
} from 'graphql';

export default configureWunderGraphServer(() => ({
  graphqlServers: [
    {
      apiNamespace: 'sdl',
      serverName: 'sdl',
      schema: buildSchema(`
                type Query {
                    hello: String!
                }
            `),
      customResolverFactory: async () => {
        return {
          hello: (args: any, ctx: GraphQLExecutionContext) => {
            return `Hello ${ctx.wundergraph.user?.name || 'World'}`;
          },
        };
      },
    },
  ],
}));
```

## Code-first Example

```typescript
// wundergraph.server.ts
import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { GraphQLExecutionContext } from './generated/wundergraph.server';
import {
  buildSchema,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
} from 'graphql';

export default configureWunderGraphServer(() => ({
  graphqlServers: [
    {
      apiNamespace: 'public',
      serverName: 'public',
      enableGraphQLEndpoint: true,
      schema: new GraphQLSchema({
        query: new GraphQLObjectType<any, GraphQLExecutionContext>({
          name: 'Query',
          fields: {
            hello: {
              type: GraphQLString,
              resolve: (args: any, ctx: GraphQLExecutionContext) => {
                return `Hello ${ctx.wundergraph.user?.name || 'World'}`;
              },
            },
          },
        }),
      }),
    },
  ],
}));
```

## Namespacing

When defining a custom GraphQL server,
you can specify a `serverName` to distinguish it from other servers,
and an `apiNamespace` which will be used to prefix the Schema when adding it to the Virtual Graph.

Using a custom GraphQL Server with the API Namespacing feature can actually be a very powerful pattern.
You can create a `public` namespace for the client facing API,
and leave all API dependencies in other namespaces.

This way, you'll always have a layer of abstraction between the client and the origins.
Having a `public` GraphQL Schema in the middle will allow you to change "private" API dependencies without having to change the client.

## Conclusion

You've learned that it's easy to extend your GraphQL Schema with your own custom resolvers.
Your custom GraphQL server is automatically protected,
and you've got access to the WunderGraph Context.
That's probably everything you need to add custom business logic to your WunderGraph applications.
