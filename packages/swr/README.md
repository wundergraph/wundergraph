# WunderGraph SWR Integration

![wunderctl](https://img.shields.io/npm/v/@wundergraph/swr.svg)

This package provides a type-safe integration of [SWR](https://swr.vercel.app/) with WunderGraph.
SWR is a React Hooks library for data fetching. With just one hook, you can significantly simplify the data fetching logic in your project. And it also covered in all aspects of speed, correctness, and stability to help you build better experiences.

> **Warning**: Only works with WunderGraph.

## Getting Started

```shell
npm install @wundergraph/swr swr@2.0.0
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

Now you can use the hooks.

```ts
import { createHooks } from '@wundergraph/swr';
import { createClient, Operations } from './components/generated/client';

const { useQuery, useMutation, useSubscription, useUser, useFileUpload, useAuth } = createHooks<Operations>(
  createClient({ baseURL: 'https://your-wundernode.com', extraHeaders: {}, customFetch: undefined })
);

export const Home: React.FC<{ city: string }> = ({ city }) => {
  const { error, data, isValidating } = useQuery({
    operationName: 'Weather',
    input: { forCity: city },
    liveQuery: true,
  });

  const { data: subData, error: subError } = useSubscription({
    enabled: true,
    operationName: 'Weather',
    input: {
      forCity: 'Berlin',
    },
  });

  const { trigger } = useMutation({
    operationName: 'SetName',
  });
  trigger({ name });

  const { data, error } = useUser();

  const { upload, data, error } = useFileUpload();

  const { login, logout } = useAuth();
};
```

## Options

You can use all available options from [SWR](https://swr.vercel.app/docs/options) with the hooks.
Due to the fact that we use the operationName + variables as **key**, you can't use the `key` option as usual.
In order to use [conditional-fetching](https://swr.vercel.app/docs/conditional-fetching) you can use the `enabled` option.

## Global Configuration

You can configure the hooks globally by using the [SWRConfig](https://swr.vercel.app/docs/global-configuration) context.

In case the context configuration isn't working, it's likely due to multiple versions of SWR being installed.
To resolve this you can import SWRConfig directly from `@wundergraph/swr` to make sure the same instance is used.

```ts
import { SWRConfig, useSWRConfig } from '@wundergraph/swr';
```
