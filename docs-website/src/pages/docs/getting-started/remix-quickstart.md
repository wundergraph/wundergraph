---
title: Remix Quickstart
pageTitle: WunderGraph - Getting started quickly with WunderGraph
description: Initialize your WunderGraph development environment and get started using WunderGraph
---

This quick start guide will help you to start a new WunderGraph project from scratch, or add WunderGraph to an existing project.

## Creating a new WunderGraph project

```shell
# Init a new project
npx create-wundergraph-app my-project --example remix

# Move to the project directory
cd my-project

# Install dependencies
npm i
```

## Start Remix and WunderGraph

```shell
npm start
```

WunderGraph will now do some code generation and start WunderNode and Remix.
A new browser window will open at [http://localhost:3000](http://localhost:3000). You should see the homepage with the JSON result of the Dragons operation.

```json
[
  { "name": "Dragon 1", "active": true },
  { "name": "Dragon 2", "active": true }
]
```

WunderGraph lives in the `.wundergraph` directory by default. This is where you can configure your WunderGraph application and write your operations.

Let's take a look at the default configuration open `.wundergraph/wundergraph.config.ts`.

You can see that we have a single API configured, which is the [SpaceX GraphQL API](https://spacex-api.fly.dev/graphql).

```ts
// the name of this const will be supplied to the apis property in the configuration
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});
```

The API is introspected and added to the WunderGraph virtual graph, as you can see here:

```ts
configureWunderGraphApplication({
  // the const defined above is provided in the array of apis here
  apis: [spaceX],
  // ...
  generate: {
    codeGenerators: [
      {
        templates: [...templates.typescript.all],
        path: './generated',
      },
      {
        templates: [templates.typescript.client],
        path: '../components/generated',
      },
    ],
  },
  // ...
});
```

We generate a type-safe client specified in the list of generators which we shall use later to make calls to our WunderNode.

Now let's take a look at the operations.

## WunderGraph client

If you head over to `lib/wundergraph.ts` you will see that we create and export a client and all the necessary hooks to use in our app. We also create a client from cookies that we will use to make authenticated requests.

## Operations

Operations are written in the `.wundergraph/operations` directory. They can be written in Graphql or TypeScript.

### GraphQL operations

Let's check out the Dragons operation, open `.wundergraph/operations/Dragons.graphql`.

```graphql
query Dragons {
  spacex_dragons {
    name
    active
  }
}
```

This simply fetches the name and active status of all the SpaceX dragons, we can run this operation in Remix by using the generated client.

### Typescript operations

Let's also checkout the users/get operation, open `.wundergraph/operations/users/get.ts`

```ts
export default createOperation.query({
  input: z.object({
    id: z.string(),
  }),
  handler: async ({ input }) => {
    return {
      id: input.id,
      name: 'Jens',
      bio: 'Founder of WunderGraph',
    };
  },
});
```

Here we create a query (you can also create mutations and subscriptions) and return sample data. You are free to perform any task, calling external api, db requests and so on.

## Calling the operation in Remix

Open `app/routes/index.tsx`, in the loader function you will find the following code:

```tsx
const res = await client.query({
  operationName: 'Dragons',
});
```

The operation name is the name of the file in the operations directory, without the extension. This will return the result of the operation.

Let's modify the Dragons operation and add a limit parameter and return extra fields.
Open `.wundergraph/operations/Dragons.graphql` and change it to:

```graphql
query Dragons($limit: Int!) {
  spacex_dragons(limit: $limit) {
    id
    name
    active
  }
}
```

The WunderGraph server will automatically pick up on the changes and re-generate the types.
Go back to `app/routes/index.tsx` and you will see that the `Dragons` operation now has a required `limit` input parameter.

```tsx
const res = await client.query({
  operationName: 'Dragons',
  input: {
    limit: 1,
  },
});
```

Refresh the page in your browser, the result will look like this:

```json
[{ "name": "Dragon 1", "active": true }]
```

For client side requests, you can use the `useQuery`, `useMutation` and `useSubscription` hooks that we exported. An example of this is in `app/routes/users/subscribe.tsx`

```ts
const { data } = useSubscription({
  operationName: 'users/subscribe',
  input: {
    id: '1',
  },
});
```

## Authentication

At one point or another you will need authentication. If you go back to `wundergraph.config.ts`, you can see we have configured cookie based authentication. The demo auth provider uses github. There is no need to setup any env.

```ts
authentication: {
  cookieBased: {
    providers: [authProviders.demo()],
    authorizedRedirectUriRegexes: ['http://localhost:3000*'],
    ...
  },
},
```

We define an operation using typescript in `.wundergraph/operations/users/update.ts` and specify that it requires auth.

```ts
export default createOperation.mutation({
  input: z.object({
    id: z.string(),
    name: z.string(),
    bio: z.string(),
  }),
  requireAuthentication: true,
  handler: async ({ input }) => {
    return {
      ...input,
    };
  },
});
```

Now go to `app/routes/users/update.tsx`. We import the `useAuth` that we created earlier, which gives us methods to login and logout. We can get the current user as well with the `useUser` hook.

```tsx
const { login, logout } = useAuth();
const { data: user } = useUser();
...

<button
  type="button"
  onClick={() => {
    !user ? login('github') : logout();
  }}
>
  {!user ? 'Login to update user' : 'Logout'}
</button>
```

Within the action function we create an authenticated client by passing the request object. We extract the cookie and pass it as an extra header. This is required only on the server side for operations that require auth.

```ts
const client = createClientFromCookies(request);
```

## What's next?

Wunderbar! You added your first couple of APIs to Remix. Next up you might want to add a database, authentication and support uploads to turn Remix into a full stack powerhouse 😎.

- [Databases](/docs/databases)
- [Authentication](/docs/auth)
- [File Storage](/docs/file-storage)

### Guides

Learn more advanced topics in our [guides](/docs/guides) and get comfortable with WunderGraph.

### More Examples

Have a look at [other examples](/docs/examples) we provide, to get a better understanding of WunderGraph.

### Want to know more about WunderGraph?

If you're not yet sure what kind of problems WunderGraph can solve for you,
check out [the different use cases](/docs/use-cases) we support,
and the different [features](/docs/features) we provide.
You might also be interested to learn more about the [architecture](/docs/architecture) of WunderGraph.
If you haven't read our [Manifesto](/manifesto) yet, it's a great way to better understand what we're working on and why.

If you've got questions, please [join our Discord community](https://wundergraph.com/discord) or [contact us](https://wundergraph.com/contact/sales).
