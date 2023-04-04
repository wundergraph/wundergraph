# WunderGraph open telemetry example

#### Configuration

Check the `wundergraph.config.ts` file:

```typescript
configureWunderGraphApplication({
  apis: [spacex],
  options: {
    telemetry: {
      otelEnabled: true,
      otelExporterHttpEndpoint: '',
      otelExporterJaegerEndpoint: 'http://localhost:14268/api/traces',
    },
  },
  // ...
});
```

#### Getting started

Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

#### Get Dragons

```shell
curl -H "traceparent: 00-80e1afed08e019fc1110464cfa66635c-7a085853722dc6d2-01" http://localhost:9991/operations/Dragons
```

#### Test the tracing

You can access Jaeger from http://localhost:16686/

To obtain meaningful results, it is recommended to change the trace id in the request header every time you send a request.
If you don't provide a traceparent header, a new trace id will be generated automatically.

Header format: `traceparent: {version}-{trace_id}-{span_id}-{trace_flags}`
https://www.w3.org/TR/trace-context/#trace-context-http-headers-format

Configure hooks in the `wundergraph.server.ts` and check how the tracing data changes.

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
