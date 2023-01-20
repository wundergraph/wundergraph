# WunderGraph Caching

This example demonstrates how to configure Cache-Control headers and stale-while-revalidate for each individual Operation. WunderGraph will Cache your responses automatically and apply the necessary headers, including ETags for efficient content revalidation.

The server will cache the response in memory and compute an ETag for the response, which will be sent to the client along with the response.

On subsequent requests, the client will automatically attach the ETag to the request, which is the default behaviour of the browser. If the client cache is stale, but the ETag still matches, the server will respond with a 304 Not Modified, sending as little data as possible.

## Getting Started

1. Copy the `.env.example` file to `.env` and fill in the required values.
2. Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
