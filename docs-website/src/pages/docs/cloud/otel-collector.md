---
title: 'WunderGraph Cloud OpenTelemetry Collector'
pageTitle: WunderGraph - Using WunderGraph Cloud OTEL Collector
description: How to use the WunderGraph Cloud OTEL Collector to push your custom traces.
---

# Introduction

WunderGraph Cloud provides a public OpenTelemetry Collector that you can use to push your custom traces to WunderGraph Cloud.
There are different ways to push your traces to the collector, depending on your setup.

- Endpoint: `https://otel.wundergraph.com`
- Endpoint Version: `v1`
- Supported Protocol: `OTLP/HTTP` (gRPC is not supported)

## Export to WunderGraph Cloud Collector from your own OpenTelemetry Collector

If you already have your own OpenTelemetry Collector and want to export your traces to WunderGraph, you'd need to add a new `otltphttp` exporter in your config.yml, with WunderGraph API-Token as your Authorization header:

```shell
exporters:
  otlphttp:
    endpoint: https://otel.wundergraph.com
    headers:
      Authorization: <wundergraph-telemetry-token>

service:
  pipelines:
    traces:
      receivers: [...]
      processors: [...]
      exporters: [otlphttp, ...]
```

## Export to WunderGraph Cloud Collector from your own OpenTelemetry SDK

If you already have your own OpenTelemetry SDK and want to export your traces to WunderGraph, you'd need to use the `otltphttp` exporter, with WunderGraph API-Token as your Authorization header:

```typescript
ctx := context.Background()
traceExporter, err := otlptracehttp.New(ctx,
  otlptracehttp.WithEndpoint("otel.wundergraph.com"),
  otlptracehttp.WithHeaders(map[string]string{"Authorization": "Bearer <YOUR WUNDERGRAPH TOKEN HERE>"}))
```

This is an example for the Go SDK, but the same applies to all other SDKs.
