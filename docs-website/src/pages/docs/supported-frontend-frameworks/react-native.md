---
title: React Native
pageTitle: WunderGraph - React Native
description: WunderGraph is the easiest way to consume GraphQL APIs in React Native.
---

WunderGraph has official support for React Native. You can use the WunderGraph TypeScript client or SWR package to consume WunderGraph APIs in React Native.

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

## Examples of using React Native with WunderGraph

- [Expo + SWR example](/docs/examples/expo-swr)

If you've got any questions,
please [join our Discord community](https://wundergraph.com/discord) or [contact us](https://wundergraph.com/contact/sales).
