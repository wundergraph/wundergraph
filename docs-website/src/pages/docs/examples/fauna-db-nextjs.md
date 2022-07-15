---
title: FaunaDB Next.js Example
pageTitle: WunderGraph - Examples - FaunaDB Next.js
description:
---

[The FaunaDB example](https://github.com/wundergraph/wundergraph/tree/main/examples/faunadb-nextjs) shows how you can use WunderGraph with FaunaDB and Next.js.

WunderGraph integrates with [FaunaDB](/docs/supported-data-sources/faunadb) out of the box,
no complex configuration is required.

## Prerequisites

Before we can start, you've got to set up a FaunaDB account and create a database.
Please follow the steps below.

1. Create a FaunaDB account.
2. Create a database with the following options:

- Name: `test`
- RegionGroup: `Classic (C)`
- [x] Use demo data.

3. Create a API token under `Security`.

- Database: `test`
- Role: `Admin`
- Key Name: `test`

4. Rename the file `example.env` to `.env` and fill it with your FaunaDB credentials.

## Configuration

Once the environment is set up, we're ready to configure our application.

```typescript
// wundergraph.config.ts
const faunaDB = introspect.graphql({
  apiNamespace: 'faunaDB',
  url: 'https://graphql.fauna.com/graphql',
  headers: (builder) =>
    builder.addStaticHeader(
      'Authorization',
      new EnvironmentVariable('FAUNADB_TOKEN')
    ),
})

const myApplication = new Application({
  name: 'app',
  apis: [faunaDB],
})
```

This configuration will add faunaDB as a data source and configures the API key to be used.
The API key of your faunaDB instance is not exposed to the client,
making it a perfect fit to secure your API.

## Add an Operation

Now that everything is configured, let's add an Operation.

```graphql
# .wundergraph/operations/AllStores.graphql
query AllStores {
  allStores: faunaDB_allStores {
    data {
      _id
    }
  }
}
```

## Calling the Operation from Next.js

```typescript
const Home: NextPage = () => {
  const stores = useQuery.AllStores()
  return (
    <div>
      {stores.data?.allStores.data?.map((store) => (
        <div>{store._id}</div>
      ))}
    </div>
  )
}
export default withWunderGraph(Home)
```

And that's it! We've fully integrated FaunaDB, WunderGraph and Next.js.
