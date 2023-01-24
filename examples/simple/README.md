# WunderGraph simple example

#### Getting started

```shell
npm install && npm start
```

#### Get all Continents

```shell
curl http://localhost:9991/operations/Continents
```

#### Get Andorra

```shell
curl --get --data-urlencode 'wg_variables={ "filter": {"code": { "eq": "AD" } } }' \
    --header 'Content-Type: application/json' \
    http://localhost:9991/operations/Countries
```

#### Get user

```shell
curl http://localhost:9991/operations/users/get?id=1
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
