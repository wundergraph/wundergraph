# WunderGraph Vue Query Integration

![wunderctl](https://img.shields.io/npm/v/@wundergraph/vue-query.svg)

This package provides a type-safe integration of [Vue Query](https://tanstack.com/query/v4/docs/vue/overview) with WunderGraph.
Vue Query is a data fetching library for Vue. With just one hook, you can significantly simplify the data fetching logic in your project. And it also covered in all aspects of speed, correctness, and stability to help you build better experiences.

> **Warning**: Only works with WunderGraph.

## Getting Started

```shell
npm install @wundergraph/vue-query @tanstack/vue-query
```

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

Second, run `wunderctl generate` to generate the code.

Now you can configure the hooks. Create a new file, for example `lib/wundergraph.ts` and add the following code:

```ts
import { createHooks } from '@wundergraph/vue-query';
import { createClient, Operations } from './components/generated/client';

const client = createClient(); // Typesafe WunderGraph client

export const { useQuery, useMutation, useSubscription, useUser, useFileUpload, useAuth } =
  createHooks<Operations>(client);
```

Finally, register Vue-Query :

```ts
import { createApp } from 'vue';
import App from './App.vue';

import { VueQueryPlugin } from '@tanstack/vue-query';
const app = createApp(App);
app.use(VueQueryPlugin);
app.mount('#app');
```

For Nuxt and SSR, refer to the [vue-query documentation](https://tanstack.com/query/v4/docs/vue/overview#ssr-support).
For Nuxt, you can register vue query and provide the client in the same plugin, like in the example.

Now you can use the hooks in your componentss:

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
const { upload, uploadAsync, data: fileKeys, error } = useFileUpload();

upload({
  provider: 'minio',
  files: new FileList(),
});

await upload({
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
