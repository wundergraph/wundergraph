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

## Run Queries from Next.js

```typescript
import { NextPage } from 'next'
import { useQuery } from '../lib/wundergraph'

const Home: NextPage = () => {
  const { data, error } = useQuery({
    // This is allows conditional fetching https://swr.vercel.app/docs/conditional-fetching
    enabled: true,
    operationName: 'Dragons',
  })
  return <div>{JSON.stringify(data)}</div>
}
export default Home
```

## Run Mutations from Next.js

```typescript
import { NextPage } from 'next'
import { useMutation } from '../lib/wundergraph'

const Home: NextPage = () => {
  const { data, error, mutate } = useMutation({
    operationName: 'Dragons',
  })
  const onClick = () => {
    mutate({
      input: {
        name: 'test',
      },
    })
  }
  return (
    <div>
      {JSON.stringify(data)}
      <button onClick={onClick}>Click me</button>
    </div>
  )
}
export default Home
```

## Run Subscriptions from Next.js

> Note: Subscriptions are currently not supported with SSR.

```typescript
import { NextPage } from 'next'
import { useSubscription } from '../lib/wundergraph'

const Home: NextPage = () => {
  const { data, error } = useSubscription({
    operationName: 'Dragons',
    input: {
      name: 'test',
    },
  })
  return <div>{JSON.stringify(data)}</div>
}
export default Home
```

## Authentication from Next.js

```typescript
import { NextPage } from 'next'
// Might differ depending on your output directory
import { AuthProviderId, UserRole } from '../components/generated/client'
import { User } from '@wundergraph/sdk/client'
import { useAuth } from '../lib/wundergraph'

const Home: NextPage = () => {
  const { login, logout } = useAuth()
  const { data, error } = useUser<User<UserRole>>()
  // Conditional fetching
  // const { data, error } = useUser<User<UserRole>>({ enabled: true });
  return (
    <div>
      {JSON.stringify(data)}
      <button onClick={() => login(AuthProviderId.github)}>Login</button>
      <button onClick={() => logout()}>Login</button>
    </div>
  )
}
export default Home
```

## File upload from Next.js

```typescript
import { NextPage } from 'next'
import { useFileUpload } from '../lib/wundergraph'

const Home: NextPage = () => {
  const { upload, data, error } = useFileUpload()
  const onUpload = () => {
    upload({
      files: [new File([''], 'test.txt')],
    })
  }
  return <button onClick={onUpload}>Upload</button>
}
export default Home
```
