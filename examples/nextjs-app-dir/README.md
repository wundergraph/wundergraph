# WunderGraph Next.js with App Directory Starter

This example demonstrates how to use WunderGraph with Next.js App Directory. We are going to make your data-source accessible through JSON-RPC to your Next.js app.

## Getting Started

1. Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

After a while, a new browser tab will open,
and you can start exploring the application.
If no tab is open, navigate to [http://localhost:3000](http://localhost:3000).

Running WunderGraph will automatically introspect the data-source and generate an API for you.
You can add more Operations (e.g. Queries or Mutations) by adding more "\*.graphql" files to the directory `./wundergraph/operations`.
Each file becomes an Operation. The Operation name is not relevant, the file name is.

This example includes how to work with Server Components as well as Experimental Server Actions.

## Learn More

- Read the [WunderGraph Docs](https://wundergraph.com/docs).
- Next.js 13 with [App directory](https://nextjs.org/docs)

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=nextjs-app-dir)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
