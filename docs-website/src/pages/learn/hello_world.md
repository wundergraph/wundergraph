---
title: 'Hello World'
tags: []
date: 2022-01-02
description: ''
layout: 'wg_by_example'
---

The very first thing we'll do is to create a simple Hello World application by following the docs.

```shell
npx create-wundergraph-app my-project -E learn-wundergraph \ &&
cd my-project && npm i && npm start
```

This will create a WunderGraph project that uses Next.js as the frontend framework,
so we're able to not just discuss headless API use cases,
but also how to use WunderGraph with a frontend framework.

Once initialized, we can start exploring the project structure.
There's a `.wundergraph` folder in the root that contains all the configuration files for WunderGraph alongside the `pages` directory,
which is where we can find the Next.js pages.

We'll dive into the configuration deeper in the following articles,
but for now, let's have a quick look at how WunderGraph creates an API for us.

First, we add an API dependency to the `wundergraph.config.ts` file,
the main configuration file of WunderGraph.

```typescript
// wundergraph.config.ts
import { introspect, configureWunderGraphApplication } from '@wundergraph/sdk';
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});
configureWunderGraphApplication({
  apis: [spaceX],
});
```

This adds the SpaceX API to our project as an API dependency.
WunderGraph will internally generate a GraphQL Schema from all API dependencies,
more on that later.

For the moment, what we need to understand is that WunderGraph will not automatically expose a GraphQL API.
It's possible, but not the main use case.

Instead, we have to define an "Operation" that will expose a REST-like / JSON-RPC Endpoint.
We have two ways of doing this, either by creating a GraphQL Operation or a TypeScript Operation,
depending on how much control we want to have over the endpoint.

Let's create a simple GraphQL Operation for now.

```graphql
# .wundergraph/operations/Dragons.graphql
query Dragons {
  spacex_dragons {
    name
    active
  }
}
```

Great, we can now call the `/operations/Dragons` endpoint to get a list of all the SpaceX Dragons.

```shell
curl http://localhost:9991/operations/Dragons`
```

The URL of the Operation is derived from the file name and path.
That's enough for a Hello World,
we'll dive deeper in the next articles.
