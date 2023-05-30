---
title: Configure Introspection
description: Configure introspection caching, polling and headers.
---

When running `wunderctl up`,
WunderGraph automatically sets up a number of file watchers to automatically re-generate the configuration and re-start the WunderGraph Server when changes are made to the configuration.

This approach has two downsides.
First, we can only detect changes to the file system.
So, if you're changing the schema of your database,
you'd have to manually re-start the process,
which would be inconvenient.

Second, whenever you change one of the configuration files,
e.g. you modify a GraphQL Operation,
`wunderctl` would have to re-introspect all data sources.
This works fine for a small number of data sources,
but doesn't really scale.

## Introspection Caching

That's why we've introduced introspection caching.

{% callout type="warning" %}
By default, during development every remote data source is introspected exactly once.
The result is cached in the `node_modules/.cache/wundergraph/introspection` directory.
{% /callout %}

When caching is enabled, if a cache entry is found for a data source,
it's always used instead of introspecting the data source again. Cache is
optional and might be turned off globally using the `--no-cache` flag.

For production deployments, we prioritize retrieving fresh data over using cached results.
This means, we will initially try to refresh the data from the remote upstreams and we'll
only use the cache if that fails.

## Clearing the Cache

To clear the cache, removing all its data, run `wunderctl clean`.

## Pregenerating the Cache

For CI environments that cannot perform network requests, it might be
useful to generate the cache contents and make the tests run offline.

To populate the cache contents run `wunderctl generate --clear-cache`.
This will delete any previous cache, introspect the data sources, and
finally write the cache entries. `node_modules/.cache/wundergraph/introspection` can then be stored
and deployed to CI runners.

To verify that your tests can run without fetching data from the network
in a connected machine, the `--offline` flag can be used to disable loading
remote resources.

## Introspection Polling

By default, `wunderctl up` will poll remote data sources periodically every 5 seconds,
which should be fine for most data sources. The default interval can be changed using
the `--default-polling-interval` flag.

For remote data sources with large schemas,
we recommend setting the interval to a higher value to not overload the remote server.
To set a different polling interval, use `pollingIntervalSeconds`:

```typescript
// wundergraph.config.ts
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
  introspection: {
    pollingIntervalSeconds: 30,
  },
});
```

To disable polling for a given data source, set its `pollingIntervalSeconds` to `0`. Additionally,
the default polling interval can also be disabled using `--default-polling-interval=5`.

## Disable Introspection Caching

It's also possible to disable introspection caching for a given data source.
Set `disableCache` to true, and `wunderctl up` will ignore the cache for this data source.

```typescript
// wundergraph.config.ts
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
  introspection: {
    disableCache: true,
  },
});
```

Disabling the cache can result in reduced performance,
because the data source is introspected every time a configuration file is changed.

{% callout type="warning" %}
Disabling the cache will not help you if you're changing the schema of your database.
The process will only re-introspect if a file is changed.
{% /callout %}

## Introspection of protected GraphQL APIs

In order to authorize introspection request you have to add header either via headers configuration or by a similar headers builder in the introspection configuration.

### Provide headers with headers configuration

Using this approach you could use the same static headers for introspection and for requests at runtime.

Specifying dynamic (client request headers) will have no effect on introspection.
That's because at introspection time, there's no client request.
So, only static headers (string or environment variables) will work.

```typescript
// simple graphql api
const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: ' http://localhost:4000/',
  headers: (builder) =>
    builder
      // this header has no effect on introspection
      .addClientRequestHeader('X-Authorization', 'Authorization')
      // this header is shared between introspection and actual requests
      .addStaticHeader('Authorization', 'Secret'),
});

// or federated api
const federatedApi = introspect.federation({
  apiNamespace: 'federated',
  upstreams: [
    {
      url: 'http://localhost:4001/graphql',
      headers: (builder) => builder.addStaticHeader('Authorization', 'Secret'),
    },
  ],
});
```

### Provide headers with introspection configuration

By providing headers in the introspection configuration you could avoid using static header for all requests.
Headers configured in a such way will be used only for the graphql introspection and getting the service sdl query in case of federated api.

```typescript
// simple graphql api
const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: ' http://localhost:4000/',
  headers: (builder) => builder.addClientRequestHeader('X-Authorization', 'Authorization'),
  introspection: {
    headers: (builder) => builder.addStaticHeader('Authorization', 'Secret'),
  },
});

// or federated api
const federatedApi = introspect.federation({
  apiNamespace: 'federated',
  upstreams: [
    {
      url: 'http://localhost:4001/graphql',
      introspection: {
        headers: (builder) => builder.addStaticHeader('Authorization', 'Secret'),
      },
    },
  ],
});
```

You could even mix up both approaches.
In this case introspection headers will be merged with the headers provided in the headers configuration and the headers provided in the introspection configuration will have higher priority for the introspection request.

```typescript
const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: ' http://localhost:4000/',
  headers: (builder) => builder.addStaticHeader('Authorization', 'Secret One'),
  introspection: {
    headers: (builder) => builder.addStaticHeader('Authorization', 'Secret Two'),
  },
});
```
