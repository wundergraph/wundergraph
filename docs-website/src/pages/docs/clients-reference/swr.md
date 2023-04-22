---
title: SWR Client
pageTitle: WunderGraph SWR Client
description: SWR Client reference
---

The SWR Client is our default client for React projects. It's a lightweight wrapper around the [SWR](https://swr.vercel.app/) library from Vercel.

## Installation

> Note: The client depends on SWR version 2.0.0.

```bash
npm i @wundergraph/swr swr
```

## Configuration

Let's start by configuring WunderGraph. We're using `templates.typescript.client` to generate our base client that will be used to create typesafe hooks.

```typescript
// wundergraph.config.ts
configureWunderGraphApplication({
  // ... your configuration
  codeGenerators: [
    {
      templates: [templates.typescript.client],
      path: '../generated',
    },
  ],
});
```

## Create the hooks

WunderGraph comes with a powerful framework for generating code.
Here we are creating fully typed SWR hooks based on the operations of our WunderGraph application.

```ts
// lib/wundergraph.ts
import { createClient, Operations } from '../generated/client';

import { createHooks } from '@wundergraph/swr';

export const client = createClient();

export const { useQuery, useMutation, useSubscription, useUser, useAuth } = createHooks<Operations>(client);
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
