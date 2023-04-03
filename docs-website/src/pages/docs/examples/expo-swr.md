---
title: Expo + SWR Example
pageTitle: WunderGraph - Examples - Expo + SWR
description:
---

This example shows the bare minimum configuration to get WunderGraph up and running with React Native, using [Expo](https://expo.io/) and [SWR](https://swr.vercel.app/).

## Important

### Package exports

React Native doesn't support the new Node.js exports field yet. Add this configuration in `metro.config.js` to rewrite the paths and make sure WunderGraph is imported correctly.

```js
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    resolveRequest: (context, moduleName, platform) => {
      // React Native doesn't support exports field in package.json, so we resolve it manually.
      if (moduleName.startsWith('@wundergraph/sdk/client')) {
        return context.resolveRequest(context, '@wundergraph/sdk/dist/client', platform);
      }

      if (moduleName.startsWith('@wundergraph/sdk/internal')) {
        return context.resolveRequest(context, '@wundergraph/sdk/dist/internal', platform);
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  },
};
```

### Fetch Api

React Native doesn't fully support the fetch api and therefor isn't fully compatible with our TypeScript client at the moment. To get around this, you can install the following polyfill.

```bash
npm i url-search-params-polyfill
```

And import it somewhere in your project, for example in `App.tsx`.

```
import 'url-search-params-polyfill';
```

### Subscriptions

Subscriptions aren't supported by default either, since web streams and SSE aren't supported in React Native. You can also install a polyfill for this to make it work. Please note this is still experimental and we would love to get your feedback on this.

```bash
npm i event-source-polyfill
```

And import it somewhere in your project, for example in `App.tsx`.

```
import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';
global.EventSource = NativeEventSource || EventSourcePolyfill;
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
