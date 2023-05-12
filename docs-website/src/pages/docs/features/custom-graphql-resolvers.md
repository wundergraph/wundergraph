---
title: Custom GraphQL Resolvers
description: WunderGraph allows you to build custom GraphQL Resolvers
---

Sometimes, you don't just want to expose the introspected APIs directly.
This could be the case, e.g. if you're generating an API from a database,
but want to decouple the client-facing API from the database-generated API.

If that's your use case, we've got you covered.
The `wundergraph.server.ts` file allows you to use any graphql-js compatible framework to build custom GraphQL Schemas and Resolvers.

We're automatically injecting useful fields into the Context object of the resolvers,
like the `user`, `clientRequest` and the `operations` client,
allowing you to build really flexible solution.

As WunderGraph took already care of authentication,
you can use the `user` field to access the authenticated user and inject their properties into the resolver.

The `clientRequest` field can be used to access additional headers, sent by the client,
if you'd like to use them in your resolvers.

With the `operations` field, you can internally call into the operations you've already defined.
If you're using a database-generated GraphQL Schema and got some operations defined to talk to the database,
you can use WunderGraph and the operations client as a typesafe ORM.

Below, you'll find two examples,
one using a schema first approach,
the second one using code first.

Both schemas are automatically added to your virtual Graph.

```typescript
// wundergraph.server.ts
export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
  hooks: {
    authentication: {},
    global: {},
    queries: {},
    mutations: {},
  },
  graphqlServers: [
    {
      apiNamespace: 'schemaFirst',
      serverName: 'schemaFirst',
      schema: buildSchema(`
                type Query {
                    hello: String!
                }
            `),
      customResolverFactory: async (ctx) => {
        return {
          hello: () => 'World',
        };
      },
    },
    {
      apiNamespace: 'codeFirst',
      serverName: 'codeFirst',
      enableGraphQLEndpoint: true,
      schema: new GraphQLSchema({
        query: new GraphQLObjectType<any, GraphQLExecutionContext>({
          name: 'Query',
          fields: {
            hello: {
              type: GraphQLString,
              resolve: (obj, args, context, info) => {
                console.log(context.wundergraph.user.name);
                return 'World';
              },
            },
          },
        }),
      }),
    },
  ],
}));
```
