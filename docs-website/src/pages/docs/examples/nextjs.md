---
title: Next.js Example
pageTitle: WunderGraph - Examples - Next.js
description:
---

[The NextJS example](https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs) demonstrates the power of
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

configureWunderGraphApplication({
  apis: [spaceX],
  server,
  operations,
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

What's notable here is that we're using the `NextJsTemplate` to generate a Next.js client.

WunderGraph comes with a powerful framework for generating code.
In this case, we're generating a TypeScript client,
wrapped with React Hooks and an "App" wrapper to enable Server Side Rendering (SSR) out of the box.

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

## Use from Next.js

```typescript
import { NextPage } from 'next';
import { useQuery, withWunderGraph } from '../components/generated/nextjs';

const Home: NextPage = () => {
  const dragons = useQuery({ operationName: 'Dragons' });
  return <div>{JSON.stringify(dragons)}</div>;
};
export default withWunderGraph(Home);
```

Your operations will be compiled into RPC endpoints.
The template will generate the NextJS client,
so all you have to do is to import the `useQuery` hook and call your newly created API.

Wrapping the Page in `withWunderGraph` will make sure that Server Side Rendering (SSR) works,
that's it.

## Learn more

- [Guides](/docs/guides)
- [Next.js client documentation](/docs/clients-reference/nextjs)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use [WunderGraph Cloud](https://cloud.wundergraph.com). Enable the [Vercel integration](https://vercel.com/integrations/wundergraph) to deploy the Next.js frontend to Vercel.

{% deploy template="nextjs" /%}
