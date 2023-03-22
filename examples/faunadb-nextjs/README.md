# WunderGraph FaunaDB Starter

This example demonstrates how to use WunderGraph with [FaunaDB](https://fauna.com/) & [Next.js](https://nextjs.org/).
We are going to make your database accessible through JSON-RPC to your Next.js app.

## Getting Started

### 1. Get FaunaDB credentials:

1.  Create a FaunaDB account.

2.  Create a database with the following options:

    - Name: `test`
    - Region Group: Choose the one that works best for you.
    - [x] Use demo data.

3.  Create a a secret key under `Security`.

    - Database: `test`
    - Role: `Admin`
    - Key Name: `test`

4.  Write down the secret displayed: if you lose it, you have to create
    a new one (the secret is only ever displayed once).

5.  Rename the file `.env.example` to `.env`.

6.  In `.env`:

    - Replace `<replace-with-your-token>` with the secret from step 4.

    - If you selected a Region Group other than Classic,
      replace `https://graphql.fauna.com/graphql` with the GraphQL API
      endpoint suitable for your selected region group:

      - EU: `https://graphql.eu.fauna.com/graphql`
      - US: `https://graphql.us.fauna.com/graphql`
      - Preview: `https://graphql.fauna-preview.com/graphql`

### 2. Install & Start

Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=faunadb-nextjs)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
