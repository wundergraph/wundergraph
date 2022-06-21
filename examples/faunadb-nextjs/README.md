# WunderGraph FaunaDB Starter

This example demonstrates how to use WunderGraph with [FaunaDB](https://fauna.com/) & [Next.js](https://nextjs.org/). We are going to make your database accessible through JSON-RPC to your Next.js app.

## Getting Started

### 1. Get FaunaDB credentials:

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

### 2. Install & Start

Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

### 3. Fetch All Stores & Products

Visit [http://localhost:3000/](http://localhost:3000/).

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
