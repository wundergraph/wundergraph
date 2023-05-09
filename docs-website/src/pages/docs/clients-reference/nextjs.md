---
title: Next.js Client
pageTitle: WunderGraph - Next.js
description:
---

The Next.js client uses [SWR](/docs/clients-reference/swr) under the hood.

## Installation

```bash
npm i @wundergraph/nextjs swr
```

## Configuration

Add `NextJsTemplate` to your WunderGraph configuration:

```typescript
import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';

// wundergraph.config.ts
configureWunderGraphApplication({
  // ... your config
  generate: {
    codeGenerators: [
      {
        templates: [new NextJsTemplate()],
        path: '../components/generated',
      },
    ],
  },
});
```

## Hooks

### useQuery

This hook accepts most [useSWR Options](https://swr.vercel.app/docs/options) except for key and fetcher.

```typescript
const { data, error, isValidating, isLoading, mutate } = useQuery({
  operationName: 'Weather',
  input: {
    forCity: 'Berlin',
  },
  enabled: true,
});
```

Calling `mutate` will invalidate and refetch the query.

```typescript
const { data, mutate } = useQuery({
  operationName: 'Weather',
  input: {
    forCity: 'Berlin',
  },
});

mutate();
```

### useQuery (Live query)

You can turn any query into a live query by adding the `liveQuery` option.

```typescript
const { data, error, isLoading, isSubscribed, mutate } = useQuery({
  operationName: 'Weather',
  input: {
    forCity: 'Berlin',
  },
  liveQuery: true,
});
```

### useMutation

This hook accepts most [useSWRMutation Options](https://swr.vercel.app/docs/options) except for key and fetcher.

```typescript
const { data, error, trigger } = useMutation({
  operationName: 'SetName',
});

await trigger({
  name: 'test',
});

trigger(
  {
    name: 'test',
  },
  {
    throwOnError: false,
  }
);
```

### useSubscription

```typescript
const { data, error, isLoading, isSubscribed } = useSubscription({
  operationName: 'Weather',
  input: {
    forCity: 'Berlin',
  },
  enabled: true,
  onSuccess(data, key, config) {
    // called when the subscription is established.
  },
  onError(data, key, config) {
    // called when the subscription failed to establish.
  },
});
```

### useAuth

```typescript
const { login, logout } = useAuth();

login('github');

logout({ logoutOpenidConnectProvider: true });
```

### useUser

This hook accepts most [useSWR Options](https://swr.vercel.app/docs/options) except for key and fetcher.

```typescript
const { data, error, isLoading } = useUser();
```

## File upload

This hook accepts most [useSWRMutation Options](https://swr.vercel.app/docs/options) except for key and fetcher.

```typescript
const { upload, data, error } = useFileUpload();

upload(
  {
    provider: 'minio',
    files: [new File([''], 'test.txt')],
  },
  {
    throwOnError: false,
  }
);
```

## SSR

Wrapping the App or Page in `withWunderGraph` will make sure that Server Side Rendering (SSR) works,
that's it.

```typescript
import { NextPage } from 'next';
import { useQuery, withWunderGraph } from '../components/generated/nextjs';

const Home: NextPage = () => {
  const dragons = useQuery({ operationName: 'Dragons' });
  return <div>{JSON.stringify(dragons)}</div>;
};
export default withWunderGraph(Home);
```

## Global Configuration

You can configure the hooks globally by using the [SWRConfig](https://swr.vercel.app/docs/global-configuration) context.

In case the context configuration isn't working, it's likely due to multiple versions of SWR being installed or due to how PNPM or Yarn PnP link packages.
To resolve this you can import SWR directly from `@wundergraph/nextjs` to make sure the same instance is used.

```ts
import { SWRConfig, useSWRConfig } from '@wundergraph/nextjs';
```
