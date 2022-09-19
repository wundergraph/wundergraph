# WunderGraph SWR Integration

![wunderctl](https://img.shields.io/npm/v/@wundergraph/swr.svg)

This package provides a type-safe integration of [SWR](https://swr.vercel.app/) with WunderGraph.
SWR is a React Hooks library for data fetching. With just one hook, you can significantly simplify the data fetching logic in your project. And it also covered in all aspects of speed, correctness, and stability to help you build better experiences.

> **Warning**: Only works with WunderGraph.

## Getting Started

```shell
npm install @wundergraph/swr
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

const { useQuery, useMutation, useSubscription } = createHooks<Operations>(createClient());

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

  const { mutate } = useMutation({
    operationName: 'SetName',
  });
  mutate({
    input: { name },
  });
};
```

## Options

You can use all available options from [SWR](https://swr.vercel.app/docs/options) with the hooks.
Due to the fact that we use the operationName + variables as **key**, you can't use the `key` option as usual.
In order to use [conditional-fetching](https://swr.vercel.app/docs/conditional-fetching) you can use the `enabled` option.
