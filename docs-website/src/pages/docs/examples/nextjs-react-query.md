---
title: Next.js + React Query Example
pageTitle: WunderGraph - Examples - Next.js - React Query
description:
---

[The NextJS example](https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs-react-query) demonstrates the power of
code generation,
when it comes to integrating WunderGraph with frontend frameworks like Next.js.

## Configuration

Let's start by configuring WunderGraph.

```typescript
// wundergraph.config.ts
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});

const myApplication = new Application({
  name: 'app',
  apis: [spaceX],
});

configureWunderGraphApplication({
  application: myApplication,
  server,
  operations,
  generate: {
    codeGenerators: [
      {
        templates: [templates.typescript.client],
        path: './components/generated',
      },
    ],
  },
});
```

What's notable here is that we're using `templates.typescript.client` to generate our base client that is used by the React Query [`@wundergraph/react-query`](https://github.com/wundergraph/wundergraph/tree/main/packages/react-query) package.

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

## Install the React Query Client

```bash
npm i @wundergraph/react-query @tanstack/react-query
```

Next up is setting up the React Query hooks.

Create a new `.ts` file for example `lib/wundergraph.ts` and add the following code:

```ts
import { createClient, Operations } from '../components/generated/client';

import { createHooks } from '@wundergraph/react-query';

export const client = createClient();

export const { useQuery, useMutation, useSubscription, useUser, useAuth, queryKey } = createHooks<Operations>(client);
```

## Configure your App

```ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
```

## Running the Operation

Now we're ready to run the operation. Edit `pages/index.tsx` and add the following code:

```typescript
import { NextPage } from 'next';
import { useQuery } from '../lib/wundergraph';

export default function Home() {
  const dragons = useQuery({ operationName: 'Dragons' });
  return <div>{JSON.stringify(dragons.data)}</div>;
}
```

That's it! You can now run the example with `npm run dev` and see the result in your browser.

## Learn more

- [@wundergraph/react-query reference](/docs/clients-reference/react-query)
- [React Query documentation](https://tanstack.com/query/v4/docs/overview)
- [Next.js client documentation](/docs/clients-reference/nextjs)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use [WunderGraph Cloud](https://cloud.wundergraph.com). Enable the [Vercel integration](https://vercel.com/integrations/wundergraph) to deploy the Next.js frontend to Vercel.

{% deploy template="nextjs-react-query" /%}
