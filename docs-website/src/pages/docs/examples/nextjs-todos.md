# WunderGraph Todo App

The Todo App demonstrates how to use WunderGraph with Next.js & Postgres with SWR.

Key features of the App are

- Create, read, update, delete todos
  - Mark Todos as complete
- Optimistic updates
- Drag and drop support with database

## Getting Started

Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

After a while, a new browser tab will open,
If no tab is open, navigate to [http://localhost:3000](http://localhost:3000).

Running WunderGraph will automatically introspect the database and generate an API for you.
You can add more Operations (e.g. Queries or Mutations) by adding more "\*.graphql" files to the directory `./wundergraph/operations`.
Each file becomes an Operation. The Operation name is not relevant, the file name is.

## Updating the Database Schema

Change the `schema.prisma` file and run `npm run migrate %your_migration_name%`,
e.g. `npm run migrate "add pets"`.

## Seeding the Database

Once you've defined one or more Mutations in `./wundergraph/operations` (see CreateTodo.graphql as an example),
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
