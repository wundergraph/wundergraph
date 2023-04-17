---
title: 'WunderGraph for FullStack Developers'
tags: []
date: 2023-04-09
description: ''
---

As a FullStack Developer, here’s the typical flow of how a project might evolve.

1. You start out with Next.js, choose a CSS or UI component Framework and start building out the UI flows
2. Next, you add Authentication. You either add a library like NextAuth or you integrate with an Identity provider like Auth0 or Clerk
3. You implement more user flows that depend on a database, so you’ll add a service like Planetscale and Prisma, Drizzle or another ORM to get moving
4. Your user flows need a powerful API layer, so you might be choosing tRPC and start implementing more flows
5. Your Product evolves, so you’re adding third party services for payments, transactional email, background jobs, and more. All of these come with an SDK, each behaving a bit differently, but eventually you’ll bring it all together.

Building up your dream stack was fun, and only took you a couple of days.
At the same time, you were not yet able to build a production ready application.
As it turns out, creating a complete stack requires a lot of work,
especially when the framework you're relying on is not designed for API Composition,
but rather low level.

E.g. in case of Next.js, you'll have to manually find good patterns for implementing Authentication,
integrating APIs, making sure your API layer is secure, and you have good type-safe developer experience.

But why is that actually? Why start from scratch when you can build on top of a solid foundation?
And that's exactly what WunderGraph does.

## How WunderGraph improves the FullStack Developer workflow

Designing your own composed API layer means that you have to make a lot of decisions.
However, it's usually not clear from the beginning what edge cases you'll run into.
By designing your own API composition layer, you're taking on a lot of responsibility.
You need to ask yourself if you want to maintain this layer of the codebase,
or if it's just a distraction from your core business.

In most cases, you'll definitely want to outsource this part of the codebase into a Framework with more experience.
If you're running into an edge case, it's likely that someone else experienced the same problem before,
and there might already be a solution or pattern for it.
In contrast, if you're building your own API composition layer from scratch,
you'll have to figure out the solution yourself.

So, how does WunderGraph help you here?
How does the Development Workflow look like using WunderGraph?

1. Use your Framework of choice, WunderGraph integrates with all of them
2. Configure your Auth provider
3. Configure your Database, WG works well with your favourite Database, like PostgresQL, Planetscale, Neon.tech, MongoDB and more
4. Add your API dependencies, like Stripe, Mailgun, Sendgrid, and more (GraphQL & OpenAPI supported)
5. WunderGraph now automatically composes your API layer and generates a GraphQL/TypeScript ORM on top of all your API dependencies
6. Use the generated ORM to define your API Operations
7. Use the generated type-safe client to call your BFF Operations from the Frontend
8. If you'd like to share your BFF with other teams, you can use the generated OpenAPI Specification

## Benefits of using WunderGraph as a FullStack Developer

As you can see from the workflow, a lot of the manual work is now automated and handled by WunderGraph.
Instead of having to make a lot of decisions or writing glue code,
you can configure most of the API Composition layer.
If you're running into edge cases, you can always add custom code to your BFF using TypeScript,
but in most cases, you can "stay on the rails" and move fast.

## Example

Let's take a look at a real-world example.

We use a Postgres database, Auth0 for authentication and Stripe for payments.

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
  codeGenerators: [
    {
      templates: [...templates.typescript.all],
    },
  ],
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

### Fetch the operation in your Frontend

We can now use the generated client to fetch the operation in Next.js.

```ts {% filename="pages/profile.tsx" %}
import { useQuery, withWunderGraph } from '~/generated/nextjs';
import { useRouter } from 'next/router';

function ProfilePage() {
  const router = useRouter();
  const { data, error, isLoading } = useQuery({
    operationName: 'CurrentUser',
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data.user) {
    return <div>User not found</div>;
  }

  return (
    <div>
      <h1>{data.user.name}</h1>
      <p>Email: {data.user.email}</p>
      <p>Subscription Status: {data.user.subscription?.status}</p>
    </div>
  );
}

// This enables SSR for the page, you can add this to _app.tsx to enable SSR for all pages.
export default withWunderGraph(ProfilePage);
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

## Learn more

- [Next.js Example](/docs/examples/nextjs)
- [WunderGraph Configuration reference](/docs/wundergraph-reference)
