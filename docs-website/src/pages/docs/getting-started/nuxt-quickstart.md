---
title: Nuxt Quickstart
pageTitle: WunderGraph and Nuxt Quickstart
description: Getting started with WunderGraph and Nuxt
---

This quickstart guide will show you how to use WunderGraph with Nuxt and goes into a couple of details like server side rendering and TypeScript operations.

## Creating a new WunderGraph project with Nuxt

We'll use the Nuxt example to get started. This example is a basic Nuxt application that uses WunderGraph to fetch data from the [SpaceX GraphQL API](https://spacex-api.fly.dev/graphql).

```shell
# Init a new project
pnpm dlx create-wundergraph-app my-project --example nuxt

# Move to the project directory
cd my-project

# Install dependencies
pnpm i
```

## Start Nuxt and WunderGraph

```shell
pnpm start
```

WunderGraph will now do some code generation and start the WunderNode and the Nuxt dev server.
A new browser window will open at [http://localhost:3000](http://localhost:3000). You should see the WunderGraph & Nuxt example homepage with the JSON result of the Dragons operation.

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
  generate: {
    codeGenerators: [
      {
        templates: [templates.typescript.client],
        path: './components/generated',
      },
    ],
  },
  // ...
});
```

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

This simply fetches the name and active status of all the SpaceX dragons, we can run this operation in Nuxt by using the generated hooks.

## Calling the operation in Nuxt

Open `pages/index.vue`, there you will find the following code:

```vue
<script setup lang="ts">
const { $wgraph } = useNuxtApp();
const { data, suspense } = $wgraph.useQuery({
  operationName: 'Dragons',
});
await suspense();
</script>
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

```html
<script setup lang="ts">
  const { $wgraph } = useNuxtApp();
  const { data, suspense } = $wgraph.useQuery({
    operationName: 'Dragons',
    input: {
      limit: 1,
    },
  });
  await suspense();
</script>
```

Refresh the page in your browser, the result will look like this:

```json
{
  "data": { "spacex_dragons": [{ "id": "dragon1", "name": "Dragon 1", "active": true }] },
  "isValidating": false,
  "isLoading": false
}
```

## Server side rendering

Wundergrah is configured with vue query in the plugin directory, with hydration of the server side state. This means that you can use the `useQuery` hook in your components and it will automatically fetch the data on the server side and hydrate the client side state.

You can use the Nuxt devtools to inspect the vue-query payload.

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

Open `pages/users/index.vue`

```html
<script setup>
  const {
    $wgraph: { useQuery },
  } = useNuxtApp();

  const { data, suspense } = useQuery({
    operationName: 'users/get',
    input: {
      id: '1',
    },
  });
  await suspense();
</script>
```

You can call TypeScript operations just like Graphql operations, fully type safe. Note that the operation name is `users/get`, this is the path to the operation file, without the extension. We use filebased router for operations, similar to Nuxt pages. This allows you to keep your operations organized.

## What's next?

Wunderbar! You've added your first Graphql API to Nuxt. Next up you might want to add a database, authentication and support uploads to turn Nuxt into a full stack powerhouse 😎.

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
