---
title: Vite + Solid.js
pageTitle: WunderGraph - Examples - Vite - Solid.js
description:
---

[Vite + Solid.js example](https://github.com/wundergraph/wundergraph/tree/main/examples/vite-solidjs) demonstrates how to use WunderGraph with [Solid.js](https://www.solidjs.com/). It uses [Solid Query](https://tanstack.com/query/v4/docs/solid/overview) for data fetching.

## Configuration

Let's start by configuring WunderGraph.

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

What's notable here is that we're using `templates.typescript.client` to generate our base client that is used by Solid Query [`@wundergraph/solid-query`](https://github.com/wundergraph/wundergraph/tree/main/packages/solid-query) package.

Next up is setting up the Solid Query hooks.

```ts
// lib/wundergraph.ts
import { createClient, Operations } from '../generated/client';
import { createHooks } from '@wundergraph/solid-query';

export const client = createClient();

export const { createQuery, createMutation, createSubscription, useUser, useAuth } = createHooks<Operations>(client);
```

WunderGraph comes with a powerful framework for generating code.
Here we are creating fully typed Solid Query hooks based on the operations of our WunderGraph application.

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

```typescript
import { createQuery } from '../lib/wundergraph';

const App = () => {
  const dragons = createQuery({
    operationName: 'Dragons',
  });
  return <div>{JSON.stringify(dragons.data)}</div>;
};
export default App;
```

## Run a LiveQuery

```typescript
import { createQuery } from '../lib/wundergraph';

const App = () => {
  const dragons = createQuery({
    operationName: 'Dragons',
    liveQuery: true,
  });
  return <div>{JSON.stringify(dragons.data)}</div>;
};
export default App;
```

## Learn more

- [WunderGraph Solid client reference](/docs/clients-reference/solid-query)
- [Solid Query documentation](https://tanstack.com/query/v4/docs/solid/overview)
- [Solid.js documentation](https://www.solidjs.com/)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use [WunderGraph Cloud](https://cloud.wundergraph.com). Enable the [Vercel integration](https://vercel.com/integrations/wundergraph) to deploy the Vite frontend to Vercel.

{% deploy template="vite-solidjs" /%}
