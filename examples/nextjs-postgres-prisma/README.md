# WunderGraph Postgres Starter

This example demonstrates how to use WunderGraph with Next.js & Postgres. We are going to make your database accessible through JSON-RPC to your Next.js app.

This example also make use of Subscriptions & Live Queries.
Subscriptions and Live Queries are a fundamental feature to build modern, reactive applications.
WunderGraph supports GraphQL Subscriptions and Live Queries (via server-side polling) out of the box, no additional configuration is required.

## Getting Started

1. Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

After a while, a new browser tab will open,
and you can start exploring the application.
If no tab is open, navigate to [http://localhost:3000](http://localhost:3000).

You should now see a greeting from one of our Founders. =)

Running WunderGraph will automatically introspect the database and generate an API for you.
You can add more Operations (e.g. Queries or Mutations) by adding more "\*.graphql" files to the directory `./wundergraph/operations`.
Each file becomes an Operation. The Operation name is not relevant, the file name is.

## Updating the Database Schema

Change the `schema.prisma` file and run `npm run migrate %your_migration_name%`,
e.g. `npm run migrate "add pets"`.

## Seeding the Database

Once you've defined one or more Mutations in `./wundergraph/operations` (see CreateUser.graphql as an example),
you're able to use the generated TypeScript client to seed the Database.

Modify `./seed/seed.ts` and run `npm run seed`.

## Cleanup

```shell
npm run cleanup
```

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
