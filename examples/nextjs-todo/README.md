# WunderGraph React Query Next.js Starter

This example demonstrates how to use WunderGraph with React Query and Next.js, we build a simple todo app
for making matter simple we introspect Hasura Graph Api for CRUD operations so we have a ready made Api.

## Getting Started

### Hasura Setup

Please check this link to set up hasura [Setup Hasura](https://docs.wundergraph.com/docs/examples/graphql-hasura-subscriptions#__next)
Once you obtain your `token` from hasura

Open `example.env` and rename it to `.env` and replace your hasura token as `HASURA_TOKEN=YOUR_TOKEN`

### Installation and run

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
