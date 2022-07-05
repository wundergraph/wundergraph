# WunderGraph Subscriptions / Live Queries

This example demonstrates how to use WunderGraph Subscriptions & Live Queries with Next.js.

Subscriptions and Live Queries are a fundamental feature to build modern, reactive applications.

WunderGraph supports GraphQL Subscriptions and Live Queries (via server-side polling) out of the box, no additional configuration is required.

## Getting Started

Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

After a while, a new browser tab will open,
and you can start exploring the application.
If no tab is open, navigate to [http://localhost:3000](http://localhost:3000).

Running WunderGraph will automatically introspect the data-source and generate an API for you.
You can add more Operations (e.g. Queries or Mutations) by adding more "\*.graphql" files to the directory `./wundergraph/operations`.
Each file becomes an Operation. The Operation name is not relevant, the file name is.

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
