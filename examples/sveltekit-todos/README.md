# WunderGraph Todo App

The Todo App demonstrates how to use WunderGraph with Sveltekit & PostgreSQL.

Key features of the App are:

- Create, read, update, delete todos
  - Mark todos as complete
  - Reorder todos
- Optimistic updates

## Getting Started

1. Copy the `.env.example` file to `.env` and fill in the required values.
2. Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

After a while, a new browser tab will open,
If no tab is open, navigate to [http://localhost:5173](http://localhost:5173).

Running WunderGraph will automatically introspect the database and generate an API for you.
You can add more Operations (e.g. Queries or Mutations) by adding more "\*.graphql" files to the directory `./wundergraph/operations`.
Each file becomes an Operation. The Operation name is not relevant, the file name is.

## Updating the Database Schema

Change the `schema.prisma` file and run `npm run migrate %your_migration_name%`,
e.g. `npm run migrate "add pets"`.

## Cleanup

```shell
npm run cleanup
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

Read the [Sveltekit Quickstart](https://docs.wundergraph.com/docs/getting-started/sveltekit-quickstart) 

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!