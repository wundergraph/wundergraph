---
title: Data Sources Reference
description: Reference for all supported data sources
---

WunderGraph supports a variety of data sources. They can be configured in the `wundergraph.config.ts` file by adding introspections to the `apis` configuration.

## Usage

```ts
import { configureWunderGraphApplication, introspect } from '@wundergraph/sdk';

const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
  requestTimeoutSeconds: 10, // optional
});

configureWunderGraphApplication({
  apis: [countries],
});
```

All data sources are configured using the `introspect` function. The `introspect` function takes a configuration object as its only argument. The configuration object depends on the data source you want to configure.

Each introspection supports an `apiNamespace` property. This property is used to namespace the data source in the GraphQL schema, so that any naming collisions can be prevented.

## Supported introspections

| Introspection                                                                                            | Description            |
| -------------------------------------------------------------------------------------------------------- | ---------------------- |
| [`introspect.graphql`](/docs/wundergraph-config-ts-reference/configure-graphql-data-source)              | GraphQL API            |
| [`introspect.postgresql`](/docs/wundergraph-config-ts-reference/configure-postgresql-data-source)        | PostgreSQL database    |
| [`introspect.mysql`](/docs/wundergraph-config-ts-reference/configure-mysql-data-source)                  | MySQL database         |
| [`introspect.planetscale`](/docs/wundergraph-config-ts-reference/configure-planetscale-data-source)      | Planetscale database   |
| [`introspect.sqlite`](/docs/wundergraph-config-ts-reference/configure-sqlite-data-source)                | SQLite database        |
| [`introspect.sqlserver`](/docs/wundergraph-config-ts-reference/configure-sqlserver-data-source)          | SQL Server database    |
| [`introspect.mongodb`](/docs/wundergraph-config-ts-reference/configure-mongodb-atlas-data-source)        | MongoDB database       |
| [`introspect.prisma`](/docs/wundergraph-config-ts-reference/configure-prisma-datasource)                 | Prisma database        |
| [`introspect.federation`](/docs/wundergraph-config-ts-reference/configure-apollo-federation-data-source) | GraphQL Federation API |
| [`introspect.openApi`](/docs/wundergraph-config-ts-reference/configure-openapi-rest-data-source)         | OpenAPI API            |
| [`introspect.soap`](/docs/wundergraph-config-ts-reference/configure-soap-data-source)                    | SOAP                   |

## GraphQL

```typescript
const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
  requestTimeoutSeconds: 10, // optional
});
```

### Properties

| Property                        | Description                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `url`                           | The URL of the GraphQL service                                                                         |
| `apiNamespace`                  | The namespace of the GraphQL service                                                                   |
| `headers`                       | The headers to send with the request                                                                   |
| `requestTimeoutSeconds`         | The timeout for the request in seconds. Defaults to 10 seconds.                                        |
| `introspection`                 | The introspection query to use. Defaults to the introspection query from the `graphql` package         |
| `loadSchemaFromString`          | A function that returns the schema as a string. This is useful if you want to use a local schema file. |
| `customFloatScalars`            | An array of custom float scalars.                                                                      |
| `customIntScalars`              | An array of custom int scalars.                                                                        |
| `customJSONScalars`             | An array of custom JSON scalars.                                                                       |
| `internal`                      | Whether the GraphQL service is internal. Defaults to `false`                                           |
| `skipRenameRootFields`          | An array of root fields to skip renaming.                                                              |
| `schemaExtension`               | A string that is appended to the schema. Useful for adding custom scalars.                             |
| `replaceCustomScalarTypeFields` | An array of custom scalar type fields to replace.                                                      |
| `httpProxyUrl`                  | HTTP(S) proxy to use, overriding the default one (if any). Set to `null` to disable.                   |

## Databases

### Properties

This configuration applies to the following databases:

- PostgreSQL
- MySQL
- Planetscale
- SQLite
- SQL Server
- MongoDB

```typescript
// wundergraph.config.ts

const db = introspect.postgresql({
  apiNamespace: 'wundergraph',
  databaseURL: 'postgres://postgres:postgres@localhost:5432/wundergraph',
  introspection: {
    pollingIntervalSeconds: 5,
  },
});

configureWunderGraphApplication({
  apis: [db],
});
```

| Property                        | Description                                                                |
| ------------------------------- | -------------------------------------------------------------------------- |
| `databaseURL`                   | The connection string to the database                                      |
| `apiNamespace`                  | The namespace of the database                                              |
| `introspection`                 | The introspection configuration                                            |
| `schemaExtension`               | A string that is appended to the schema. Useful for adding custom scalars. |
| `replaceCustomScalarTypeFields` | An array of custom scalar type fields to replace.                          |

## Prisma

You can use the `introspect.prisma` function to configure a Prisma database.

```typescript
// wundergraph.config.ts

const db = introspect.prisma({
  apiNamespace: 'prisma',
  prismaFilePath: 'path/to/prisma/schema.prisma',
});

configureWunderGraphApplication({
  apis: [db],
});
```

### Properties

| Property                        | Description                                                                |
| ------------------------------- | -------------------------------------------------------------------------- |
| `prismaFilePath`                | The path to the Prisma schema file                                         |
| `apiNamespace`                  | The namespace of the database                                              |
| `schemaExtension`               | A string that is appended to the schema. Useful for adding custom scalars. |
| `replaceCustomScalarTypeFields` | An array of custom scalar type fields to replace.                          |

## OpenAPI

You can use the `introspect.openApi` function to configure an OpenAPI API.

```typescript
// wundergraph.config.ts

const jsp = introspect.openApi({
  apiNamespace: 'jsp',
  source: {
    kind: 'file',
    filePath: '../json_placeholder.json',
  },
  introspection: {
    pollingIntervalSeconds: 2,
  },
  requestTimeoutSeconds: 10, // optional
});
configureWunderGraphApplication({
  apis: [jsp],
});
```

### Properties

| Property                        | Description                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `source`                        | The source of the OpenAPI schema. Either a file or a URL.                            |
| `apiNamespace`                  | The namespace of the OpenAPI API                                                     |
| `introspection`                 | The introspection configuration                                                      |
| `schemaExtension`               | A string that is appended to the schema. Useful for adding custom scalars.           |
| `replaceCustomScalarTypeFields` | An array of custom scalar type fields to replace.                                    |
| `httpProxyUrl`                  | HTTP(S) proxy to use, overriding the default one (if any). Set to `null` to disable. |

## GraphQL Federation

You can use the `introspect.federation` function to configure a GraphQL Federation API.

```typescript
// wundergraph.config.ts

const federatedApi = introspect.federation({
  apiNamespace: 'federated',
  upstreams: [
    {
      url: 'http://localhost:4001/graphql',
    },
    {
      url: 'http://localhost:4002/graphql',
    },
  ],
});

configureWunderGraphApplication({
  apis: [federatedApi],
});
```

### Properties

| Property                        | Description                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `upstreams`                     | An array of upstreams to use for the federation.                                     |
| `apiNamespace`                  | The namespace of the GraphQL Federation API                                          |
| `introspection`                 | The introspection configuration                                                      |
| `schemaExtension`               | A string that is appended to the schema. Useful for adding custom scalars.           |
| `replaceCustomScalarTypeFields` | An array of custom scalar type fields to replace.                                    |
| `httpProxyUrl`                  | HTTP(S) proxy to use, overriding the default one (if any). Set to `null` to disable. |

## SOAP

You can use the `introspect.soap` function to configure a SOAP API.

```typescript
// wundergraph.config.ts
const greeting = introspect.soap({
  apiNamespace: 'greeting',
  source: {
    kind: 'file',
    filePath: './greeting.wsdl',
  },
  headers: (builder) =>
    builder.addClientRequestHeader('X-Authorization', 'Authorization').addStaticHeader('X-Static', 'Static'),
});
configureWunderGraphApplication({
  apis: [greeting],
});
```

### Properties

| Property       | Description                          |
| -------------- | ------------------------------------ |
| `apiNamespace` | The namespace of the SOAP API        |
| `source`       | The source of the SOAP wsdl. File.   |
| `headers`      | The headers to send with the request |
