# WunderGraph Open Telemetry Example

#### Getting started

```shell
npm i && npm start
```

After you have made a few requests, you can check the tracing data in Jaeger. Open the Jaeger UI at [http://localhost:16686](http://localhost:16686) and select the service `wundernode`. You should see a few traces. Click on one of them and you should see all the spans.
Configure hooks in the `wundergraph.server.ts` and check how the tracing data changes.

#### Get all Continents (GraphQL Operation)

```shell
curl http://localhost:9991/operations/Continents
```

#### Get user (TypeScript Operation)

```shell
curl http://localhost:9991/operations/users/get?id=1
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=open-telemetry)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
