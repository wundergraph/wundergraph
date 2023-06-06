---
title: Configure mutual TLS (mTLS) for HTTP based data sources
description: configure mutual TLS (mTLS) for HTTP based data sources, like GraphQL, Apollo Federation, REST / OpenAPI and more.
---

This section describes how to configure mutual TLS (mTLS) for HTTP based data sources,
like GraphQL, Apollo Federation, REST / OpenAPI and more.

## Example Configuration

```typescript
// wundergraph.config.ts
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://localhost:8443',
  mTLS: {
    key: new EnvironmentVariable('KEY'),
    cert: new EnvironmentVariable('CERT'),
    insecureSkipVerify: true,
  },
});

configureWunderGraphApplication({
  apis: [spaceX],
});
```

To enable mTLS,
add the `mTLS` property to the `api` configuration.
Define the `key` and `cert` properties to the `mTLS` property.
If the certificate of the server is self-signed,
you should set the `insecureSkipVerify` property to `true`.

This example makes use of the `EnvironmentVariable` class,
which is the recommended way to use environment variables when configuring WunderGraph.
