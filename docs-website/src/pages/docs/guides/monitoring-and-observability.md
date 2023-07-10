---
title: Monitoring and Observability
pageTitle: WunderGraph - Monitoring and Observability
description: This guide shows how to monitor your WunderGraph nodes
---

## Prometheus

WunderGraph exposes several metrics that allow you to get a better understanding of your
application's performance. The following metrics are available:

- Served HTTP requests (tagged per operation and status code)
- Size of incoming HTTP requests
- Size of outgoing HTTP responses
- Duration of received HTTP requests
- Outgoing HTTP requests sent to upstream APIs (tagged per host and status code)
- Duration of outgoing HTTP requests (tagged per host and status code)

By default, Prometheus is enabled and serves its metrics on `http://<host>:8881/metrics`. To disable it
or to use a custom port, use the `prometheus` field when calling `configureWunderGraphApplication()`:

```typescript
// wundergraph.config.ts

configureWunderGraphApplication({
  options: {
    prometheus: {
      enabled: true, // Set to false to disable
      port: 8881, // Defaults to 8881
    },
  },
});
```

## OpenTelemetry

WunderGraph supports OpenTelemetry out of the box. OpenTelemetry is a collection of tools, APIs, and SDKs used to instrument, generate, collect, and export telemetry data (metrics, logs, and traces) for analysis in order to understand your software's performance and behavior.
With the help of OpenTelemetry, you can monitor your WunderGraph nodes and get a better understanding of your application's performance. We instrument all outgoing HTTP requests and inner service calls with OpenTelemetry. This includes:

- All Hooks
- TypeScript functions
- GraphQL Operations
- Webhooks
- Calls made with the Operations Client
- Origin requests

If you are not familiar with OpenTelemetry, you can read more about it [here](https://opentelemetry.io/).
The OpenTelemetry integration is disabled by default. To enable it, set `enabled` to `true` and optionally configure the endpoint and sampling rate:

```typescript
// wundergraph.config.ts

configureWunderGraphApplication({
  options: {
    openTelemetry: {
      // Disabled by default
      enabled: true,
      // Defaults to 1 (every trace request). Samples a given fraction of traces. Must be a value between 0 and 1.
      // For example, a value of 0.1 means 10% of traces are sampled. Don't set this to 1 in production, unless you want to trace every request.
      sampler: 1,
      // Endpoint to the OTLP http endpoint. Defaults to http://localhost:4318
      exporterHttpEndpoint: 'http://localhost:4318',
    },
  },
});
```

### Supported backends

We support any OpenTelemetry backend that supports the OTLP http protocol. This includes, but is not limited to:

- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Jaeger](https://www.jaegertracing.io/docs/1.45/deployment/#collector)

You can also use the [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) to export your traces to any other backend that is supported by the collector.

### Authentication

If you have the need to authenticate with the OpenTelemetry endpoint, you can do so by providing an `authToken`.
Currently, we only support JWT authentication in combination with our [JWT authenticator](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/20524) plugin.

```typescript
// wundergraph.config.ts

configureWunderGraphApplication({
  options: {
    openTelemetry: {
      enabled: true,
      exporterHttpEndpoint: 'https://your-collector-endpoint.com',
      authToken: 'jwt-token', // Used to authenticate with the OpenTelemetry endpoint in form of a Bearer token
    },
  },
});
```

{% callout type="note" %}
If you can't find the metrics, attributes you are looking for. We are happy to help you out! Please [contact us](https://wundergraph.com/discord).  
{% /callout %}
