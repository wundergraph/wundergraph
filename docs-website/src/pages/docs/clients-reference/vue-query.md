---
title: Vue Query client
description: Reference documentation for the Vue Query client.
---

This package provides a type-safe integration of [Vue Query](https://tanstack.com/query/v4/docs/vue/overview) with WunderGraph.
Vue Query is a data fetching library for Vue. With just one hook, you can significantly simplify the data fetching logic in your project. And it also covered in all aspects of speed, correctness, and stability to help you build better experiences.

## Installation

```shell
npm install @wundergraph/vue-query @tanstack/vue-query
```

## Configuration

Before you can use the hooks, you need to modify your code generation to include the base typescript client.

```typescript
// wundergraph.config.ts
configureWunderGraphApplication({
  // ... omitted for brevity
  codeGenerators: [
    {
      templates: [templates.typescript.client],
      // the location where you want to generate the client
      path: '../src/components/generated',
    },
  ],
});
```

Now you can configure the hooks. Create a new file, for example `lib/wundergraph.ts` and add the following code:

```ts
import { createHooks } from '@wundergraph/vue-query';
import { createClient, Operations } from './components/generated/client';

const client = createClient(); // Typesafe WunderGraph client

export const { useQuery, useMutation, useSubscription, useUser, useFileUpload, useAuth, queryKey } =
  createHooks<Operations>(client);
```

In your `main.ts` register your the vue-query plugin:

```ts
import { createApp } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';

import App from './App.vue';

const app = createApp(App);
app.use(VueQueryPlugin);
app.mount('#app');
```

## Usage

Now you can use the hooks in your components:

### useQuery

```ts
const { data, error, isLoading } = useQuery({
  operationName: 'Weather',
  input: { forCity: city },
});
```

### useQuery (Live query)

```ts
const { data, error, isLoading, isSubscribed } = useQuery({
  operationName: 'Weather',
  input: { forCity: city },
  liveQuery: true,
});
```

### useSubscription

```ts
const { data, error, isLoading, isSubscribed } = useSubscription({
  operationName: 'Weather',
  input: {
    forCity: 'Berlin',
  },
});
```

### useMutation

```ts
const { data, mutate, mutateAsync } = useMutation({
  operationName: 'SetName',
});

mutate({ name: 'WunderGraph' });

await mutateAsync({ name: 'WunderGraph' });
```

### useFileUpload

```ts
const { upload, data: fileKeys, error } = useFileUpload();

upload({
  provider: 'minio',
  files: new FileList(),
});
```

### useAuth

```ts
const { login, logout } = useAuth();

login('github');

logout({ logoutOpenidConnectProvider: true });
```

### useUser

```ts
const { data: user, error } = useUser();
```

### queryKey

You can use the `queryKey` helper function to create a unique key for the query in a typesafe way. This is useful if you want to invalidate the query after mutating.

```ts
const queryClient = useQueryClient();

const { mutate, mutateAsync } = useMutation({
  operationName: 'SetName',
  onSuccess() {
    queryClient.invalidateQueries(queryKey({ operationName: 'Profile' }));
  },
});

mutate({ name: 'WunderGraph' });
```

## Options

You can use all available options from [Vue Query](https://tanstack.com/query/v4/docs/vue/reference/useQuery) with the hooks.
