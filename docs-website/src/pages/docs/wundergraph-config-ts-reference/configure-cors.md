---
title: Configure CORS
pageTitle: WunderGraph - Configure CORS
description:
---

This section describes how to configure CORS in WunderGraph.

Contrary to popular belief, CORS does not protect your API from cross-origin requests.
It's a security feature that protects your users from unintentionally sending requests to your API from other domains.

A website might trick your users into sending requests to your API.
In this scenario, enabling CORS will prevent the browser from sending requests with the user's credentials "cross-origin".

{% callout type="warning" %}
Please configure CORS carefully to make sure that your users are protected.
Allowing all origins is usually the worst possible configuration.
{% /callout %}

## Allow all origins

For development purposes, enabling CORS for all origins can be helpful.

```typescript
configureWunderGraphApplication({
  cors: {
    ...cors.allowAll,
  },
});
```

## Configuration with allowed origin

This configuration is a bit more advanced,
enabling all defaults but limiting the allowed origins.
This should be the most common configuration.

```typescript
configureWunderGraphApplication({
  cors: {
    ...cors.allowAll,
    allowedOrigins: ['http://localhost:3000'],
  },
});
```

## Custom Configuration

If you'd like to fully customize the configuration,
don't use `...cors.allowAll` but instead configure all options manually.
This allows you e.g. to set a custom maxAge value to cache CORS responses for a specific time.

```typescript
configureWunderGraphApplication({
  cors: {
    maxAge: 86400,
    allowedHeaders: ['Authorization'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Authorization'],
    allowCredentials: true,
    allowedOrigins: ['http://localhost:3000'],
  },
});
```

## Using wildcards

An origin may contain a wildcard (\*) to replace 0 or more characters.
Usage of wildcards implies a small performance penalty.

```typescript
configureWunderGraphApplication({
  cors: {
    ...cors.allowAll,
    allowedOrigins: ['https://*.wundergraph.com'],
  },
});
```
