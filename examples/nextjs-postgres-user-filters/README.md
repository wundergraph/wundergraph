# User Filters Example

This example demonstrates how you can store user-specific filters in the database and apply them to queries.

Check out the [prisma schema](schema.prisma) file to understand the database schema.
In the [seed.ts](seed/seed.ts) file, we're seeding the database with one user, a few nodes with a created_at field to demonstrate filtering.
In the [wundergraph.server.ts](.wundergraph/wundergraph.server.ts) file,
you can see how we're loading the user-specific filters from the database and applying them to the node query.

In a real application, you'd inject the user's email from their claims into the operation.
So you don't have to mock the user's email, but can load it from their login cookie.
Next, we load their filters and inject them into the operation.

The user can use a separate endpoint to update their filters.
The nodes endpoint can also be used with a liveQuery,
so you can easily stream updates to the client.

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

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
