# WunderGraph example with PostgreSQL

#### Getting started

```shell
pnpm install && pnpm start:database && pnpm dev
```

#### Get Dragons

```shell
curl -X GET http://localhost:9991/operations/Dragons
```

#### Get Missions

```shell
curl -X GET http://localhost:9991/operations/Missions
```

#### Call your custom GraphQL server

```shell
curl -X GET http://localhost:9991/operations/Hello
```
