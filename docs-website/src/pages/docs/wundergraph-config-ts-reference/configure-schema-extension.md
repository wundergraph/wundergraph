---
title: Configure Schema Extension
pageTitle: WunderGraph - Configure Schema Extension
description:
---

WunderGraph allows you to extend the GraphQL Schema and replace specific fields with a custom type.
Using introspection configuration, you can specify which fields should be replaced with a custom type, and define the custom types.

WunderGraph supports schema extensions for the following data sources: GraphQL, databases, and REST APIs.

To enable schema extension, you need to set the `schemaExtension` property in the `wundergraph.config.ts` file.
And then, you need to specify which fields should be replaced with a custom type, using the `replaceCustomScalarTypeFields` property.

`schemaExtension` defines the new type and input type that will be added to the GraphQL schema.

`replaceCustomScalarTypeFields` defines which fields should be replaced with the new type.

`entityName` is the name of the GraphQL type either database table or object.

`fieldName` is the name of the field that should be replaced.

`responseTypeReplacement` is the name of the type that should be used as the response type replacement. This type must be defined in the `schemaExtension`.

`inputTypeReplacement` (optional) is the name of the type that should be used as the input type replacement. This type must be defined in the `schemaExtension`.

Let's have a look at an examples.

## GraphQL data-source with custom scalar

```graphql
schema {
  query: Query
}

type Query {
  landpads(limit: Int, offset: Int): [Landpad]
}

scalar geography

type Landpad {
  attempted_landings: String
  details: String
  full_name: String
  id: ID
  landing_type: String
  location: geography
  status: String
  successful_landings: String
  wikipedia: String
}
```

`geography` is a custom scalar, so the client has to know how to handle it.

```typescript
// wundergraph.config.ts
const spacex = introspect.graphql({
  apiNamespace: 'spacex',
  loadSchemaFromString: schema,
  url: 'https://spacex-api.fly.dev/graphql/',
  schemaExtension: `
    type Location {
        latitude: Float
        longitude: Float
        name: String
        region: String
    }
    input LocationInput {
        latitude: Float
        longitude: Float
        name: String
        region: String
    }
  `,
  replaceCustomScalarTypeFields: [
    {
      entityName: 'Landpad',
      fieldName: 'location',
      responseTypeReplacement: 'Location',
      inputTypeReplacement: 'LocationInput',
    },
  ],
})
```

Now the operation looks like this:

```graphql
query {
  spacex_landpads {
    id
    location {
      name
      region
      latitude
      longitude
    }
  }
}
```

## Database with JSON/JSONB columns

Let's say have a table `users` with a JSONB column `contact`:

```
example=# \d users
                                      Table "public.users"
  Column   |           Type           | Collation | Nullable |              Default
-----------+--------------------------+-----------+----------+-----------------------------------
 id        | integer                  |           | not null | nextval('users_id_seq'::regclass)
 email     | text                     |           | not null |
 name      | text                     |           | not null |
 contact   | jsonb                    |           | not null |
 updatedat | timestamp with time zone |           | not null | now()
 lastlogin | timestamp with time zone |           | not null | now()
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_email_key" UNIQUE CONSTRAINT, btree (email)
Referenced by:
    TABLE "messages" CONSTRAINT "messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id)
```

And the record looks like this:

```
id |        email         |       name       |                contact                |           updatedat           |           lastlogin
----+----------------------+------------------+---------------------------------------+-------------------------------+-------------------------------
  1 | jens@wundergraph.com | Jens@WunderGraph | {"type": "mobile", "phone": "001001"} | 2022-10-31 14:06:40.256307+00 | 2022-10-31 14:06:40.257071+00
```

To be able to query the `contact` column, we can use the following configuration:

```typescript
// wundergraph.config.ts
const db = introspect.postgresql({
  apiNamespace: 'db',
  databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
  schemaExtension: `
    type Contact {
        type: String
        phone: String
    }
    input ContactInput {
        type: String
        phone: String
    }
    `,
  replaceCustomScalarTypeFields: [
    {
      entityName: `users`,
      fieldName: `contact`,
      responseTypeReplacement: `Contact`,
      inputTypeReplacement: `ContactInput`,
    },
  ],
})
```

The Query operation will look like this:

```graphql
query {
  db_findFirstusers {
    name
    email
    contact {
      phone
      type
    }
  }
}
```

Mutation:

```graphql
mutation (
  $email: String! @fromClaim(name: EMAIL)
  $name: String! @fromClaim(name: NAME)
  $payload: db_ContactInput!
) @rbac(requireMatchAll: [user]) {
  createOneusers: db_createOneusers(
    data: { name: $name, email: $email, contact: $payload }
  ) {
    id
    name
    email
    contact {
      phone
      type
    }
  }
}
```

## REST API with arbitrary JSON type

```openapi
{
  "openapi": "3.0.0",
  "info": {
    "title": "users",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "http://localhost:8881"
    }
  ],
  "paths": {
    "/users": {
      "get": {
        "summary": "Your GET endpoint",
        "tags": [],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            }
          }
        },
        "operationId": "get-users"
      }
    },
    "/users/{user_id}": {
      "parameters": [
        {
          "schema": {
            "type": "integer"
          },
          "name": "user_id",
          "in": "path",
          "required": true
        }
      ],
      "get": {
        "summary": "Your GET endpoint",
        "tags": [],
        "responses": {
          "200": {
            "description": "OK",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User"
                }
              }
            }
          }
        },
        "operationId": "get-users-user_id"
      }
    },
    "/some/properties": {
      "get": {
        "parameters": [
          {
            "name": "sortBy",
            "in": "query",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "sortOrder",
            "in": "query",
            "schema": {
              "$ref": "#/components/schemas/SortOrder"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PropertiesResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "title": "User",
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "name": {
            "type": "string"
          },
          "country_code": {
            "type": "string"
          },
          "status_code": {
            "$ref": "#/components/schemas/StatusCode"
          },
          "contact": {}
        }
      },
      "PropertiesResponse": {
        "type": "object",
        "properties": {
          "properties": {
            "type": "object",
            "additionalProperties": {
              "type": "string"
            },
            "nullable": true
          }
        },
        "additionalProperties": false
      },
      "SortOrder": {
        "enum": [0, 1],
        "type": "integer",
        "format": "int32"
      },
      "StatusCode": {
        "enum": [0, 1, 2],
        "type": "integer",
        "format": "int32"
      }
    }
  }
}
```

In a similar way to the previous examples, we can use the introspection configuration to replace the `contact` field with a custom type.

```typescript
// wundergraph.config.ts
const users = introspect.openApi({
  apiNamespace: 'users',
  source: {
    kind: 'file',
    filePath: '../users.json',
  },
  baseURL: 'https://localhost/users',
  schemaExtension: `
    type Contact {
        phone: String
    }
    `,
  replaceCustomScalarTypeFields: [
    {
      entityName: `users`,
      fieldName: `contact`,
      responseTypeReplacement: `Contact`,
    },
  ],
})
```
