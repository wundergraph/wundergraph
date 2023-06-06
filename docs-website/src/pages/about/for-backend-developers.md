---
title: 'WunderGraph for Backend Developers'
tags: []
date: 2023-04-09
description: ''
---

A typical task for backend developers is to create an abstraction on top of existing internal or external services.
The pattern to describe the solution to this problem is usually called Backend for Frontend or short BFF.
But how do you implement a BFF actually? What are the steps you need to take?

## The Problem

Let's say you have a frontend application that needs to integrate with multiple services.
The frontend application needs to integrate with a payment service, a user service, and a product service.

Here are the steps you need to take to build the BFF for this use case:

1. You have to make decisions what technology to use for the BFF
2. What kind of contract will the BFF have with the frontend?
3. Should you expose the BFF as a REST API or GraphQL, or even RPC?
4. How do you handle authentication? You'll probably want to delegate this to a Identity Provider
5. How will you ingest upstream API definitions?
6. How do you combine multiple APIs of different API styles (OpenAPI, GraphQL, SOAP, etc.)?
7. How do you handle caching?
8. How do you handle error handling?
9. How should you implement tracing, logging and analytics?
10. What about security? Input validation, etc.?
11. If you're building a BFF for a Frontend, how will you generate a type-safe and developer-friendly client?
12. How will you implement realtime APIs (e.g. GraphQL subscriptions) if that's a requirement?
13. How will you package and deploy your BFF?
14. How will you monitor your BFF?

As you can see, there are a lot of decisions to make.
It's probably going to take a few months until you have a good first version of your BFF ready,
and that's really just the starting point of your journey.
You'll eventually run into edge cases and limitations of your first design,
so you'll have to refactor some big chunks of the codebase after a year.

But why? Why not start with a BFF Framework that already made a lot of these decisions for you?
Over the last few years, we've seen all kinds of use cases and requirements for BFFs from one-man startups to large enterprises.
With a Framework like WunderGraph, you'll not always agree with all the decisions that were made,
but you'll have a head start of many man-years of experience,
allowing you to really focus on the functionality that brings value to your business instead of inventing the wheel again and again.

## The Solution

So, how does WunderGraph help you to build a BFF?

There are three core concepts in WunderGraph that make the process of building a BFF much easier.
Instead of manually generating SDKs, or even worse, writing glue code by hand.
WunderGraph abstracts away this whole process and gives you a developer-friendly API to build your BFF.

1. APIs as Dependencies
2. API Namespacing
3. API Composition

### APIs as Dependencies

In WunderGraph, you can introspect APIs using their specification, e.g. an OpenAPI definition, a GraphQL schema, or a WSDL.
This is similar to how you would install a package from npm.
WunderGraph will introspect all APIs and generate a GraphQL Schema across all APIs
as well as a GraphQL Execution Layer that allows you to talk to this unified API layer.

But there's a problem: When combining multiple APIs, you'll run into naming conflicts.

### API Namespacing

To solve this problem, we've introduced the concept of API Namespacing.
You can and should apply a namespace to every API you add to your BFF.
This doesn't just solve the naming conflict problem,
but also makes it very convenient to "look up" the right API when you're implementing your BFF.

API namespacing is similar to modules in programming languages.
You can import a module from an external dependency,
and you're able to rename it when importing it to avoid naming conflicts.

### API Composition

The last core concept is API Composition, building on top of the previous two.

API Composition is the overarching concept behind WunderGraph.
Instead of manually writing glue code or integrating APIs semi-automatically,
API Composition allows you to compose APIs like modules.

Add your API dependencies to your BFF.
WunderGraph generates a GraphQL & TypeScript ORM on top of your APIs.
You implement your BFF either by writing GraphQL Operations or,
in more complex scenarios, by writing custom TypeScript Operations that use the TypeScript ORM.

You don't have to manually import or generate SDKs.
All APIs are automatically instrumented with tracing, logging, and analytics.
All you have to do is to implement the business logic of your BFF.

## Examples

### Configure WunderGraph

```ts {% filename="wundergraph.config.ts" %}
import { configureWunderGraphApplication, introspect, authProviders, EnvironmentVariable } from '@wundergraph/sdk';
import operations from './wundergraph.operations';
import server from './wundergraph.server';

const pg = introspect.postgresql({
  apiNamespace: 'pg',
  databaseURL: new EnvironmentVariable('PG_DATABASE_URL'),
});

const stripe = introspect.openApiV2({
  id: 'stripe',
  apiNamespace: 'stripe',
  source: {
    kind: 'file',
    filePath: './stripe.yaml',
  },
  headers(builder) {
    return builder.addClientRequestHeader('Authorization', `Bearer ${process.env.STRIPE_SECRET_KEY}`);
  },
});

configureWunderGraphApplication({
  apis: [pg, stripe],
  server,
  operations,
  generate: {
    codeGenerators: [],
  },
  authentication: {
    cookieBased: {
      providers: [
        authProviders.auth0({
          id: 'auth0',
          issuer: new EnvironmentVariable('AUTH0_ISSUER'),
          clientId: new EnvironmentVariable('AUTH0_CLIENT_ID'),
          clientSecret: new EnvironmentVariable('AUTH0_CLIENT_SECRET'),
        }),
      ],
      authorizedRedirectUris: ['http://localhost:3000'],
    },
  },
});
```

### Write your operations

You can use GraphQL to query your database or write TypeScript operations if you need to do more complex things, like transforming data.

Note that the `pg_` prefix is the namespace that we configured for the Postgres datasource.

In this operation we fetch the current user and also fetch the subscription details from Stripe.

```ts {% filename="operations/CurrentUser.graphql" %}
query ($userId: String! @fromClaim(name: USERID)) {
  currentUser: pg_findFirstUser(where: { id: { equals: $userId } }) {
    id
    email
    name
    bio
    subscriptionId @export(as: subscriptionId)
    _join
    	subscription: stripe_GetSubscriptionsSubscriptionExposedId(subscription_exposed_id: $subscriptionId) {
		... on stripe_Subscription_ {
			customer {
				id
			}
			currency
			days_until_due
			status
		}
	}
  }
}
```

## Share Postman collection and OpenAPI Specification

WunderGraph also generates an Postman collection and OpenAPI Specification for your BFF.

### Postman collection

```json {% filename="wundergraph.postman.json" %}
{
  "item": [
    {
      "_": {
        "postman_id": "operations"
      },
      "id": "operations",
      "name": "operations",
      "item": [
        {
          "id": "users",
          "name": "users",
          "item": [
            {
              "id": "users/get",
              "name": "get",
              "request": {
                "url": {
                  "path": ["operations", "users", "get"],
                  "host": ["{{apiBaseUrl}}"],
                  "query": [
                    {
                      "disabled": true,
                      "description": {
                        "content": "Type number, Optional",
                        "type": "text/plain"
                      },
                      "key": "id",
                      "value": ""
                    }
                  ],
                  "variable": []
                },
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json"
                  }
                ],
                "method": "GET"
              },
              "response": [],
              "event": []
            }
          ]
        }
      ]
    }
  ]
}
```

### Open API Specification

```json {% filename="wundergraph.openapi.json" %}
{
  "openapi": "3.1.0",
  "info": {
    "title": "WunderGraph Application",
    "version": "0"
  },
  "servers": [
    {
      "url": "http://localhost:9991/operations"
    }
  ],
  "paths": {
    "/users/get": {
      "get": {
        "operationId": "UsersGet",
        "x-wundergraph-operation-type": "query",
        "x-wundergraph-requires-authentication": false,
        "parameters": [
          {
            "name": "id",
            "description": "Type: number",
            "in": "query",
            "required": true,
            "allowEmptyValue": false,
            "schema": {
              "type": "number"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "bio": {
                      "type": "string"
                    },
                    "id": {
                      "type": "number"
                    },
                    "userName": {
                      "type": "string"
                    }
                  },
                  "required": ["id", "userName"]
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/InvalidInputError"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Conclusion

Our goal with WunderGraph is to make Developers more productive when building BFFs,
and to improve the quality and security of BFFs while at the same time reducing the complexity and time to market.

## Learn more

- [WunderGraph Configuration reference](/docs/wundergraph-reference)
