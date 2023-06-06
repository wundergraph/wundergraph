---
title: 'WunderGraph for Frontend Developers'
tags: []
date: 2023-04-09
description: 'Why you should use WunderGraph as a Frontend Developer'
hideTableOfContents: true
fullWidthContent: true
---

There are two dominant ways of integrating APIs as a Frontend Developer.

1. You manually integrate against all the services in the Frontend
   1. This creates a 1:n dependency
   2. Infinite amounts of boilerplate
   3. Unmaintainable, untraceable, impossible to get analytics
   4. Insecure because you cannot store secrets in the Frontend
2. You integrate with a Backend for Frontend.
   1. For security reasons, this is often your only choice
   2. Now you rely on a Backend Developer to write and maintain the BFF for you, this requires coordination and will block you when changes are needed
   3. The BFF adds complexity to your stack
   4. Frameworks like NextJS allow you to define API routes, but there’s no concept of API Composition. The integration glue-code is all on you.

The second option is probably the most common due to security reasons, but it comes at a cost.
With WunderGraph, we can simplify this problem.
Thanks to the API Composition paradigm, you can create your own BFF with almost no code.

1. Add your API dependencies, as simple as npm install
2. Define your Operations
3. Use the generated type-safe client to connect Frontend & BFF

## Benefits of using WunderGraph as a Frontend Developer

- No more 1:n dependencies, a simple 1:1 dependency between Frontend and BFF
- Zero boilerplate
- Out of the box tracing & analytics across all APIs, thanks to the Composition into one single unified API layer
- Secure, because we’re using a BFF that can hide secrets from the Frontend and handles Authentication & Authorization
- No dependency on a backend developer, you can manage the BFF on your own
- Almost no added complexity as 95% of your BFF is configuration and generated code
- You don’t need to manually write glue code. The API Composition paradigm generates one unified API layer across all your API dependencies.

## Examples for Frontend Developers

### Configure your Datasource

WunderGraph supports multiple datasources, for this example we'll use PostgreSQL with Next.js.
This could be your own database, or managed by Neon.tech or Supabase.

```ts {% filename="wundergraph.config.ts" %}
import { configureWunderGraphApplication, introspect, authProviders, EnvironmentVariable } from '@wundergraph/sdk';
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';
import operations from './wundergraph.operations';
import server from './wundergraph.server';

const pg = introspect.postgresql({
  apiNamespace: 'pg',
  databaseURL: new EnvironmentVariable('PG_DATABASE_URL'),
});

configureWunderGraphApplication({
  apis: [pg],
  server,
  operations,
  generate: {
    codeGenerators: [
      {
        templates: [new NextJSTemplate()],
        path: '../web/components/generated',
      },
    ],
  },
});
```

### Write your operations

You can use GraphQL to query your database or write TypeScript operations if you need to do more complex things, like transforming data.

Note that the `pg_` prefix is the namespace that we configured for the Postgres datasource.

```ts {% filename="operations/user.graphql" %}
query ($id: String!) {
  user: pg_findFirstUser(where: { id: { equals: $id } }) {
    id
    email
    name
    bio
  }
}
```

### Fetch the operation in your Frontend

We can now use the generated client to fetch the operation in Next.js.

```ts {% filename="pages/users/[id].tsx" %}
import { useQuery, withWunderGraph } from '~/generated/nextjs';
import { useRouter } from 'next/router';

function ProfilePage() {
  const router = useRouter();
  const { data, error, isLoading } = useQuery({
    operationName: 'GetUser',
    input: {
      id: router.query.id,
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data.user) {
    return <div>User not found</div>;
  }

  return (
    <div>
      <h1>{data.user.name}</h1>
      <p>{data.user.email}</p>
    </div>
  );
}

// This enables SSR for the page, you can add this to _app.tsx to enable SSR for all pages.
export default withWunderGraph(ProfilePage);
```

## Learn more

- [Next.js Example](/docs/examples/nextjs)
- [WunderGraph Configuration reference](/docs/wundergraph-reference)
