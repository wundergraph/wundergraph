---
title: Vite + SWR
pageTitle: WunderGraph - Examples - Vite - SWR
description:
---

[Vite + SWR example](https://github.com/wundergraph/wundergraph/tree/main/examples/vite-swr) demonstrates the power of
code generation,
when it comes to integrating WunderGraph with data fetching libraries like [SWR](https://swr.vercel.app/).

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

What's notable here is that we're using `templates.typescript.client` to generate our base client that is used by SWR [`@wundergraph/swr`](https://github.com/wundergraph/wundergraph/tree/main/packages/swr) package.

Next up is setting up the SWR hooks.

```ts
// lib/wundergraph.ts

import { createClient, Operations } from '../generated/client';

import { createHooks } from '@wundergraph/swr';

export const client = createClient();

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

```typescript
import { useQuery } from '../lib/wundergraph';

const App = () => {
  const { data, error } = useQuery({
    // This is allows conditional fetching https://swr.vercel.app/docs/conditional-fetching
    enabled: true,
    operationName: 'Dragons',
  });
  return <div>{JSON.stringify(data)}</div>;
};
export default App;
```

## Run a LiveQuery

```typescript
import { useQuery } from '../lib/wundergraph';

const App = () => {
  const { data, error } = useQuery({
    operationName: 'Dragons',
    liveQuery: true,
  });
  return <div>{JSON.stringify(data)}</div>;
};
export default App;
```

## Run Mutations

```typescript
import { useMutation } from '../lib/wundergraph';

const App = () => {
  const { data, error, trigger } = useMutation({
    operationName: 'Dragons',
  });
  const onClick = () => {
    trigger({
      name: 'test',
    });
  };
  return (
    <div>
      {JSON.stringify(data)}
      <button onClick={onClick}>Click me</button>
    </div>
  );
};
export default App;
```

## Run Subscriptions

```typescript
import { useSubscription } from '../lib/wundergraph';

const App = () => {
  const { data, error } = useSubscription({
    operationName: 'Dragons',
  });
  return <div>{JSON.stringify(data)}</div>;
};
export default App;
```

## Authentication

> Note: Logout() will trigger a refetch of the user.

```typescript
import { useAuth, useUser } from '../lib/wundergraph';

const App = () => {
  const { login, logout } = useAuth();
  const { data, error } = useUser();
  // Conditional fetching
  // const { data, error } = useUser({ enabled: true });
  return (
    <div>
      {JSON.stringify(data)}
      <button onClick={() => login('github')}>Login</button>
      <button onClick={() => logout()}>Login</button>
    </div>
  );
};
export default App;
```

## File upload

```typescript
import { useFileUpload } from '../lib/wundergraph';

const App = () => {
  const { upload, data, error } = useFileUpload();
  const onUpload = () => {
    upload({
      files: [new File([''], 'test.txt')],
    });
  };
  return (
    <div>
      {JSON.stringify(data)}
      <button onClick={onUpload}>Upload</button>
    </div>
  );
};
export default App;
```

## Global Configuration

You can configure the hooks globally by using the [SWRConfig](https://swr.vercel.app/docs/global-configuration) context.

In case the context configuration isn't working, it's likely due to multiple versions of SWR being installed or due to how PNPM or Yarn PnP link packages.
To resolve this you can import SWR directly from `@wundergraph/swr` to make sure the same instance is used.

```ts
import { SWRConfig, useSWRConfig } from '@wundergraph/swr';
```

## Learn more

- [@wundergraph/swr reference](/docs/clients-reference/swr)
- [SWR documentation](https://swr.vercel.app/)
- [Vite documentation](https://vitejs.dev)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use [WunderGraph Cloud](https://cloud.wundergraph.com). Enable the [Vercel integration](https://vercel.com/integrations/wundergraph) to deploy the Vite frontend to Vercel.

{% deploy template="vite-swr" /%}
