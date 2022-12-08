# WunderGraph Expo Example

This example shows the bare minimum configuration to get WunderGraph up and running with React Native, using Expo and SWR.

## Getting started

```shell
npm install && npm start
```

Use the Expo CLI to choose which device you want to run the app on.

### Android Development

In case you get a blank screen or errors out, chances are your device/emulator is not able to communicate with the node running on localhost:9991.
To fix this run

```bash
adb reverse tcp:9991 tcp:9991
```

To undo

```bash
adb reverse --remove tcp:9991
```

## Important compatibility notes

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
