---
title: API Namespacing
pageTitle: WunderGraph - Features - API Namespacing
description:
---

The intention of WunderGraph is to make it possible to access many APIs at once.
To make this seamless, we have to merge all APIs into one single GraphQL Schema.
However, this comes with a problem: Naming collisions!

If we merge two schemas that define different objects using the same name, e.g a "User" type,
we run into a conflict. How should the GraphQL Engine understand which of the two should be resolved?

To solve this issue and making the process of combining multiple APIs as easy as possible,
we've got the concept of namespaces in WunderGraph.

Namespaces give each API a place to live,
where all type names are isolated and no collisions can happen.

This is achieved by prefixing all root fields, the fields on Query, Mutation and Subscription type,
with the namespace. All custom type definition are suffixed with the namespace.
Finally, we also prefix directives. With this approach,
it's still possible to use directives from the origins.

Simply use the prefixed directive, e.g. on a field.
When sending the request to the upstream, the name of the directive is rewritten to match the upstream Schema.
If, after rewriting the name, the directive name exists on the origin schema and is allowed in the location,
it will be sent to the upstream.
If there's a mismatch we simply dismiss it to prevent errors.

## Configuring APIs with namespacing

The configuration for namespaces is straight forward.
When using the `introspect` API of the SDK,
add the `apiNamespace` field.

If you know for sure that two APIs don't collide, and you wish to merge them into the same namespace,
just use the identical name.

```typescript
const federated = introspect.federation({
  apiNamespace: 'federation',
  upstreams: [
    { url: 'http://localhost:4001/graphql' },
    { url: 'http://localhost:4002/graphql' },
    { url: 'http://localhost:4003/graphql' },
    { url: 'http://localhost:4004/graphql' },
  ],
});

const planetscale = introspect.planetscale({
  apiNamespace: 'planetscale',
  databaseURL: `mysql://${planetscaleCredentials}@fwsbiox1njhc.eu-west-3.psdb.cloud/test?sslaccept=strict`,
});

const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});

const postgres = introspect.postgresql({
  apiNamespace: 'postgres',
  databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
});

const jsonPlaceholder = introspect.openApi({
  apiNamespace: 'jsp',
  source: {
    kind: 'file',
    filePath: 'jsonplaceholder.yaml',
  },
});

configureWunderGraphApplication({
  apis: [postgres, spaceX, jsonPlaceholder, planetscale, federated],
});
```

## Querying our namespaced API

Once all our APIs are merged,
we can query our GraphQL Schema using the prefixed root fields.
E.g. if we've put the SpaxeX API into the "spacex" Namespace,
the root field "users" becomes "spacex_users".

```graphql
{
  spacexUsers: spacex_users {
    id
    name
  }
  jspUsers: jsp_users {
    id
    name
    posts {
      id
      title
      comments {
        id
        body
      }
    }
  }
  postgresUsers: postgres_findManyusers {
    id
    email
  }
  planetscaleUsers: planetscale_findManyusers {
    id
    first_name
    last_name
    email
  }
  federation: federation_me {
    id
    name
    reviews {
      id
      body
      product {
        upc
        name
      }
    }
  }
}
```

## Technical Details

You might be asking how all this works which we're happy to share.

WunderGraph maintains N+1 Schemas internally,
one downstream Schema and N upstream schemas.

The downstream Schema is the one accessible to the WunderGraph user,
it uses the prefixed root fields, directives and suffixed type definitions.

The upstream Schemas are the original Schemas for each individual upstream.

Additional, we maintain a mapping table to map all root fields, directives and type definitions.
This mapping table contains all information to be able to "rewrite" the requests, when sending them to the upstreams.
You can see these mappings when you look at `.wundergraph/generated/wundergraph.config.json` in your WunderGraph project.

In this context, "rewrite" means that we take a downstream Operation and rename all fields, directives and types
so that the Operation is compatible to the upstream Schema.
Thanks to our ahead-of-time Query-Compiler, all of this happens at deployment time,
so there's no performance overhead.

Here's a simple example.

Downstream Query:

```graphql
{
  spacex_users {
    id
    name
  }
}
```

Upstream Query:

```graphql
{
  users {
    id
    name
  }
}
```

That's everything there is to know about namespacing.
