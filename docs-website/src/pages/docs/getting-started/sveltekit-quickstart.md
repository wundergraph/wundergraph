---
title: SvelteKit Quickstart
pageTitle: WunderGraph and SvelteKit Quickstart
description: Getting started with WunderGraph and SvelteKit
---

This quickstart guide will show you how to use WunderGraph with SvelteKit and goes into a couple of details like server side rendering and TypeScript operations.

## Creating a new WunderGraph project with SvelteKit

We'll use the SvelteKit example to get started. This example is a basic SvelteKit application that uses WunderGraph to fetch data from the [SpaceX GraphQL API](https://spacex-api.fly.dev/graphql).

```shell
# Init a new project
npx create-wundergraph-app my-project --example sveltekit

# Move to the project directory
cd my-project

# Install dependencies
npm i
```

## Start SvelteKit and WunderGraph

```shell
npm start
```

WunderGraph will now do some code generation and start the WunderNode and the SvelteKit dev server.
A new browser window will open at [http://localhost:3000](http://localhost:3000). You should see the WunderGraph & SvelteKit example homepage with the JSON result of the Dragons operation.

```json
{
  "data": {
    "spacex_dragons": [
      { "name": "Dragon 1", "active": true },
      { "name": "Dragon 2", "active": true }
    ]
  }
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
  // ...
  codeGenerators: [
    {
      templates: [...templates.typescript.all],
      path: '../src/lib/.wundergraph/generated',
    },
  ],
  // ...
});
```

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

This simply fetches the name and active status of all the SpaceX dragons.

## Calling the operation in SvelteKit

Open `src/routes/Dragons.svelte`, there you will find the following code:

```ts
import { createQuery } from '../lib/wundergraph/wundergraph';

const dragonsQuery = createQuery({
  operationName: 'Dragons',
});
```

The operation name is the name of the file in the operations directory, without the extension. The `createQuery` function will return the result of the operation.

```svelte
<div class="results">
  {#if $dragonsQuery.isLoading}
    <p>Loading...</p>
  {:else if $dragonsQuery.error}
    <pre>Error: {JSON.stringify($dragonsQuery.error, null, 2)}</pre>
  {:else}
    <pre>{JSON.stringify($dragonsQuery.data, null, 2)}</pre>
  {/if}
</div>
```

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
Go back to `src/routes/Dragons.svelte` and you will see that the `Dragons` operation now has a required `limit` input parameter.

```ts
const dragons = createQuery({
  operationName: 'Dragons',
  input: {
    limit: 1,
  },
});
```

Refresh the page in your browser, the result will look like this:

```json
{
  "data": { "spacex_dragons": [{ "id": "dragon1", "name": "Dragon 1", "active": true }] },
  "isValidating": false,
  "isLoading": false
}
```
