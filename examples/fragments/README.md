# WunderGraph Fragments Example

You're able to use fragments locally or globally.
Local fragments, defined side-by-side with the Operation are only available in the context of the Operation.
Global fragments, defined in the `.wundergraph/fragments` directory are available for all Operations.

#### Getting started

```shell
npm install && npm start
```

#### Local Fragments (Dragons)

This example uses Operation-local fragments. (operations/LocalFragment.graphql)

```shell
curl http://localhost:9991/operations/LocalFragment
```

#### Global Fragments (Dragons)

This example uses global fragments. (operations/GlobalFragment.graphql)

```shell
curl http://localhost:9991/operations/GlobalFragment
```

#### TS Operations

```shell
curl http://localhost:9991/operations/users/get?id=1
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=fragments)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!

```

```
