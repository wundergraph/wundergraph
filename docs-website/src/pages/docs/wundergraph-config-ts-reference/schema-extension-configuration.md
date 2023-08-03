---
title: Schema Extension Configuration
description: How to extend the GraphQL Schema of an origin and replace specific fields with a custom type.
---

WunderGraph allows you to extend the GraphQL Schema of an origin and replace specific fields with a custom type.
This is useful when you're integrating with a GraphQL API that uses custom scalars.
Instead of using a generic `JSON` scalar, you can replace it with a dedicated, intuitive, and more meaningful type
definition to improve type-safety and create a superior developer experience.

Custom Schema Extensions are supported for GraphQL, REST (OAS), and database-generated APIs.
WunderGraph also allows you to directly integrate with databases like PostgreSQL, MySQL, or MongoDB—all of which
support `JSON` data types.

But that's not all.
With a generic `JSON` scalar, users can use any legal JSON value as an input without any guarantee on its
contents.
With Custom Schema Extensions, you'll automatically receive JSON Schema validation for the input while being able to
store the same value in a JSON/JSONB column.

## Enabling Schema Extensions

{% callout type="note" %}
If you are _replacing_ a JSON scalar, you do not need to include it in the `customJSONScalars` array.
However, if it is not being replaced, the scalar type will be inferred as a TypeScript `string` unless it is added to
the `customJSONScalars` array.
{% /callout %}

There are two mandatory steps to enabling Schema Extensions.
First, you must provide the `schemaExtension` itself in your `wundergraph.config.ts` file.
Add the `schemaExtension` property to the introspection configuration for a data source.
Inside this property, provide the GraphQL schema that will extend your original schema.
In particular, it should contain the definition of all the custom types that you'll use to replace custom scalars in
the original schema.

`schemaExtension` is a string representation of the GraphQL schema defining the new custom types that will be added to
the original GraphQL schema.

Next, add the `replaceCustomScalarTypeFields` property.
Inside this property, you will need to add a separate definition object for each and every replacement.

`replaceCustomScalarTypeFields` is an object array that defines where and what replacements should happen.
Each object defines the name of the field whose custom scalar type will be replaced, the name of the "parent" (type)
to which the field belongs, and the name of a replacement custom type that was defined in the `schemaExtension`.

The three properties that comprise the object are further defined below:

{% callout type="warning" %}
From wundergraph/sdk version 0.162.0, `inputTypeReplacement` has been deprecated and will be ignored.
Moreover, `entityName` and `fieldName` are exact matching (and case-sensitive).
Please create a separate replacement definition object for each and every field you wish to replace
(including GraphQL Inputs).
{% /callout %}

`entityName` is the exact, case-sensitive name of the GraphQL type (Object or Input).
For database-generated APIs, it may represent a database table.

`fieldName` is the exact, case-sensitive name of the field whose type should be replaced.

`responseTypeReplacement` is the exact, case-sensitive name of the type that should be used as the response or input.
This type must be defined in `schemExtension`.

### An important note on interfaces

If the field whose type you wish to replace exists on an interface that the parent implements, the interface field
response type will also be replaced.
Consequently, when replacing a field that exists on an interface, replacement definitions for all Object types that
implement that interface must be added to the `replaceCustomScalarTypeFields` object array.

## Examples

Let's take a look at some examples.

### GraphQL data source with custom scalar

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
    },
    {
      entityName: 'LandpadInput',
      fieldName: 'location',
      responseTypeReplacement: 'LocationInput',
    },
  ],
});
```

Now the query operation looks like this:

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

### GraphQL data source with custom scalars and interfaces

```graphql
schema {
  query: Query
}

type Query {
  gymleader(id: ID!): GymLeader
}

scalar HumanJSON

interface Human {
  details: HumanJSON
}

scalar TrainerJSON

interface Trainer {
  teamData: TrainerJSON
}

type GymLeader implements Human & Trainer {
  id: ID!
  badgeNumber: Int
  details: HumanJSON
  teamData: TrainerJSON
}

type Friend implements Human {
  id: ID!
  details: HumanJSON
}
```

`details` and `teamData` are each fields that are defined on an implemented interface.
Their respective types, `HumanJSON` and `TrainerJSON`, are custom scalars.
For interface implementation to remain valid, the interface types must also be replaced.

{% callout type="warning" %}
If an object implements one or more interfaces, and you are replacing a field's response type that exists on one of
those interfaces, you must add replacement definitions for all other Objects types that implement those interfaces.
{% /callout %}

```typescript
// wundergraph.config.ts
const gymLeaders = introspect.graphql({
  apiNamespace: 'gymleaders',
  loadSchemaFromString: schema,
  url: 'http:/0.0.0.0/4000/graphql',
  schemaExtension: `
    type Details {
        name: String
        age: Int
    }
    type TeamData {
        highestLevel: Int
        typeSpeciality: String
    }
  `,
  replaceCustomScalarTypeFields: [
    {
      entityName: 'GymLeader',
      fieldName: 'details',
      responseTypeReplacement: 'Details',
    },
    {
      entityName: 'GymLeader',
      fieldName: 'teamData',
      responseTypeReplacement: 'TeamData',
    },
    {
      entityName: 'Friend',
      fieldName: 'details',
      responseTypeReplacement: 'Details',
    },
  ],
});
```

Now the query operation might look like this:

```graphql
query {
  gymleader(id: "1") {
    id
    badgeNumber
    details {
      name
      age
    }
    teamData {
      highestlevel
      typeSpeciality
    }
  }
}
```

And a snippet of the new schema:

```graphql
# the rest of the schema is omitted for brevity
interface Human {
  details: Details
}

interface Trainer {
  teamData: TeamData
}

type GymLeader implements Human & Trainer {
  id: ID!
  badgeNumber: Int
  details: Details
  teamData: TeamData
}

type Friend implements Human {
  id: ID!
  details: Details
}
```

### Database with JSON/JSONB columns

Let's say we have a table `users` with a JSONB column `contact`:

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
    },
    {
      entityName: `usersCreateInput`,
      fieldName: `contact`,
      responseTypeReplacement: `ContactInput`,
    },
  ],
});
```

The query operation will look like this:

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

Without the Custom Schema Extension, you wouldn't be able to select the `phone` and `type` fields.

Mutation:

```graphql
mutation ($email: String! @fromClaim(name: EMAIL), $name: String! @fromClaim(name: NAME), $payload: db_ContactInput!)
@rbac(requireMatchAll: [user]) {
  createOneusers: db_createOneusers(data: { name: $name, email: $email, contact: $payload }) {
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

As we're generating an input type as well (`db_ContactInput`), users cannot use any arbitrary JSON data as input
but need to specify the `phone` and `type` fields.

### REST API with arbitrary JSON type

This example explains how to use the Custom Schema Extension to add a custom type to an existing REST API.

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

In a similar way to the previous examples, we can use the introspection configuration to replace the `contact` field
with a custom type:

```typescript
// wundergraph.config.ts
const users = introspect.openApiV2({
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
});
```
