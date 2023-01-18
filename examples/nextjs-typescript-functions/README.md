# WunderGraph Next.js Starter

This example demonstrates how to use WunderGraph with Next.js. We are going to make your data-source accessible through JSON-RPC to your Next.js app.

## Getting Started

1. Copy the `.env.example` file to `.env` and fill in the required values.
2. Install the dependencies and run the complete example in one command:

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
