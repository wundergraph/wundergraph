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
