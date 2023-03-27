---
title: Hello World Example
pageTitle: WunderGraph - Examples - Hello World
description:
---

The simplest way to explore WunderGraph is to use the "headless" Hello World example.
You can find it in the ["examples" folder of our monorepo](https://github.com/wundergraph/wundergraph/tree/main/examples/simple).

This example shows the bare minimum configuration to get WunderGraph up and running.

## Data source configuration

As the data source, we add a single API, the SpaceX GraphQL API in this case.

```typescript
// wundergraph.config.ts

const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});

configureWunderGraphApplication({
  apis: [spaceX],
});
```

## Operation configuration

Next, we configure a simple Operation.

```graphql
# .wundergraph/operations/Dragons.graphql
query Dragons {
  spacex_dragons {
    name
    active
  }
}
```

## Running the application

Now, we can run the application using `npm run start` and access the generated RPC API.

```bash
curl http://localhost:9991/operations/Dragons
```

## Learn more

- [Guides](/docs/guides)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use WunderGraph Cloud.

{% deploy template="simple" /%}
