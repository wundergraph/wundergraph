---
title: Caching Example
pageTitle: WunderGraph - Examples - Caching
description:
---

[The Caching example](https://github.com/wundergraph/wundergraph/tree/main/examples/caching) shows you how to enable HTTP-Layer caching in WunderGraph.

## Configuration

This time, we're making changes to the `wundergraph.operations.ts` file.
As the file name indicates, it's used to configure Operations.

First, we have to set defaults for Queries, Mutations and Subscriptions.
For the Queries, we're configuring default values, like `maxAge` and `staleWhileRevalidate`,
but keep caching disabled by default.

Using the `custom` property,
we can override the config for individual Operations using an arrow function.
In this case, we enable caching for the Dragons Query.

```typescript
// wundergraph.operations.ts
export default configureWunderGraphOperations<OperationsConfiguration>({
  operations: {
    defaultConfig: {
      authentication: {
        required: false,
      },
    },
    mutations: (config) => {
      return config;
    },
    subscriptions: (config) => {
      return config;
    },
    queries: (config) => ({
      ...config,
      liveQuery: {
        enable: false,
        pollingIntervalSeconds: 0,
      },
      caching: {
        enable: false,
        staleWhileRevalidate: 60,
        maxAge: 60,
        public: true,
      },
    }),
    custom: {
      Dragons: (config) => ({
        ...config,
        caching: {
          ...config.caching,
          enable: true,
        },
      }),
    },
  },
});
```

## Result

As a result, your WunderGraph server will now cache the `Dragons` Query as per the configuration.
Additionally, we'll add Cache-Control headers to the response,
which means that Browsers, Proxies and CDNs will be able to cache the response.

On top of that, we'll also generate an `ETag` for the response.
This makes it very efficient to re-validate content.
You can read more about this in the ETag documentation.

## Learn more

- [Guides](/docs/guides)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use WunderGraph Cloud.

{% deploy template="simple" /%}
