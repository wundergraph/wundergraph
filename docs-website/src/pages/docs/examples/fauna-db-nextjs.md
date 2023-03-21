---
title: FaunaDB Next.js Example
pageTitle: WunderGraph - Examples - FaunaDB Next.js
description:
---

[The FaunaDB example](https://github.com/wundergraph/wundergraph/tree/main/examples/faunadb-nextjs) shows how you can use WunderGraph with FaunaDB and Next.js.

WunderGraph integrates with [FaunaDB](/docs/supported-data-sources/faunadb) out of the box, no complex configuration is required.

## Prerequisites

Before we can start, you've got to set up a FaunaDB account and create a database.
Please follow the steps below.

1.  Create a FaunaDB account.

2.  Create a database with the following options:

    - Name: `test`
    - Region Group: Choose the one that works best for you.
    - [x] Use demo data.

3.  Create a API token under `Security`.

    - Database: `test`
    - Role: `Admin`
    - Key Name: `test`

4.  Write down the secret displayed: if you lose it, you have to create
    a new one (the secret is only ever displayed once).

5.  Rename the file `example.env` to `.env`.

6.  In `.env`:

    - Replace `<replace-with-your-token>` with the secret from step 4.

    - If you selected a Region Group other than Classic,
      replace `https://graphql.fauna.com/graphql` with the GraphQL API
      endpoint suitable for your selected region group:

      - EU: `https://graphql.eu.fauna.com/graphql`
      - US: `https://graphql.us.fauna.com/graphql`
      - Preview: `https://graphql.fauna-preview.com/graphql`

## Configuration

Once the environment is set up, we're ready to configure our application.

```typescript
// wundergraph.config.ts
const faunaDB = introspect.graphql({
  apiNamespace: 'faunaDB',
  url: new EnvironmentVariable('FAUNADB_GRAPHQL_URL'),
  headers: (builder) => builder.addStaticHeader('Authorization', new EnvironmentVariable('FAUNADB_TOKEN')),
});

configureWunderGraphApplication({
  apis: [faunaDB],
});
```

This configuration adds `faunaDB` as a data source and configures the API key to be used.
The API key of your FaunaDB instance is not exposed to the client, making it a perfect fit to secure your API.

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
  const stores = useQuery({ operationName: 'AllStores' });
  return (
    <div>
      {stores.data?.allStores.data?.map((store) => (
        <div>{store._id}</div>
      ))}
    </div>
  );
};
export default withWunderGraph(Home);
```

And that's it! We've fully integrated FaunaDB, WunderGraph and Next.js.

## Learn more

- [Guides](/docs/guides)
- [Next.js client documentation](/docs/clients-reference/nextjs)
- [FaunaDB documentation](https://docs.fauna.com/fauna/current)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use [WunderGraph Cloud](https://cloud.wundergraph.com). Enable the [Vercel integration](https://vercel.com/integrations/wundergraph) to deploy the Next.js frontend to Vercel.

{% deploy template="nextjs" /%}
