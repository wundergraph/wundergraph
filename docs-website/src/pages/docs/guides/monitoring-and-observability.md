---
title: Monitoring and Observability
pageTitle: WunderGraph - Monitoring and Observability
description: This guide shows how to monitor your WunderGraph nodes
---

## Monitoring

WunderGraph exposes several metrics that allow you to get a better understanding of your
application's performance. The following metrics are available:

- Served HTTP requests (tagged per operation and status code)
- Size of incoming HTTP requests
- Size of outgoing HTTP responses
- Duration of received HTTP requests
- Outgoing HTTP requests sent to upstream APIs (tagged per host and status code)
- Duration of outgoing HTTP requests (tagged per host and status code)

## Prometheus

By default, Prometheus is enabled and serves its metrics on `http://<host>:8881/metrics`. To disable it
or to use a custom port, use the `prometheus` field when calling `configureWunderGraphApplication()`:

```typescript
// wundergraph.config.ts

configureWunderGraphApplication({
    ...
    options: {
        prometheus: {
            enabled: true, // Set to false to disable
            port: 8881, // Defaults to 8881
        }
    },
    ...
});
```
