---
title: Configure Open Telemetry
pageTitle: WunderGraph - Configure Open Telemetry
description: This section describes how to configure Open Telemetry in WunderGraph.
---

This section describes how to configure Open Telemetry in WunderGraph.

OpenTelemetry is a collection of tools, APIs, and SDKs used to instrument, generate, collect, and export telemetry data (metrics, logs, and traces) for analysis in order to understand your software's performance and behavior.

## Enable Open Telemetry

To enable Open Telemetry, set the `otelEnabled` option to `true` in the `telemetry` section of the `options` object in the `configureWunderGraphApplication` function.
If no exporter endpoint is configured, the default exporter is the `Stdout` which prints the traces to the console.

```typescript
configureWunderGraphApplication({
  apis: [spacex],
  options: {
    telemetry: {
      otelEnabled: true, // default: false
      otelExporterHttpEndpoint: '', // standard otel http exporter endpoint
      otelExporterJaegerEndpoint: '', // 'http://localhost:14268/api/traces'
    },
  },
  // ...
});
```
