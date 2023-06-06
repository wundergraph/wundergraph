---
title: Vite + React + Relay Example
pageTitle: WunderGraph - Examples - Vite - React - Relay
description:
---

The [Vite + React + Relay example](https://github.com/wundergraph/wundergraph/tree/main/examples/vite-react-relay) demonstrates how to use Relay with a Vite + React based WunderGraph project.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Using WunderGraph

Create the utility functions needed to work with Relay

```ts
// in src/lib/wundergraph/index.ts
export const { WunderGraphRelayProvider, useLiveQuery, fetchWunderGraphSSRQuery } = createWunderGraphRelayApp({
  client,
});
```

Wrap your app component with `WunderGraphRelayProvider`

```tsx
// in src/main.tsx
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WunderGraphRelayProvider>
      <App />
    </WunderGraphRelayProvider>
  </React.StrictMode>
);
```

You can now start using Relay within the project

```tsx
// in src/App.tsx
const [queryReference, loadQuery] = useQueryLoader<AppDragonsQueryType>(AppDragonsQuery);
```

## Learn more about WunderGraph + Relay

To learn more about WunderGraph Relay integration, read our [Quickstart Guide](/docs/getting-started/relay-quickstart)

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=vite-react-relay)
