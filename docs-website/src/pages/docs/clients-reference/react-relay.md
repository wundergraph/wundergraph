---
title: React Relay client
description: Reference documentation for the WunderGraph React Relay client.
---

# WunderGraph Relay Integration

![@wundergraph/react-relay](https://img.shields.io/npm/v/@wundergraph/react-relay.svg)

This package provides a type-safe integration of [react-relay](https://relay.dev/) with WunderGraph.
Relay is a JavaScript framework for building data-driven React applications, efficiently fetching and managing data from GraphQL APIs. It optimizes network requests, simplifies client-side data management, and enables performant, scalable apps.

> **Warning**: Only works with [WunderGraph](https://wundergraph.com).

## Getting Started

The easiest way to get started with WunderGraph + Relay is to use one of our templates

### Next.js

```sh
npx create-wundergraph-app my-project --example nextjs-relay
```

### React with Vite

```sh
npx create-wundergraph-app my-project --example vite-react-relay
```

## Add relay to an existing WunderGraph + Relay project

Install WunderGraph Relay sdk into your project

```sh
npm install @wundergraph/react-relay
```

Make sure you have set your code generation to include the base typescript client.

```typescript
// wundergraph.config.ts
configureWunderGraphApplication({
  // ... omitted for brevity
  codeGenerators: [
    {
      templates: [templates.typescript.client],
      // the location where you want to generate the client
      path: '../src/components/generated',
    },
  ],
});
```

In your relay config add the `persistConfig` option and make sure the `persisted.json` file is in your `.wundergraph/operations/relay` directory (you might have to create an empty file in the target location for the first time)

```json
  //...
  "relay": {
    //...
    "persistConfig": {
      "file": "./.wundergraph/operations/relay/persisted.json"
    }
  }
  //...
```

WunderGraph will use the `persisted.json` file to generate the necessary Relay code. Now you can use the WunderGraph Relay provider & utility functions.

```ts
import { createWunderGraphRelayApp } from '@wundergraph/react-relay';
import { createClient } from '../generated/client';

const client = createClient(); // Typesafe WunderGraph client

// These utility functions needs to be imported into your app
export const {
  WunderGraphRelayProvider,
  useLiveQuery,
  getEnvironment,
  fetchWunderGraphSSRQuery,
  fetchWunderGraphSSGQuery,
} = createWunderGraphRelayApp({
  client,
});
```

Now, in your React App, make sure the whole application is Wrapped under `WunderGraphRelayProvider`.

```tsx
const App = () => {
  return <WunderGraphRelayProvider>{/** Rest of your Application */}</WunderGraphRelayProvider>;
};
```

All the existing [Relay APIs](https://relay.dev/docs/) will work normally, the provider will make sure that Relay uses the WunderGraph generated client behind the scenes.

The Relay integration also provides two very powerful utilities

## Live Queries

The `useLiveQuery` hooks lets you leverage the power of [WunderGraph's Live Queries](https://docs.wundergraph.com/docs/features/live-queries) feature to make your application realtime!

```tsx
const { data, isLoading, isSubscribed, error } = useLiveQuery<QueryType>({
  query: /** Query */,
  queryReference,
});
```

The `useLiveQuery` hook syncs with the Relay store which means if the query is already fetched in SSR, it will render immediately.

## Render As You Fetch

To implement the Render-As-You-Fetch pattern for your queries in React, you can use the Relay's `loadQuery` utility along with the `getEnvironment` utility function provided by WunderGraph.

```tsx
const AppDragonsQuery = graphql`
  query DragonsListDragonsQuery {
    spacex_dragons {
      ...Dragons_display_details
    }
  }
`;

const dragonsListQueryReference = loadQuery<DragonsListDragonsQueryType>(getEnvironment(), AppDragonsQuery, {});

export const DragonsList = () => {
  const { data } = useLiveQuery<DragonsListDragonsQueryType>({
    query: AppDragonsQuery,
    queryReference: dragonsListQueryReference,
  });

  return (
    <div>
      <p>Dragons:</p>
      {data?.spacex_dragons?.map((dragon, dragonIndex) => {
        if (dragon) return <Dragon key={dragonIndex.toString()} dragon={dragon} />;
        return null;
      })}
    </div>
  );
};
```

As shown in the above example, the `loadQuery` function has to be called outside of the React Component to ensure the fetching happens as soon as the component is loaded into memory. Works well when prefetching pages using React Router or Next Link components.

## SSR Support

The `fetchWunderGraphSSRQuery` lets you fetch queries on the serverside and hydrate your Relay store on the client using the `WunderGraphRelayProvider`

### On your Server:

```ts
const { initialRecords, queryResponse } = await fetchWunderGraphSSRQuery<QueryType>(/** Query */, {
  /** Query Variables */
});
```

### On your client:

You can hydrate relay store for the whole application using `initialRecords`:

```tsx
const App = () => {
  return (
    <WunderGraphRelayProvider initialRecords={initialRecords}>
      {/** Rest of your Application */}
    </WunderGraphRelayProvider>
  );
};
```

## SSG Support (Experimental)

If you are planning to use Relay for SSG projects where pages are generated only on build time & doesn't have a Relay client on the generated pages (SSG projects created with frameworks like [Astro](https://astro.build/) or [11ty](https://www.11ty.dev/)), you can use the `fetchWunderGraphSSGQuery` which will make the API calls during builds & completely bypasses the need for Relay Store by directly returning the JSON data.

```astro
---
const weatherData = await fetchWunderGraphSSGQuery<QueryType>(/** Query */, {
  /** Query Variables */
});
---

<div class={styles.container}>
  <main class={styles.main}>
    {weatherData?.weather_getCityByName?.weather?.summary && (
      <Weather weather={weatherData.weather_getCityByName.weather.summary} />
    )}
    {weatherData?.weather_getCityByName?.weather?.temperature && (
      <TemperatureDetails weather={weatherData.weather_getCityByName.weather.temperature} />
    )}
  </main>
</div>
```

## Learn more

To learn more about Relay, read our [Quickstart Guide](https://docs.wundergraph.com/docs/getting-started/relay-quickstart)
