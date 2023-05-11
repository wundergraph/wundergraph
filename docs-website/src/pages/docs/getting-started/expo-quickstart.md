---
title: Expo Quickstart
pageTitle: WunderGraph and Expo Quickstart
description: Getting started with WunderGraph and Expo
---

This quickstart guide will show you how to use WunderGraph with Expo using our SWR client.

## Creating a new WunderGraph project with Expo

We'll use the Expo example to get started. This example is a basic Expo application that uses WunderGraph to fetch data from the [SpaceX GraphQL API](https://spacex-api.fly.dev/graphql).

```shell
# Init a new project
npx create-wundergraph-app my-project --example expo-swr

# Move to the project directory
cd my-project

# Install dependencies
npm i
```

## Start WunderGraph

```shell
npm run wundergraph
```

## Start Expo

```shell
npm run expo
```

WunderGraph will now do some code generation and start the WunderNode and the Expo dev server. Run the IOS or Android simulator to see the app in action.
The app will show the 2 dragons from the SpaceX API.

```json
{
  "data": {
    "spacex_dragons": [
      { "name": "Dragon 1", "active": true },
      { "name": "Dragon 2", "active": true }
    ]
  },
  "isValidating": false,
  "isLoading": false
}
```

## Configure Expo

To make sure WunderGraph can be used in Expo, we need to configure Metro with the WunderGraph Metro config.

Open `metro.config.js` and add the following code:

```js
const { getDefaultConfig } = require('expo/metro-config');
const { wgMetroConfig } = require('@wundergraph/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = wgMetroConfig(defaultConfig);
```

## Configure WunderGraph

WunderGraph lives in the `.wundergraph` directory by default. This is where you can configure your WunderGraph application and write your operations.

Let's take a look at the default configuration open `.wundergraph/wundergraph.config.ts`.

You can see that we have a single API configured, which is the [SpaceX GraphQL API](https://spacex-api.fly.dev/graphql).

```ts
// the name of this const will be supplied to the apis property in the configuration
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});
```

The API is introspected and added to the WunderGraph virtual graph, as you can see here:

```ts
configureWunderGraphApplication({
  // the const defined above is provided in the array of apis here
  apis: [spaceX],
  // ...
  codeGenerators: [
    {
      templates: [templates.typescript.client],
      path: '../src/generated',
    },
  ],
  // ...
});
```

The difference between this configuration and the one in the [1-minute quickstart](/docs/getting-started/quickstart)
is the addition of the TypeScript client to the code generators. This will generate the typesafe client that we need
to set up SWR.

Open `src/lib/wundergraph.ts`, you will see the following code:

```ts
import { createClient, Operations } from '../generated/client';

import { createHooks } from '@wundergraph/swr';

export const client = createClient();

export const { useQuery, useMutation, useSubscription, useUser, useAuth } = createHooks<Operations>(client);
```

We initate the WunderGraph client and create the SWR hooks that we will use in our application.

Now let's take a look at the operations.

## Operations

Operations are written in the `.wundergraph/operations` directory. They can be written in Graphql or TypeScript.
Let's check out the Dragons operation, open `.wundergraph/operations/Dragons.graphql`.

```graphql
query Dragons {
  spacex_dragons {
    name
    active
  }
}
```

This simply fetches the name and active status of all the SpaceX dragons, we can run this operation in Expo by using the SWR hooks.

## Calling the operation in Expo

Open `App.tsx`, there you will find the following code:

```tsx
const { data, isLoading, error } = useQuery({
  operationName: 'Dragons',
});
```

The operation name is the name of the file in the operations directory, without the extension. The `useQuery` hook will return the result of the operation.

Let's modify the Dragons operation and add a limit parameter and return extra fields.
Open `.wundergraph/operations/Dragons.graphql` and change it to:

```graphql
query Dragons($limit: Int!) {
  spacex_dragons(limit: $limit) {
    id
    name
    active
  }
}
```

The WunderGraph server will automatically pick up on the changes and re-generate the types.
Go back to `pages/index.tsx` and you will see that the `Dragons` operation now has a required `limit` input parameter.

```tsx
const { data, isLoading, error } = useQuery({
  operationName: 'Dragons',
  input: {
    limit: 1,
  },
});
```

Press `R` to restart the app, you will now see that only 1 dragon is rendered.

## TypeScript Operations

WunderGraph allows you to write your operation using TypeScript. TypeScript Operations are a great way to use WunderGraph as a fully featured backend framework. Let's find out how to write a TypeScript operation.

Open `.wundergraph/operations/users/get.ts`

```ts
import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
  input: z.object({
    id: z.string(),
  }),
  handler: async ({ input }) => {
    return {
      id: input.id,
      name: 'Jens',
      bio: 'Founder of WunderGraph',
    };
  },
});
```

This operation will return a user with the given id. We simply return a plain object here, but you can also return a database model or any other data type. We're using Zod to create the input schema, this will make sure that the input is validated before it reaches the handler.

Open `src/components/users/User.tsx`

```tsx
const { data } = useQuery({
  operationName: 'users/get',
  input: {
    id: '1',
  },
});
```

You can call TypeScript operations just like Graphql operations, fully type safe. Note that the operation name is `users/get`, this is the path to the operation file, without the extension. We use filebased routing for operations, this allows you to keep your operations organized.

## What's next?

Wunderbar! You've added your first Graphql API to Expo. Next up you might want to add a database, authentication and support uploads in your app.

- [Databases](/docs/databases)
- [Authentication](/docs/auth)
- [File Storage](/docs/storage)

### Guides

Learn more advanced topics in our [guides](/docs/guides) and get comfortable with WunderGraph.

### More Examples

Have a look at [other examples](/docs/examples) we provide, to get a better understanding of WunderGraph.

### Want to know more about WunderGraph?

If you're not yet sure what kind of problems WunderGraph can solve for you,
check out [the different use cases](/docs/use-cases) we support,
and the different [features](/docs/features) we provide.
You might also be interested to learn more about the [architecture](/docs/architecture) of WunderGraph.
If you haven't read our [Manifesto](/manifesto) yet, it's a great way to better understand what we're working on and why.

If you've got questions, please [join our Discord community](https://wundergraph.com/discord) or [contact us](https://wundergraph.com/contact/sales).
