---
title: Simplifying the WunderGraph URL Structure
pageTitle: WunderGraph - Simplifying the WunderGraph URL Structure
description: This document describes the changes to the WunderGraph URL structure we've made at version 0.121.0.
---

This document describes the changes to the WunderGraph URL structure we've made at version 0.121.0.
It's a long overdue change to clean up technical debt and simplify the URL structure of the WunderGraph Protocol.

Previously, the configuration of a WunderGraph application looked like this:

```typescript
const myApplication = new Application({
  name: 'app',
  apis: [jsp, weather, countries, spacex, chinook, db],
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
  application: myApplication,
});
```

You've had to create an `Application` and pass it to `configureWunderGraphApplication`.
This application had a name, `app` in this case, and a list of APIs.

Given that the name of your application is `app`, the URL structure of your WunderGraph application looked like this:

```shell
http://localhost:9991/app/main/operations/Weather?city=Berlin
```

So, the name of the application was part of the URL structure.
This caused a lot of problems, as most of our examples used the name `app`,
but sometimes it was `api`, so people were running into problems when they tried to copy and paste the examples.

Moreover, there was this peculiar `main` in the URL structure,
which looks like it has something to do with the `main` branch of a git repository,
but it doesn't.

While this was the intention, it was never implemented and just made the URL structure more confusing.
Instead, we're now heading to use a "preview" subdomain for preview environments in WunderGraph Cloud.
That is, we completely abandon the idea of "branching" in the URL path.

## The New URL Structure

The new way to configure a WunderGraph application looks like this:

```typescript
// wundergraph.config.ts

configureWunderGraphApplication({
  apis: [jsp, weather, countries, spacex, chinook, db],
});
```

You don't have to create an `Application` anymore.
Instead, you just pass a list of APIs to `configureWunderGraphApplication`.
Simple and clean.

The new URL structure looks like this:

```shell
http://localhost:9991/operations/Weather?city=Berlin
```

We've simply dropped `/app/main` from the URL structure.

## Migration

{% callout type="warning" %}
This is a breaking change that might require some changes to your code
{% /callout %}

Instead of passing your APIs to `Application` and calling `configureWunderGraphApplication()`
with it, pass your APIs directly to `configureWunderGraphApplication()`. For example:

```diff
-const myApplication = new Application({
-  name: 'app',
-  apis: [jsp, weather, countries, spacex, chinook, db],
-})
-
 configureWunderGraphApplication({
-  application: myApplication,
+  apis: [jsp, weather, countries, spacex, chinook, db],
 })
```

In order to avoid breaking APIs that you might have exposed to third parties we've temporarily
kept application URLs backwards compatible. Using the old URL structure will generate a
warning.

The following URLs continue to work, but are deprecated:

```shell
http://localhost:9991/app/main/operations/Weather?city=Berlin
http://localhost:9991/api/main/operations/Weather?city=Berlin
http://localhost:9991/foo/main/operations/Weather?city=Berlin
```

We've updated all code generators to use the new URL structure,
so if you're updating the WunderGraph SDK and run `wundergraph generate`,
all generated code will use the new URL structure automatically.

If someone is using your WunderGraph API,
they might want to update their code at some point to use the new URL structure,
but it's not required.
