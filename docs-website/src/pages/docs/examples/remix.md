---
title: Remix Example
description: Integrate WunderGraph with Remix.js
---

[Remix example](https://github.com/wundergraph/wundergraph/tree/main/examples/remix) demonstrates how to integrate WunderGraph with Remix.run.

## Installation

```bash
npx create-wundergraph-app --example remix
```

## Configuration

Let's start by configuring WunderGraph. We will use the SpaceX API as an example.

```typescript
// wundergraph.config.ts
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});

configureWunderGraphApplication({
  apis: [spaceX],
  server,
  operations,
  codeGenerators: [
    {
      templates: [templates.typescript.client],
      path: '../generated',
    },
  ],
});
```

What's notable here is that we're using `templates.typescript.client` to generate our base client that is used by SWR [`@wundergraph/swr`](https://github.com/wundergraph/wundergraph/tree/main/packages/swr) package.

Next up is setting up the client and SWR hooks.

```ts
// lib/wundergraph.ts

import { createClient, Operations } from '../generated/client';

import { createHooks } from '@wundergraph/swr';

export const client = createClient();

export const createClientFromCookies = (request: Request) => {
  const cookieHeader = request.headers.get('Cookie');

  const client = createClient({
    extraHeaders: {
      cookie: cookieHeader ?? '',
    },
  });

  return client;
};

// Use these hooks for any client side operations
export const { useQuery, useMutation, useSubscription, useUser, useAuth } = createHooks<Operations>(client);
```

WunderGraph comes with a powerful framework for generating code.
Here we are creating fully typed SWR hooks based on the operations of our WunderGraph application.

## Define an Operation

```graphql
# .wundergraph/operations/Dragons.graphql
query Dragons {
  spacex_dragons {
    name
    active
  }
}
```

## Run a Query

Fetch data inside a loader, using the WunderGraph client.

```tsx
// app/routes/index.tsx
import { json } from '@remix-run/node';
import { useCatch, useLoaderData } from '@remix-run/react';
import { client } from 'lib/wundergraph';

export const loader = async () => {
  const res = await client.query({
    operationName: 'Dragons',
  });

  if (res.error) {
    throw json(res.error);
  }

  return res.data;
};

export function CatchBoundary() {
  const caught = useCatch();

  return (
    <div>
      <h1>Error!</h1>
      {JSON.stringify(caught)}
    </div>
  );
}

export default function Index() {
  const { spacex_dragons } = useLoaderData<typeof loader>();

  return (
    <code className="p-3" data-testid="result">
      {JSON.stringify(spacex_dragons, null, 2)}
    </code>
  );
}
```

## Learn more

- [@wundergraph/swr reference](/docs/clients-reference/swr)
- [SWR documentation](https://swr.vercel.app/)
- [Remix documentation](https://remix.run)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph backend is to use [WunderGraph Cloud](https://cloud.wundergraph.com). Enable the [Vercel integration](https://vercel.com/integrations/wundergraph) to deploy the Vite frontend to Vercel.

{% deploy template="remix" /%}
