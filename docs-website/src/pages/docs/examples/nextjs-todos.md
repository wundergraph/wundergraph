---
title: Next.js Todo App Example
pageTitle: WunderGraph - Examples - Next.js Todo App
description:
---

## Introduction

This Todo App demonstrates how to use WunderGraph with Next.js & PostgreSQL.

Key features of the App are:

- Create, read, update, delete todos
  - Mark todos as complete
  - Reorder todos
- Optimistic updates

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

## Cleanup

```shell
npm run cleanup
```

## Learn more

- [Guides](/docs/guides)
- [Next.js client documentation](/docs/clients-reference/nextjs)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use [WunderGraph Cloud](https://cloud.wundergraph.com). Enable the [Vercel integration](https://vercel.com/integrations/wundergraph) to deploy the Next.js frontend to Vercel.

{% deploy template="nextjs-todos" /%}
