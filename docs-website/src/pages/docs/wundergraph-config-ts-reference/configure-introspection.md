---
title: Configure Introspection
pageTitle: WunderGraph - Configure Introspection
description:
hideTableOfContents: true
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
By default, every data source is introspected exactly once.
The result is cached in the `.wundergraph/generated/introspection` directory.
{% /callout %}

If a cache entry is found for a data source,
it's always used instead of introspecting the data source again.

## Clearing the Cache

It's possible to clear the cache by running `wunderctl up --clear-introspection-cache`.

## Enable Introspection Polling

If you want to enable introspection polling,
set a reasonable interval for the `pollingIntervalSeconds` value.
For most data sources, an interval of 2-5 seconds should be fine.
For remote data sources with large schemas,
we recommend setting the interval to a higher value to not overload the remote server.

```typescript
// wundergraph.config.ts
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://api.spacex.land/graphql/',
  introspection: {
    pollingIntervalSeconds: 5,
  },
})
```

## Disable Introspection Caching

It's also possible to disable introspection caching.
Set `disableCache` to true, and `wunderctl up` will ignore the cache for this data source.

```typescript
// wundergraph.config.ts
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://api.spacex.land/graphql/',
  introspection: {
    disableCache: true,
  },
})
```

Disabling the cache can result in reduced performance,
because the data source is introspected every time a configuration file is changed.

{% callout type="warning" %}
Disabling the cache will not help you if you're changing the schema of your database.
The process will only re-introspect if a file is changed.
{% /callout %}
