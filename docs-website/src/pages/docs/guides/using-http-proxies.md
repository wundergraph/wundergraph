---
title: Using HTTP Proxies
pageTitle: WunderGraph - HTTP Proxies
description: This guide explains how to configure WunderGraph to use HTTP proxies
---

WunderGraph supports using HTTP or HTTPS proxies for both introspection and to make HTTP
requests at runtime. This affects APIs that are transported through HTTP,
namely GraphQL (either directly or via federation) and OpenAPI based data sources.

Both HTTP and HTTPS proxies are supported. When talking to an HTTPS API through an HTTP
server, WunderGraph will open a socket using and HTTP CONNECT request.

## Configuring a global proxy server

To set a global proxy for all your APIs, use `defaultHttpProxyUrl` when calling `configureWunderGraphApplication()`:

```ts
configureWunderGraphApplication({
    ...
    options: {
        defaultHttpProxyUrl: 'https://my.proxy.server:1234',
    }
});
```

The proxy can be set to either a string or an environment variable, using `EnvironmentVariable`.

By default, `defaultHttpProxyUrl` reads the global proxy URL from the `WG_HTTP_PROXY` environment
variable.

This global proxy definition can be overridden on every data source.

## Configuring a proxy for a single data source

All data sources that use a HTTP transport have an `httpProxyUrl` field that can be set when
defining them:

```ts
const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
  httpProxyUrl: 'http://my.proxy.server:3128',
});
```

Data sources that don't specify any proxy will use the global one. To override the global HTTP proxy
by disabling it, set `httpProxyUrl` to `null`.

In the same way as the global proxy, `httpProxyUrl` can also take an `EnvironmentVariable`.
