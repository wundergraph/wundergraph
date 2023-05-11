# WunderGraph Hooks

This example demonstrates how to use the `mutatingPostResolve` hook to change the response of the `Dragons` operation. Hooks are the type-safe way to write custom middleware functions. If you need an overview about all possible hooks, please refer to the [WunderGraph Hooks documentation](/docs/hooks.md).

## Getting Started

1. Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

After `npm start` has been executed, your browser should open a new tab and navigate to [`http://localhost:9991/operations/Dragons`](http://localhost:9991/operations/Dragons). In the console, you can see logs emitted by the `mutatingPostResolve` hook.

#### TS operation

```shell
curl -N http://localhost:9991/operations/users/get?id=1
```

## Test the API

1. (Optional) Copy the `.env.example` file to `.env.test` and fill in the required values.
2. Run the following command:

```shell
npm run test
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=hooks)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
