---
title: TypeScript Hooks to Customize the API Gateway Middleware
pageTitle: WunderGraph - Features - TypeScript Hooks to Customize the API Gateway Middleware
description: It's important to be able to customize the API Gateway middleware. With WunderGraph, you're able to use TypeScript to make this as easy as possible.
---

One of the strengths of WunderGraph is customization.
With Hooks, you gain full control over the Request Lifecycle and can manipulate requests easily.

> Our goal is to create the best possible Developer Experience for customization.

You can rewrite an incoming request and manipulate the Inputs of an Operation.
Once the request was resolved, you're able to "hook" into the Request Lifecycle again and manipulate the response before sending it back to the client.

WunderGraph Hooks are similar to WebHooks, but TypeSafe, easy to test and easy to integrate into your WunderGraph applications.

So, how are WunderGraph Middleware Hooks different and what do we mean by TypeSafe?

Let's look at an example Operation using the SpaceX API:

```graphql
query Missions($find: MissionsFind) {
  missions(find: $find) {
    id
    description
    manufacturers
    name
  }
}
```

This Operation will generate a JSON RPC Endpoint as well as TypeScript models for both Inputs and the Response.

With Hooks, we're extending this with one addition, we're scaffolding a TypeSafe Hooks Configuration that allows you to write your Hooks using TypeScript.
Here's how it looks like for the Operation above:

```typescript
// all of this is generated
export interface HooksConfig {
  global?: GlobalHooksConfig;
  authentication?: {
    postAuthentication?: (hook: AuthenticationHookRequest) => Promise<void>;
    mutatingPostAuthentication?: (hook: AuthenticationHookRequest) => Promise<AuthenticationResponse>;
    revalidate?: (hook: AuthenticationHookRequest) => Promise<AuthenticationResponse>;
  };
  queries?: {
    Dragons?: {
      mockResolve?: (hook: HookRequest) => Promise<DragonsResponse>;
      preResolve?: (hook: HookRequest) => Promise<void>;
      postResolve?: (hook: HookRequest & HookRequestWithResponse<DragonsResponse>) => Promise<void>;
      customResolve?: (hook: HookRequest) => Promise<void | DragonsResponse>;
      mutatingPostResolve?: (hook: HookRequest & HookRequestWithResponse<DragonsResponse>) => Promise<DragonsResponse>;
    };
  };
}
```

You're able to define 5 distinct hooks:

1. `mockResolve`
2. `preResolve`
3. `mutatingPreResolve`
4. `postResolve`
5. `mutatingPostResolve`.

The pre- and postResolve hooks are good for logging or side effects, e.g. sending an E-Mail after a mutation.
Mutating Hooks can be used to "mutate" the Request, e.g. change the input variables (preResolve) or modify the response (postResolve).

There are also hooks for authentication, e.g. `mutatingPostAuthentication` that allow you to modify the resulting user object or even deny the user access.
Global hooks allow you to customize the requests and responses between API gateway and origin.
This is useful, e.g. if you'd like to sign requests or add per-request authentication headers.

As you can see from the HooksConfig definition, all hooks are TypeSafe, inputs as well as response type definitions are checked.
We automatically generate all of this from your Operations to give you the ultimate developer experience.

Finally, have a look at an example hook implementation.
Hooks need to be implemented in the `wundergraph.server.ts` file.

```typescript
export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {
      // generated
      Dragons: {
        // generated
        async mutatingPreResolve({ input }) {
          // user defined
          return {
            ...input,
            find: {
              ...input.find,
              name: 'Telstar',
            },
          }
        },
      },
    },
  },
})
```

In this case, we're hard-coding the `find` variable before the execution starts.
Other examples would be to use the user object from the Context (ctx) to manipulate the input variables.

Here's another example of how to use a `mutatingPostResolve` hook to rewrite a response:

```typescript
export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {
      // generated
      TowerByKey: {
        // generated
        async mutatingPostResolve({ response }) {
          // user defined
          return {
            ...response,
            data: {
              ...response.data,
              TowerDetail: response.data?.TowerDetail?.map((detail) => ({
                ...detail,
                conductorSetHooks: detail.conductorSetHooks?.filter(
                  (csh) => csh.conductorSetHookId?.id !== '456'
                ),
              })),
            },
          }
        },
      },
    },
  },
})
```

What's best about all of this?
It's pure Node.js with TypeScript to enhance the developer experience.
You can use any npm package you like to implement your hooks,
there are no limitations.

Additionally, it's possible to call all Operations (Queries & Mutations) from the hooks environment.
This is useful, e.g. when you want to implement side effects after a successful user login.
Here's an example:

```typescript
export default configureWunderGraphServer(() => ({
  hooks: {
    authentication: {
      postAuthentication: async ({ user, operations }) => {
        if (!user.email || !user.name) {
          return;
        }
        await operations.mutate({
          operationName: 'UpsertLastLogin',
          input: {
            email: user.email,
            name: user.name,
          },
        });
      },
    },
  },
}));
```

After the authentication is successful (postAuthentication),
we upsert the user object in the database.
No extra database client is required as the database is already accessible through the mutations.

Making all Operations accessible from the hooks environment simplifies app development a lot.
In combination with the `@internalOperation` directive,
it's possible to define Operations exclusively for internal purposes.
This way, there's no need for an additional ORM or database client as the database is already accessible through Queries and Mutations.
Your stack becomes less complex, you have to deal with less complexity and your workflows are simplified.

## How to

If you're looking for more specific information on how to use Hooks,
have a look at the wundergraph.server.ts reference.
