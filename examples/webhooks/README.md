# WunderGraph Webhooks

This example demonstrates how to create Webhook functions. Webhook functions are the type-safe way to write HTTP endpoints that are used as Webhook targets. They are exposed publicly through your WunderNode. Optionally, you can configure a verifier in [`wundergraph.server.ts`](./.wundergraph/wundergraph.server.ts) that validates the signature of the incoming request. For [`Github Webhooks`](https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks) we provide a verifier that you can use without writing any line of code.

## Getting Started

Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

After `npm start` has been executed, your browser should open a new tab and navigate to [`http://localhost:9991/webhooks/github`](http://localhost:9991/webhooks/github).

## Test the API

1. (Optional) Copy the `.env.example` file to `.env.test` and fill in the required values.
2. Run the following command:

```shell
npm run test
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
