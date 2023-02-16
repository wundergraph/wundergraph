# WunderGraph Solid Query Integration

![wunderctl](https://img.shields.io/npm/v/@wundergraph/solid-query.svg)

This package provides a type-safe integration of [Solid Query](https://tanstack.com/query/v4/docs/solid/overview) with WunderGraph.
Solid Query is a data fetching library for Solid.js.

> **Warning**: Only works with WunderGraph.

## Getting Started

```shell
npm install @wundergraph/solid-query @tanstack/solid-query
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
import { createHooks } from '@wundergraph/solid-query';
import { createClient, Operations } from './components/generated/client';

const client = createClient(); // Typesafe WunderGraph client

export const { createQuery, createMutation, createSubscription, createFileUpload, useUser, useAuth } =
  createHooks<Operations>(client);
```

In your `App.tsx` add QueryClientProvider:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';

const queryClient = new QueryClient();

export default App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>...</div>
    </QueryClientProvider>
  );
}
```

Now you can use the hooks in your components:

### createQuery

```ts
const weather = createQuery({
  operationName: 'Weather',
  input: { forCity: city },
});
```

### createQuery (Live query)

```ts
const weather = createQuery({
  operationName: 'Weather',
  input: { forCity: city },
  liveQuery: true,
});
```

### createSubscription

```ts
const weather = createSubscription({
  operationName: 'LiveWeather',
  input: {
    forCity: 'Berlin',
  },
});
```

### createMutation

```ts
const mutation = createMutation({
  operationName: 'SetName',
});

mutation.mutate({ name: 'WunderGraph' });

await mutation.mutateAsync({ name: 'WunderGraph' });
```

### createFileUpload

```ts
const uploader = useFileUpload();

uploader.upload({
  provider: 'minio',
  files: new FileList(),
});

await uploader.upload({
  provider: 'minio',
  files: new FileList(),
});

uploader.fileKeys; // files that have been uploaded
```

### useAuth

```ts
const { login, logout } = useAuth();

login('github');

logout({ logoutOpenidConnectProvider: true });
```

### useUser

```ts
const user = useUser();

user.data;
```

### queryKey

You can use the `queryKey` helper function to create a unique key for the query in a typesafe way. This is useful if you want to invalidate the query after mutating.

```ts
const queryClient = useQueryClient();

const mutation = useMutation({
  operationName: 'SetName',
  onSuccess() {
    queryClient.invalidateQueries(queryKey({ operationName: 'Profile' }));
  },
});

mutation.mutate({ name: 'WunderGraph' });
```

## Options

You can use all available options from [Solid Query](https://tanstack.com/query/v4/docs/solid/overview).
