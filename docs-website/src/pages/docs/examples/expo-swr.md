---
title: Expo + SWR Example
pageTitle: WunderGraph - Examples - Expo + SWR
description:
---

This example shows the bare minimum configuration to get WunderGraph up and running with React Native, using [Expo](https://expo.io/) and [SWR](https://swr.vercel.app/).

## Configuration

The example uses `@wundergraph/metro-config` to configure Metro to work with WunderGraph.

```js
// metro.config.js
// Learn more https://docs.expo.io/guides/customizing-metro
const { wgMetroConfig } = require('@wundergraph/metro-config');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = wgMetroConfig(config);
```

## Data source configuration

As the data source, we add a single API, the SpaceX GraphQL API in this case.

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

Now, we can run the application using `npm run start`, this will start WunderGraph and Expo. Use the Expo CLI to choose which device you want to run the app on.

## Learn more

- [Guides](/docs/guides)
- [Expo](https://expo.io/)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use WunderGraph Cloud.

{% deploy template="simple" /%}
