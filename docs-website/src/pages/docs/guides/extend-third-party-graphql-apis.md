---
title: Extend Third Party GraphQL APIs
pageTitle: WunderGraph - Extend Third Party GraphQL APIs
description: This guide shows how to extend third party GraphQL APIs with WunderGraph
---

Let's assume you want to extend a third party GraphQL API with a custom field.
You have no control over the API and can't change it.
This guide shows you how to extend the Schema and add custom logic to the Gateway to resolve the custom field.

## Extend the Schema

First, we need to introspect the API and extend the Schema with the custom field.

```typescript
// wundergraph.config.ts
const spacex = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
  schemaExtension: `
	extend type Capsule {
		specification: String
	}
	`,
});
```

In this case, we extend the `Capsule` type with a custom field called `specification`.
The specification field will be a computed field combining `id` and `type`.

Note that we use the `extend` keyword to extend the type.
If you're familiar with API Namespacing, you can see that we're not using a namespace when extending the type.
That's because the Schema Extension is applied before namespacing.

Also, worth noting is that the `specification` is of type `String`, which means that it's nullable.
This is important because the WunderGraph Engine will not be able to resolve the field from the third party API.
This means, the field will come back as `null` from the Engine Resolver.

## Resolve the custom field

You're now able to extend the Schema and understand that the field will come back as `null`.
Let's add some custom logic to resolve the field.

Before we can add custom logic, we need to create an Operation that uses the extended Schema.

```graphql
# .wundergraph/operations/Capsule.graphql
{
  spacex_capsule(id: "C205") {
    id
    type
    status
    specification
  }
}
```

As you can see, we're querying the `specification` on the `Capsule` type alongside other fields from the third party API.
Now let's add a hook to resolve the field.

```typescript
// wundergraph.server.ts
export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {
      Capsule: {
        mutatingPostResolve: async ({ response }) => {
          return {
            ...response,
            data: {
              ...response.data,
              spacex_capsule: {
                ...response.data?.spacex_capsule,
                specification: `${response.data?.spacex_capsule?.id} - ${response.data?.spacex_capsule?.type}`,
              },
            },
          };
        },
      },
    },
  },
}));
```

We're adding a `mutatingPostResolve` hook to the `Capsule` query.
This hook is called after the Engine Resolver has resolved the other fields from the third party API.

The final response will look like this:

```json
{
  "data": {
    "spacex_capsule": {
      "id": "C205",
      "type": "Dragon 1.1",
      "status": "retired",
      "specification": "C205 - Dragon 1.1"
    }
  }
}
```

## Conclusion

You've learned how to extend third party GraphQL APIs with WunderGraph.
In the example, we've simply added a custom field which is computed from other fields.
However, you can add any custom logic to the `mutatingPostResolve` hook,
e.g. you could call another API to fetch additional data and add it to the response.
