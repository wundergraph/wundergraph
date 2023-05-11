# WunderGraph subscriptions example - graphql-hasura

### Configuration

- Go to: https://hasura.io/learn/graphql/graphiql

You will need to complete a simple signup form (just mail and password) to get access to the
GraphiQL interface, and obtain token. Make sure you copy the entire token, since it
overflows its bounding box.

- Copy .env.example to .env
- Set your token as HASURA_AUTH_TOKEN=your_token (e.g. Bearer ey...)

#### Getting started

```shell
npm install && npm start
```

#### Check results

```shell
curl -N http://localhost:9991/operations/Users
```

```shell
curl -N http://localhost:9991/operations/Todo
```

#### SSE output

```shell
 curl -N http://localhost:9991/operations/Users\?wg_sse\=true
```

#### TS operation

```shell
curl -N http://localhost:9991/operations/users/get?id=1
```

#### Playground

Use https://hasura.io/learn/graphql/graphiql to add new users and todos, and explore schema.
Add new operations to the `.wundergraph/operations` folder and run `npm start` to see the results.

## Test the API

1. (Optional) Copy the `.env.example` file to `.env.test` and fill in the required values.
2. Run the following command:

```shell
npm run test
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=graphql-hasura-subscriptions)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
