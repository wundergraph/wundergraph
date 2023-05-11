# WunderGraph schema extension example

#### Configuration

Check schema extension configuration [doc](https://docs.wundergraph.com/docs/wundergraph-config-ts-reference/configure-schema-extension).

#### Getting started

1. Copy the `.env.example` file to `.env` and fill in the required values.
2. Install the dependencies and run the complete example in one command:

```shell
npm install && npm start
```

#### Get Landpad

```shell
curl -N http://localhost:9991/operations/Image
```

#### Get Users

```shell
curl -N http://localhost:9991/operations/Users
```

#### Create User

```shell
curl -d '{"email":"test@wundergraph.com","name":"Test","payload": {"type":"mobile","phone":"12345"}}' -H "Content-Type: application/json" -X POST http://localhost:9991/operations/User
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
