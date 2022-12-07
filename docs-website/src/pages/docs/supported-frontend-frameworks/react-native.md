---
title: React Native
pageTitle: WunderGraph - React Native
description: WunderGraph is the easiest way to consume GraphQL APIs in React Native.
---

WunderGraph has official support for React Native. You can use the WunderGraph TypeScript client or SWR package to consume WunderGraph APIs in React Native.

## Important

React Native doesn't fully support the fetch api and therefor isn't fully compatible with our TypeScript client at the moment. To get around this, you can install the following polyfill.

```bash
npm i url-search-params-polyfill
```

And import it somewhere in your project, for example in `App.tsx`.

```
import 'url-search-params-polyfill';
```

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
please join our Discord Community and ask away.
