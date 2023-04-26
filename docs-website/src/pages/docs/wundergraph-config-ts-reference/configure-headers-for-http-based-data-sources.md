---
title: Configure Headers for HTTP-based Data Sources
pageTitle: WunderGraph - Configure Headers for HTTP-based Data Sources
description:
---

When configuring a HTTP-based data source,
like GraphQL, Apollo Federation or OpenAPI,
you can configure if and how the WunderGraph Server should send headers to the origin.

There are two modes to distinguish between,
static and dynamic.
With the static mode, it's possible to set static headers, like an API key or a token.
Dynamic headers allow you to set headers based on the client request.

## Configuration builder

The `headers` property is a fluent builder.
Simply create a lambda function that takes a builder and appends the headers to it (see examples below).

## Static Headers

Here's an example of how to configure static headers:

```typescript
// wundergraph.config.ts
const jsp = introspect.openApi({
  apiNamespace: 'jsp',
  source: {
    kind: 'file',
    filePath: '../json_placeholder.json',
  },
  headers: (builder) => builder.addStaticHeader('X-API-KEY', '123'),
});
```

On this origin, we will always send the header `X-API-KEY` with the value `123`.
As this information is kept on the server, it's a secure way to talk to a protected origin.

## Dynamic Headers

```typescript
// wundergraph.config.ts
const jsp = introspect.openApi({
  apiNamespace: 'jsp',
  source: {
    kind: 'file',
    filePath: '../json_placeholder.json',
  },
  headers: (builder) => builder.addClientRequestHeader('X-Authorization', 'Authorization'),
});
```

The first parameter is the name of the header to add.
The second parameter is the name of the header to get the value from the client request.
With this configuration, we will send the header `X-Authorization` with the value of the `Authorization` header of the client request.
