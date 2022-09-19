---
title: Next.js + SWR Example
pageTitle: WunderGraph - Examples - Next.js - SWR
description:
---

[The Next.js + SWR example](https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs-swr) demonstrates the power of
code generation,
when it comes to integrating WunderGraph with data fetching libraries like [SWR](https://swr.vercel.app/).

## Configuration

Let's start by configuring WunderGraph.

```typescript
// wundergraph.config.ts
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://api.spacex.land/graphql/',
})

const myApplication = new Application({
  name: 'app',
  apis: [spaceX],
})

configureWunderGraphApplication({
  application: myApplication,
  server,
  operations,
  codeGenerators: [
    {
      templates: [templates.typescript.client],
      path: '../components/generated',
    },
  ],
})
```

What's notable here is that we're using `templates.typescript.client` to generate our base client that is used by SWR [`@wundergraph/swr`](https://github.com/wundergraph/wundergraph/tree/main/packages/swr) package.

Next up is setting up the SWR hooks.

```ts
// lib/wundergraph.ts

import { createClient, Operations } from '../components/generated/client'

import { createHooks } from '@wundergraph/swr'

export const client = createClient()

export const { useQuery, useMutation, useSubscription } =
  createHooks<Operations>(client)
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

## Use from Next.js

```typescript
import { NextPage } from 'next'
import { withWunderGraph } from '../components/generated/nextjs'
import { client, useQuery } from '../lib/wundergraph'

const Home: NextPage = () => {
  const dragons = useQuery({
    operationName: 'Dragons',
  })
  return <div>{JSON.stringify(dragons)}</div>
}
export default Home
```

Your operations will be compiled into RPC endpoints.
The template will generate the NextJS client and types for the SWR hooks,
so all you have to do is to import he `useQuery` hook and call your newly created API.
