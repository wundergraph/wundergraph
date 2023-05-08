# WunderGraph Metro Config

![wunderctl](https://img.shields.io/npm/v/@wundergraph/expo.svg)

Official WunderGraph Metro Config for React Native and Expo.

## Getting Started

```shell
npm install @wundergraph/metro-config
```

## Configuration

### metro.config.js

```typescript
// Learn more https://docs.expo.io/guides/customizing-metro
const { wgMetroConfig } = require('@wundergraph/metro-config');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = wgMetroConfig(config);
```

## Advanced

In case you have a custom Metro transformer configured, you can import the WunderGraph transformer and add it to your custom transformer.

```typescript
// custom-transformer.js
const { transform } = require('@wundergraph/metro-config/transformer');

module.exports = {
  transform(file) {
    // custom transforms

    return transform(file);
  },
};
```

## Usage

After configuration the metro config you can use [`@wundergraph/swr`](https://docs.wundergraph.com/docs/clients-reference/swr) or [`@wundergraph/react-query`](https://docs.wundergraph.com/docs/clients-reference/react-query) in your React Native or Expo project.
