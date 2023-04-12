---
title: Configure Open Telemetry
pageTitle: WunderGraph - Configure Open Telemetry
description: This section describes how to configure Open Telemetry in WunderGraph.
---

This section describes how to configure Open Telemetry in WunderGraph.

OpenTelemetry is a collection of tools, APIs, and SDKs used to instrument, generate, collect, and export telemetry data (metrics, logs, and traces) for analysis in order to understand your software's performance and behavior.

## Enable Open Telemetry

To enable Open Telemetry, set the `enabled` option to `true` in the `telemetry` section of the `options` object in the `configureWunderGraphApplication` function.
If no exporter endpoint is configured, the default exporter is the `Stdout` which prints the traces to the console.
If both exporter endpoints are configured, the error will be returned.

```typescript
// wundergraph.config.ts
configureWunderGraphApplication({
  apis: [spacex],
  options: {
    openTelemetry: {
      enabled: true, // default: false
      exporterHttpEndpoint: '', // https://your-otel-http-exporter-endpoint.dev/v1/traces, otel http exporter endpoint
      exporterJaegerEndpoint: '', // 'http://localhost:14268/api/traces' we recommend to use it for development
      authToken: '', // jwt for authentication format: 'Bearer ...', use for development only, adds authentication header to the exporter
    },
  },
  // ...
});
```

Empty values could be omitted.

## Environment variables configuration

The Open Telemetry configuration can also be set via environment variables.

```shell
  WG_OTEL_ENABLED=true
  WG_OTEL_EXPORTER_HTTP_ENDPOINT='https://your-otel-http-exporter-endpoint.dev/v1/traces'
  WG_OTEL_EXPORTER_JAEGER_ENDPOINT='http://localhost:14268/api/traces'
  WG_OTEL_JWT='Bearer ...' # production mode
```

If both enpoints are configured, you will get an error.
Please note that `wundergraph.config.ts` configuration has higher priority than environment variables.
Empty values could be omitted.

## Exporter enpoint normalization rules

- if URL scheme is not specified, the `https` scheme will be used
- if URL path is not specified, the `/v1/traces` path will be used for the `http` exporter and `/api/traces` for the `jaeger` exporter

Examples:

```shell
  WG_OTEL_EXPORTER_HTTP_ENDPOINT='your-otel-http-exporter-endpoint.dev' # https://your-otel-http-exporter-endpoint.dev/v1/traces
  WG_OTEL_EXPORTER_JAEGER_ENDPOINT='localhost:14268' # https://localhost:14268/api/traces

  WG_OTEL_EXPORTER_HTTP_ENDPOINT='http://your-otel-http-exporter-endpoint.dev' # http://your-otel-http-exporter-endpoint.dev/v1/traces
  WG_OTEL_EXPORTER_JAEGER_ENDPOINT='http://localhost:14268' # http://localhost:14268/api/traces

  WG_OTEL_EXPORTER_HTTP_ENDPOINT='https://your-otel-http-exporter-endpoint.dev' # https://your-otel-http-exporter-endpoint.dev/v1/traces
  WG_OTEL_EXPORTER_JAEGER_ENDPOINT='https://localhost:14268' # https://localhost:14268/api/traces

  WG_OTEL_EXPORTER_HTTP_ENDPOINT='https://your-otel-http-exporter-endpoint.dev/v1/traces' # https://your-otel-http-exporter-endpoint.dev/v1/traces
  WG_OTEL_EXPORTER_JAEGER_ENDPOINT='http://localhost:14268/api/traces' # http://localhost:14268/api/traces
```

This rules are applied to the `wundergraph.config.ts` configuration accordingly.

## Authentication

OpenTelemetry collector can be secured with a JWT token.
If `authToken` / `WG_OTEL_JWT` is set, the exporter will add the `Authorization` header to the request:

```
"Authorization": "Bearer ..."
```

## Tracing

The `traceparent` header is used to propagate the trace context.

Header format: `traceparent: {version}-{trace_id}-{span_id}-{trace_flags}`
https://www.w3.org/TR/trace-context/#trace-context-http-headers-format

If incoming request to the wundergraph node contains a `traceparent` header, the trace context will be extracted from it.
Otherwise, a new trace context will be created.

Trace context will be propagated to the origin of the request and to the downstream services.

WunderGraph cloud edge proxy will add the `traceparent` header to the request to the wundergraph node automatically.
