---
title: React Native support
description: WunderGraph is the easiest way to consume GraphQL APIs in React Native.
---

WunderGraph has official support for React Native. You can use the WunderGraph TypeScript client or SWR package to consume WunderGraph APIs in React Native.

## Installation

```bash
npm i @wundergraph/metro-config
```

## Configuration

Add the following to your `metro.config.js`:

```js
// metro.config.js
// Learn more https://docs.expo.io/guides/customizing-metro
const { wgMetroConfig } = require('@wundergraph/metro-config');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = wgMetroConfig(config);
```

## Examples of using React Native with WunderGraph

- [Expo + SWR example](/docs/examples/expo-swr)

If you've got any questions,
please [join our Discord community](https://wundergraph.com/discord) or [contact us](https://wundergraph.com/contact/sales).
