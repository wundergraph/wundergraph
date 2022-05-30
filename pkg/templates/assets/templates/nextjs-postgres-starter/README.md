# WunderGraph Postgres Starter

## Getting Started

Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

Running WunderGraph will automatically introspect the database and generate an API for you.
You can add more Operations (e.g. Queries or Mutations) by adding more "\*.graphql" files to the directory `./wundergraph/operations`.
Each file becomes an Operation. The Operation name is not relevant, the file name is.

## Cleanup

```shell
npm run cleanup
```

## Got Questions?

Read the [Docs](https://wundergraph.com/docs).

Join us on [Discord](https://wundergraph.com/discord)!
